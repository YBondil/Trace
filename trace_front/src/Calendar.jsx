import { createSignal, onMount, For, Show, createMemo } from "solid-js";

function Calendar() {
  const [entryDates, setEntryDates] = createSignal([]);
  const [selectedEntry, setSelectedEntry] = createSignal(null);
  const [isEditing, setIsEditing] = createSignal(false);
  const [editText, setEditText] = createSignal("");

  // NOUVEAU : Un signal pour savoir quel mois on est en train de regarder
  const [currentDate, setCurrentDate] = createSignal(new Date());

  onMount(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/entries/dates`,
      );
      if (response.ok) {
        const data = await response.json();
        setEntryDates(data);
      }
    } catch (error) {
      console.error("Impossible de récupérer les dates :", error);
    }
  });

  const loadEntry = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/entries/${id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedEntry(data);
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };
  const deleteEntry = async (id) => {
    // Une petite sécurité standard pour éviter les clics accidentels
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette trace ? Cette action est irréversible.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/entries/${id}`,
        {
          method: "DELETE", // On utilise bien la méthode DELETE
        },
      );

      if (response.ok) {
        setSelectedEntry(null); // On ferme la vue de la trace

        // On rappelle le serveur pour mettre à jour la liste des dates
        // (ça va instantanément "décolorer" la case du calendrier !)
        const datesResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/entries/dates`,
        );
        if (datesResponse.ok) {
          const data = await datesResponse.json();
          setEntryDates(data);
        }
      } else {
        console.error("Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };
  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("text", editText());

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/entries/${selectedEntry().id}/update`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (response.ok) {
      const updated = await response.json();
      setSelectedEntry({ ...selectedEntry(), content: editText() });
      setIsEditing(false);
    }
  };
  // --- LOGIQUE DU CALENDRIER ---

  // 1. On transforme la liste du serveur en un dictionnaire { "2024-3-16": id_de_la_trace }
  const tracesMap = createMemo(() => {
    const map = {};
    entryDates().forEach((entry) => {
      const d = new Date(entry.date);
      // On crée une clé textuelle simple "Année-Mois-Jour"
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      map[key] = entry.id;
    });
    return map;
  });

  // 2. On calcule toutes les cases à afficher dans la grille du mois
  const calendarDays = createMemo(() => {
    const year = currentDate().getFullYear();
    const month = currentDate().getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // Quel jour de la semaine tombe le 1er ?
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Combien de jours dans ce mois ?

    // En JavaScript, Dimanche = 0. On décale pour que la semaine commence le Lundi
    const emptyDaysCount = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];
    // On ajoute des cases vides (null) pour aligner le 1er jour sous la bonne colonne
    for (let i = 0; i < emptyDaysCount; i++) {
      days.push(null);
    }
    // On ajoute les vrais jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  });

  // Fonctions pour naviguer entre les mois
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate().getFullYear(), currentDate().getMonth() + 1, 1),
    );
  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate().getFullYear(), currentDate().getMonth() - 1, 1),
    );

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div class="page">
      <h2>Calendrier de vos explorations</h2>

      {/* 1. L'AFFICHAGE DE LA TRACE */}
      <Show when={selectedEntry()}>
        <div
          class="entry-detail"
          style={{
            "background-color": "#f9f9f9",
            padding: "20px",
            "border-radius": "10px",
            "margin-bottom": "20px",
          }}
        >
          {/* Barre d'outils du haut */}
          <div
            style={{
              display: "flex",
              "justify-content": "space-between",
              "align-items": "center",
              "margin-bottom": "15px",
            }}
          >
            <button
              onClick={() => {
                setSelectedEntry(null);
                setIsEditing(false);
              }}
              style={{ cursor: "pointer", padding: "5px 10px" }}
            >
              ← Retour
            </button>

            <div style={{ display: "flex", gap: "10px" }}>
              <Show when={!isEditing()}>
                <button
                  onClick={() => {
                    setEditText(selectedEntry().content);
                    setIsEditing(true);
                  }}
                  style={{
                    cursor: "pointer",
                    padding: "5px 10px",
                    background: "#2196F3",
                    color: "white",
                    border: "none",
                    "border-radius": "4px",
                  }}
                >
                  ✏️ Modifier
                </button>
              </Show>
              <button
                onClick={() => deleteEntry(selectedEntry().id)}
                style={{
                  cursor: "pointer",
                  padding: "5px 10px",
                  "background-color": "#ff4444",
                  color: "white",
                  border: "none",
                  "border-radius": "4px",
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>

          <h3>
            Trace du {new Date(selectedEntry().date).toLocaleDateString()}
          </h3>

          {/* Zone de contenu : soit le texte, soit le formulaire d'édition */}
          <Show
            when={isEditing()}
            fallback={
              <p
                style={{
                  "white-space": "pre-wrap",
                  "font-size": "1.1rem",
                  "line-height": "1.5",
                }}
              >
                {selectedEntry().content}
              </p>
            }
          >
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "10px",
              }}
            >
              <textarea
                value={editText()}
                onInput={(e) => setEditText(e.target.value)}
                style={{
                  width: "100%",
                  height: "150px",
                  padding: "10px",
                  "border-radius": "8px",
                  border: "1px solid #ccc",
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleUpdate}
                  style={{
                    padding: "8px 15px",
                    background: "#4CAF50",
                    color: "white",
                    border: "none",
                    "border-radius": "4px",
                    cursor: "pointer",
                  }}
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "8px 15px",
                    background: "#ccc",
                    border: "none",
                    "border-radius": "4px",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </Show>

          {/* Galerie photos (toujours visible) */}
          <Show
            when={
              selectedEntry().photoUrls && selectedEntry().photoUrls.length > 0
            }
          >
            <div
              class="photo-gallery"
              style={{
                "margin-top": "20px",
                display: "flex",
                "flex-wrap": "wrap",
                gap: "15px",
              }}
            >
              <For each={selectedEntry().photoUrls}>
                {(url) => (
                  <div class="polaroid-wrapper">
                    <img src={url} alt="Souvenir" class="polaroid-image" />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
      {/* 2. LE NOUVEAU CALENDRIER EN GRILLE */}
      <Show when={!selectedEntry()}>
        <div
          class="calendar-container"
          style={{
            "max-width": "450px",
            margin: "0 auto",
            "background-color": "#fff",
            padding: "20px",
            "border-radius": "12px",
            "box-shadow": "0 4px 6px rgba(0,0,0,0.05)",
          }}
        >
          {/* En-tête : Navigation des mois */}
          <div
            style={{
              display: "flex",
              "justify-content": "space-between",
              "align-items": "center",
              "margin-bottom": "20px",
            }}
          >
            <button
              onClick={prevMonth}
              style={{
                cursor: "pointer",
                border: "none",
                background: "#f0f0f0",
                "border-radius": "50%",
                width: "30px",
                height: "30px",
              }}
            >
              ❮
            </button>
            <h3 style={{ margin: 0, "text-transform": "capitalize" }}>
              {currentDate().toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={nextMonth}
              style={{
                cursor: "pointer",
                border: "none",
                background: "#f0f0f0",
                "border-radius": "50%",
                width: "30px",
                height: "30px",
              }}
            >
              ❯
            </button>
          </div>

          {/* Jours de la semaine (Lun, Mar...) */}
          <div
            style={{
              display: "grid",
              "grid-template-columns": "repeat(7, 1fr)",
              gap: "5px",
              "margin-bottom": "10px",
              "text-align": "center",
              "font-weight": "bold",
              color: "#888",
              "font-size": "0.9rem",
            }}
          >
            <For each={weekDays}>{(day) => <div>{day}</div>}</For>
          </div>

          {/* La grille avec les numéros des jours */}
          <div
            style={{
              display: "grid",
              "grid-template-columns": "repeat(7, 1fr)",
              gap: "8px",
            }}
          >
            <For each={calendarDays()}>
              {(dateObj) => {
                // Si c'est une case vide (avant le 1er du mois)
                if (!dateObj)
                  return <div style={{ "min-height": "40px" }}></div>;

                // On vérifie si ce jour précis existe dans notre dictionnaire (tracesMap)
                const dateKey = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
                const traceId = tracesMap()[dateKey];
                const hasTrace = traceId !== undefined;

                return (
                  <div
                    class={`calendar-day ${hasTrace ? "has-trace" : ""}`}
                    onClick={() => (hasTrace ? loadEntry(traceId) : null)}
                  >
                    {dateObj.getDate()}
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default Calendar;
