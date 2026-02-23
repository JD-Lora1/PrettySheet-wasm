import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from "path"; // Necesitas instalar @types/node si da error

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      // Esto permite importar desde '@/wasm/engine' de forma limpia
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // IMPORTANTE: Aquí excluimos la ruta relativa al archivo JS generado por wasm-pack
    exclude: ["./src/wasm/engine.js"]
  },
  build: {
    target: "esnext",
    // Asegura que los archivos grandes de WASM no se rompan en el build
    assetsInlineLimit: 0, 
  },
  server: {
    // Por si acaso estás trabajando fuera de la raíz del proyecto (WSL)
    fs: {
      allow: [".."]
    }
  }
});