import { createSignal, onMount, For, Show } from "solid-js";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

function DailyEntry() {
  const [userText, setUserText] = createSignal("");
  const [saved, setSaved] = createSignal(false);
  const [photos, setPhotos] = createSignal([]);
  const [selectedColor, setSelectedColor] = createSignal("#4CAF50");

  // NOUVEAUX ÉTATS
  const [hasEntryToday, setHasEntryToday] = createSignal(false);
  const [isEditing, setIsEditing] = createSignal(false);
  const [entryId, setEntryId] = createSignal(null);

  const colorOptions = [
    { id: "vert", label: "Anecdote", hex: "#4CAF50" },
    { id: "rouge", label: "Soirée", hex: "#F44336" },
    { id: "bleu", label: "Travail", hex: "#2196F3" },
    { id: "jaune", label: "Sport", hex: "#FFC107" },
    { id: "violet", label: "Sortie", hex: "#9C27B0" },
    { id: "orange", label: "Victoire", hex: "#FF9800" },
    { id: "gris", label: "Rien", hex: "#9E9E9E" },
  ];

  onMount(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/entries/latest`,
      );
      if (response.ok) {
        const data = await response.json();

        // --- LOGIQUE DE VÉRIFICATION DE LA DATE ---
        const today = new Date().toDateString();
        const entryDate = new Date(data.date).toDateString();

        if (today === entryDate) {
          setHasEntryToday(true);
          setEntryId(data.id);
          setUserText(data.content);
          if (data.color) setSelectedColor(data.color);

          if (data.photoUrls) {
            const loadedPhotos = data.photoUrls.map((url) => ({
              id: crypto.randomUUID(),
              preview: url,
              file: null,
            }));
            setPhotos(loadedPhotos);
          }
          setSaved(true);
        }
      }
    } catch (error) {
      console.error("Impossible de récupérer l'historique :", error);
    }
  });

  const saveText = async () => {
    const formData = new FormData();
    formData.append("text", userText());
    formData.append("color", selectedColor());
    // Si on est en train d'éditer, on appelle la route d'update
    const url = isEditing()
      ? `${import.meta.env.VITE_API_URL}api/entries/${entryId()}/update`
      : `${import.meta.env.VITE_API_URL}api/entries`;

    // Note : Pour l'update, on ajoute la date seulement si c'est une nouvelle entrée
    if (!isEditing()) formData.append("date", new Date().toISOString());

    photos().forEach((photo) => {
      if (photo.file) formData.append("photos", photo.file);
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSaved(true);
        setHasEntryToday(true);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Erreur sauvegarde :", error);
    }
  };

  const deletePhoto = (photo) => {
    setPhotos(photos().filter((item) => item.id !== photo.id));
    setSaved(false);
  };
  const prendreNouvellePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri, // Récupère une URI utilisable localement
        source: CameraSource.Prompt, // Propose à l'utilisateur : Caméra ou Galerie
      });

      // On convertit le fichier local en Blob/File pour que ton FormData l'accepte
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // On ajoute la nouvelle photo au signal existant
      const newPhoto = {
        id: crypto.randomUUID(),
        file: file,
        preview: image.webPath, // webPath permet l'affichage direct dans l'app
      };

      setPhotos([...photos(), newPhoto]);
      setSaved(false);
    } catch (error) {
      console.error("Action annulée ou erreur caméra :", error);
    }
  };
  const choisirDepuisGalerie = async () => {
    try {
      const images = await Camera.pickImages({
        quality: 90,
        limit: 5, // Tu peux limiter le nombre de photos sélectionnables en même temps
      });

      // On boucle sur toutes les images sélectionnées
      for (let img of images.photos) {
        await ajouterPhotoAuState(img.webPath);
      }
    } catch (error) {
      console.error("Sélection annulée", error);
    }
  };

  // Fonction utilitaire pour convertir le webPath en File et l'ajouter à SolidJS
  const ajouterPhotoAuState = async (webPath) => {
    const response = await fetch(webPath);
    const blob = await response.blob();
    const file = new File(
      [blob],
      `photo_${Date.now()}_${crypto.randomUUID()}.jpg`,
      { type: "image/jpeg" },
    );

    const newPhoto = {
      id: crypto.randomUUID(),
      file: file,
      preview: webPath,
    };

    setPhotos((prev) => [...prev, newPhoto]);
    setSaved(false);
  };
  return (
    <div class="page">
      <div class="date-header">
        <p class="date-text">{new Date().toLocaleDateString()}</p>
      </div>

      <Show
        when={hasEntryToday() && !isEditing()}
        fallback={
          /* --- ÉCRAN DE RÉDACTION OU ÉDITION --- */
          <div class="entry-container">
            <p class="prompt-text">
              {isEditing()
                ? "Modification de votre trace..."
                : "Trace time ! Comment était ta journée ?"}
            </p>
            <div class="mood-container">
              <label for="mood-select" class="mood-label">
                Humeur du jour :
              </label>

              <select
                id="mood-select"
                class="mood-select"
                value={selectedColor()}
                onInput={(e) => {
                  setSelectedColor(e.currentTarget.value);
                  setSaved(false);
                }}
              >
                <For each={colorOptions}>
                  {(color) => <option value={color.hex}>{color.label}</option>}
                </For>
              </select>

              {/* La pastille de couleur (seul le background est dynamique via le style) */}
              <div
                class="mood-indicator"
                style={{ "background-color": selectedColor() }}
              />
            </div>
            <textarea
              id="today"
              class="notebook-textarea"
              onInput={(e) => {
                setUserText(e.currentTarget.value);
                setSaved(false);
              }}
              value={userText()}
              placeholder="Cher journal..."
            ></textarea>

            <div class="actions-container">
              <button class="btn-save" onClick={saveText}>
                {saved() ? "Sauvegardé ✓" : "Enregistrer la trace"}
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  class="btn-upload"
                  onClick={prendreNouvellePhoto}
                  type="button"
                >
                  📸 Prendre
                </button>
                <button
                  class="btn-upload"
                  onClick={choisirDepuisGalerie}
                  type="button"
                >
                  🖼️ Galerie
                </button>
              </div>
            </div>

            <div class="photo-gallery">
              <For each={photos()}>
                {(photo) => (
                  <div class="polaroid-wrapper">
                    <img src={photo.preview} class="polaroid-image" />
                    <button
                      class="delete-btn"
                      onClick={() => deletePhoto(photo)}
                    >
                      ×
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>
        }
      >
        {/* --- ÉCRAN "DÉJÀ FAIT" --- */}
        <div class="already-done-container">
          <div class="status-icon">✨</div>
          <h2 style={{ "margin-bottom": "10px" }}>
            Tu as déjà une trace d'aujourd'hui !
          </h2>
          <p>Reviens demain pour une nouvelle exploration.</p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              "justify-content": "center",
            }}
          >
            <button
              class="btn-save"
              onClick={() => setIsEditing(true)}
              style={{ background: "#2196F3" }}
            >
              ✏️ Modifier ma trace
            </button>
          </div>

          <div
            class="preview-today"
            style={{ "margin-top": "40px", opacity: 0.7 }}
          >
            <p style={{ "font-style": "italic" }}>"{userText()}"</p>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default DailyEntry;
