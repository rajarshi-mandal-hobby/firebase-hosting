import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import React from "react";
import "./globals/global.css";
import "./globals/global.extentions.ts"; 

ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
      <App />
   </React.StrictMode>
);
