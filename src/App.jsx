import { Routes, Route, A } from "@solidjs/router";
import "./App.css";

function DailyEntry(props) {
  return (
    <div class="page">
      <p>{JSON.stringify(Date.now())}</p>
      <p>Trace time !</p>
    </div>
  );
}
function App() {
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
        <Routes>
          <Route path="/" component={DailyEntry} />
          <Route path="/calendar" component={Calendar} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
