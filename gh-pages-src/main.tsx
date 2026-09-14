import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

if (typeof document !== "undefined") {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<Home />);
  }
}

export default Home;
