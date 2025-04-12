import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Material Icons from CDN
const link = document.createElement("link");
link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
link.rel = "stylesheet";
document.head.appendChild(link);

// Import Inter font from Google Fonts
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// Add page title
const title = document.createElement("title");
title.textContent = "HVAC Pro - SaaS Platform for HVAC Contractors";
document.head.appendChild(title);

createRoot(document.getElementById("root")!).render(<App />);
