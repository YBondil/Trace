import { createSignal, createEffect, For, Show, onMount } from "solid-js";

function DailyEntry() {
  const [userText, setUserText] = createSignal("");
  const [saved, setSaved] = createSignal(false);
  const [photos, setPhotos] = createSignal([]);

  createEffect(() => {
    if (saved()) {
      localStorage.setItem("daySaved", JSON.stringify(true));
      localStorage.setItem("todayPhoto", JSON.stringify(photos()));
    }
  });
  onMount(async () => {
    try {
      const response = await fetch("http://localhost:3000/api/entries/latest");
      if (response.ok) {
        const data = await response.json();
        setUserText(data.content);

        // Si le serveur nous a renvoyé des URLs d'images
        if (data.photoUrls && data.photoUrls.length > 0) {
          const loadedPhotos = data.photoUrls.map((url) => ({
            id: crypto.randomUUID(),
            preview: url, // On utilise directement l'URL publique de Cloudflare
            file: null, // Pas de fichier physique car il est déjà sur le serveur
          }));
          setPhotos(loadedPhotos);
        }

        setSaved(true);
      }
    } catch (error) {
      console.error("Impossible de récupérer l'historique :", error);
    }
  });
  const saveText = async () => {
    const formData = new FormData();
    formData.append("text", userText());
    formData.append("date", new Date().toISOString());

    photos().forEach((photo) => {
      formData.append("photos", photo.file);
    });

    try {
      const response = await fetch("http://localhost:3000/api/entries", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Réponse du serveur :", data);
        setSaved(true);
      } else {
        console.error("Erreur côté serveur");
      }
    } catch (error) {
      console.error("Impossible de joindre le serveur :", error);
    }
  };
  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);

    const newPhotos = files.map((file) => {
      return {
        id: crypto.randomUUID(),
        file: file,
        preview: URL.createObjectURL(file),
      };
    });

    setPhotos([...photos(), ...newPhotos]);
    setSaved(false);
  };

  const deletePhoto = (photo) => {
    setPhotos(photos().filter((item) => item.id !== photo.id));
  };

  return (
    <div class="page">
      <div class="date-header">
        <p class="date-text">{new Date().toLocaleDateString()}</p>
        <p class="prompt-text">Trace time ! How was today ?</p>
      </div>

      <textarea
        id="today"
        class="notebook-textarea"
        name="today"
        rows="10"
        onInput={(e) => {
          setUserText(e.currentTarget.value);
          setSaved(false);
        }}
        value={userText()}
        placeholder="Cher journal..."
      ></textarea>

      <div class="actions-container">
        <button class="btn-save" onClick={() => saveText()}>
          {saved() ? "Sauvegardé ✓" : "Sauvegarder"}
        </button>
        <label for="photo-upload" class="btn-upload">
          📸 Ajouter une photo
        </label>
        <input
          id="photo-upload"
          type="file"
          class="file-input-hidden"
          accept="image/*"
          onChange={handlePhotos}
          multiple
        />
      </div>

      <Show when={photos().length > 0}>
        <div class="photo-gallery">
          <For each={photos()}>
            {(photo) => (
              <div class="polaroid-wrapper">
                {/* On utilise photo.preview au lieu de photo.data */}
                <img
                  src={photo.preview}
                  alt="Ma trace du jour"
                  class="polaroid-image"
                />
                <button
                  class="delete-btn"
                  onClick={() => deletePhoto(photo)}
                  title="Supprimer la photo"
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

export default DailyEntry;
