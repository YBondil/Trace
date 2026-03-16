import express from "express";
import cors from "cors";
import pkg from "pg";
import "dotenv/config";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const { Pool } = pkg;
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- CONNEXION BASE DE DONNÉES ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(() => console.log("🟢 Connecté à PostgreSQL"))
  .catch((err) => console.error("🔴 Erreur PostgreSQL :", err));

// --- CONFIGURATION CLOUDFLARE R2 ---
// On crée notre client S3 qui utilise les clés de ton .env
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Multer va intercepter les fichiers et les garder temporairement en mémoire (RAM)
const upload = multer({ storage: multer.memoryStorage() });

// --- ROUTES ---

app.get("/", (req, res) => {
  res.send({ message: "Bienvenue sur l'API de Trace !" });
});

app.get("/api/entries/latest", async (req, res) => {
  try {
    const query = "SELECT * FROM entries ORDER BY date DESC LIMIT 1";
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      const entry = result.rows[0];

      // On vérifie si la ligne contient des photos (au format JSON)
      const photosArray = entry.photos ? entry.photos : [];

      // On crée les liens complets pour le frontend
      const photosUrls = photosArray.map((nomFichier) => {
        return `${process.env.R2_PUBLIC_URL}/${nomFichier}`;
      });

      // On renvoie l'entrée avec un nouveau champ "photoUrls"
      res.status(200).send({
        ...entry,
        photoUrls: photosUrls,
      });
    } else {
      res.status(404).send({ message: "Aucune trace trouvée." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur serveur" });
  }
});

// --- SAUVEGARDE (TEXTE + PHOTOS) ---
// upload.array('photos') dit à Express de s'attendre à recevoir une ou plusieurs images
app.post("/api/entries", upload.array("photos"), async (req, res) => {
  try {
    const { text, date } = req.body;
    const files = req.files; // Les images récupérées par Multer

    let uploadedPhotos = [];

    // 1. Envoi des images vers Cloudflare R2
    if (files && files.length > 0) {
      for (const file of files) {
        // On génère un nom unique pour ne pas écraser d'anciennes photos (ex: 17105000-photo.jpg)
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        // On expédie le fichier dans le Bucket
        await s3Client.send(command);

        // On retient le nom du fichier pour la base de données
        uploadedPhotos.push(fileName);
      }
    }

    // 2. Sauvegarde du texte et du nom des images dans PostgreSQL
    const query =
      "INSERT INTO entries (content, date, photos) VALUES ($1, $2, $3) RETURNING *";
    // On transforme notre tableau de noms en texte JSON pour la BDD
    const values = [text, date, JSON.stringify(uploadedPhotos)];

    const result = await pool.query(query, values);

    console.log("Nouvelle trace sauvegardée :", result.rows[0]);
    res.status(201).send({
      message: "Entrée sauvegardée avec succès",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde :", error);
    res.status(500).send({ message: "Erreur lors de la sauvegarde" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
