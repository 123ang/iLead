import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Explicit JSX so dev/bundling never relies on implicit globals
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
      jsxImportSource: "react",
    }),
  ],
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
});
