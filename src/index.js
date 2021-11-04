import "./styles/index.css";

import { StrictMode } from "react";
import { render } from "react-dom";

import App from "components/App";

render(
  <StrictMode>
    <App/>
  </StrictMode>,
  document.getElementById("root")
);

if (process.env.NODE_ENV === "production") {
  navigator.serviceWorker.register("./sw.js").catch(console.log);
}
