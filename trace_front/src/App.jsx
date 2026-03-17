import { A } from "@solidjs/router";
import "./App.css";
import { onMount } from "solid-js";
import { LocalNotifications } from "@capacitor/local-notifications";

function App(props) {
  onMount(async () => {
    try {
      // 1. Demande de permission
      const permStatus = await LocalNotifications.requestPermissions();

      if (permStatus.display === "granted") {
        await configurerNotifications();
        await gererRattrapage();
      }
    } catch (error) {
      console.error("Erreur notifications :", error);
    }
  });

  const configurerNotifications = async () => {
    // 2. Création des boutons d'action (ex: Le bouton Snooze)
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: "TRACE_ACTIONS",
          actions: [
            {
              id: "WRITE",
              title: "Écrire maintenant",
            },
            {
              id: "SNOOZE",
              title: "Repousser (1 heure)",
              destructive: false,
            },
          ],
        },
      ],
    });

    // 3. Écouteur pour l'action "Snooze"
    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (action) => {
        if (action.actionId === "SNOOZE") {
          const dansUneHeure = new Date(Date.now() + 60 * 60 * 1000);

          LocalNotifications.schedule({
            notifications: [
              {
                title: "Rappel : Ta trace t'attend ! ⏳",
                body: "Tu as demandé à être rappelé. Prends 2 minutes pour documenter ta journée.",
                id: 2, // ID spécifique au snooze
                schedule: { at: dansUneHeure },
                actionTypeId: "TRACE_ACTIONS",
              },
            ],
          });
        }
      },
    );

    // 4. L'alarme quotidienne (ex: tous les jours à 20h30)
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Trace time ! 📸",
          body: "Comment s'est passée ta journée ? Ajoute ta trace !",
          id: 1, // ID de l'alarme quotidienne
          schedule: {
            allowWhileIdle: true,
            on: { hour: 20, minute: 30 },
          },
          actionTypeId: "TRACE_ACTIONS", // Attache les boutons à cette notification
        },
      ],
    });
  };

  const gererRattrapage = async () => {
    // Annuler les anciens rappels de rattrapage
    await LocalNotifications.cancel({ notifications: [{ id: 3 }] });

    try {
      // On récupère la date de la dernière trace depuis ton API Node.js
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/entries/latest`,
      );
      if (!response.ok) return;

      const data = await response.json();
      const derniereTrace = new Date(data.date);
      const aujourdhui = new Date();

      // Calcul du nombre de jours d'inactivité
      const diffTemps = aujourdhui.getTime() - derniereTrace.getTime();
      const diffJours = Math.floor(diffTemps / (1000 * 3600 * 24));

      const LIMITE_INACTIVITE = 3; // Abandon après 3 jours

      // S'il a raté 1 ou 2 jours, on programme un rattrapage le lendemain matin
      if (diffJours >= 1 && diffJours <= LIMITE_INACTIVITE) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: "Tu nous as manqué hier ! 📓",
              body: "Tu as oublié de laisser une trace. Tu peux encore rattraper les jours passés.",
              id: 3, // ID du rattrapage
              schedule: {
                allowWhileIdle: true,
                on: { hour: 10, minute: 0 }, // Rappel de rattrapage à 10h00 le matin
              },
            },
          ],
        });
      }
      // Si diffJours > 3, on ne fait rien (abandon silencieux comme prévu)
    } catch (error) {
      console.error("Erreur lors de la vérification du rattrapage", error);
    }
  };

  return (
    <div class="journal-container">
      <header class="journal-header">
        <h1>Trace</h1>
        <nav>
          {/* <A> plutot que <a> pour la navigation fluide */}
          <A href="/" end activeClass="active-link">
            Aujourd'hui
          </A>
          <A href="/calendar" activeClass="active-link">
            Calendrier
          </A>
        </nav>
      </header>

      <main class="journal-content">
        {/* C'est ici que le routeur injectera DailyEntry ou Calendar */}
        {props.children}
      </main>
    </div>
  );
}

export default App;
