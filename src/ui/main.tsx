import { MantineProvider } from "@mantine/core";
import { createRoot } from "react-dom/client";
import { SidePanel } from "./SidePanel";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <MantineProvider defaultColorScheme="auto">
      <SidePanel />
    </MantineProvider>,
  );
}
