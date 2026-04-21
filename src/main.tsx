
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { SystemProvider } from "./app/context/SystemContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <SystemProvider>
      <App />
    </SystemProvider>,
  );
  