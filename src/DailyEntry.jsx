import { createSignal, createEffect, For, Show } from "solid-js";

function DailyEntry() {
  const [userText, setUserText] = createSignal(
    localStorage.getItem("todayText") || "",
  );
  const [saved, setSaved] = createSignal(
    JSON.parse(localStorage.getItem("daySaved")) || false,
  );
  const [photos, setPhotos] = createSignal(
    JSON.parse(localStorage.getItem("todayPhoto")) || [],
  );

  createEffect(() => {
    if (saved()) {
      localStorage.setItem("daySaved", JSON.stringify(true));
      localStorage.setItem("todayPhoto", JSON.stringify(photos()));
    }
  });

  const saveText = () => {
    setSaved(true);
    localStorage.setItem("todayText", userText());
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([
          ...photos(),
          { id: crypto.randomUUID(), data: reader.result },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };
  const deletePhoto = (photo) => {
    setPhotos(
      photos().filter((item) => {
        return item.id !== photo.id;
      }),
    );
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
                <img
                  src={photo.data}
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
