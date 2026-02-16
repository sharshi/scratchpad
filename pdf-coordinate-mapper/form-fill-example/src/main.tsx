import React from "react";
import ReactDOM from "react-dom/client";
import FormFillApp from "./FormFillApp";

const root = document.getElementById("root");
if (!root) throw new Error("No root element found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <FormFillApp />
  </React.StrictMode>
);
