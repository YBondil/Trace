import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import "./index.css";
import App from "./App.jsx";

const root = document.getElementById("root");

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  root,
);
