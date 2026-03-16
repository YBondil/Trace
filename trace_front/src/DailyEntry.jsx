import { createSignal, onMount, For, Show } from "solid-js";

function DailyEntry() {
  const [userText, setUserText] = createSignal("");
  const [saved, setSaved] = createSignal(false);
  const [photos, setPhotos] = createSignal([]);

  // NOUVEAUX ÉTATS
  const [hasEntryToday, setHasEntryToday] = createSignal(false);
  const [isEditing, setIsEditing] = createSignal(false);
  const [entryId, setEntryId] = createSignal(null);

  onMount(async () => {
    try {
      const response = await fetch("http://localhost:3000/api/entries/latest");
      if (response.ok) {
        const data = await response.json();

        // --- LOGIQUE DE VÉRIFICATION DE LA DATE ---
        const today = new Date().toDateString();
        const entryDate = new Date(data.date).toDateString();

        if (today === entryDate) {
          setHasEntryToday(true);
          setEntryId(data.id);
          setUserText(data.content);

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

    // Si on est en train d'éditer, on appelle la route d'update
    const url = isEditing()
      ? `http://localhost:3000/api/entries/${entryId()}/update`
      : "http://localhost:3000/api/entries";

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

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      id: crypto.randomUUID(),
      file: file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos([...photos(), ...newPhotos]);
    setSaved(false);
  };

  const deletePhoto = (photo) => {
    setPhotos(photos().filter((item) => item.id !== photo.id));
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
                : "Trace time ! How was today ?"}
            </p>

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
              <label for="photo-upload" class="btn-upload">
                📸 Ajouter
              </label>
              <input
                id="photo-upload"
                type="file"
                class="file-input-hidden"
                accept="image/*"
                onChange={handlePhotos}
                multiple
              />

              <Show when={isEditing()}>
                <button class="btn-cancel" onClick={() => setIsEditing(false)}>
                  Annuler
                </button>
              </Show>
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
        <div
          class="already-done-container"
          style={{ "text-align": "center", padding: "40px 20px" }}
        >
          <div style={{ "font-size": "4rem", "margin-bottom": "20px" }}>✨</div>
          <h2 style={{ "margin-bottom": "10px" }}>
            Vous avez déjà une trace d'aujourd'hui !
          </h2>
          <p style={{ color: "#666", "margin-bottom": "30px" }}>
            Revenez demain pour une nouvelle exploration.
          </p>

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
