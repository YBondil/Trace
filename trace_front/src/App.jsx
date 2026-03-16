import { A } from "@solidjs/router";
import "./App.css";

function App(props) {
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
