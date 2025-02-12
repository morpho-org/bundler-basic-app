import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Create a basic layout component
const Layout = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      backgroundColor: "#121212",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
    }}
  >
    {children}
  </div>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Layout>
      <App />
    </Layout>
  </StrictMode>
);
