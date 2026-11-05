import { createRoot } from "react-dom/client";
import { SpSpa } from "pankosmia-rcl";
import App from "./App";
import "./index.css";

function AppLayout() {
  return (
    <SpSpa
      requireNet={false}
      titleKey="pages:dev_tools:title"
      currentId="dev_tools"
    >
      <App />
    </SpSpa>
  );
}

createRoot(document.getElementById("root")).render(<AppLayout />);
