import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import DailyEntry from "./DailyEntry.jsx";
import Calendar from "./Calendar.jsx";
import "./index.css";
import App from "./App.jsx";

const root = document.getElementById("root");

render(
  () => (
    <Router root={App}>
      <Route path="/" component={DailyEntry} />
      <Route path="/calendar" component={Calendar} />
    </Router>
  ),
  root,
);
