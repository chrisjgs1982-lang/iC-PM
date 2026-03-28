import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "iC-PM – Projekt Manager",
        short_name: "iC-PM",
        description: "Marketing Projektmanagement",
        theme_color: "#3B82F6",
        background_color: "#1e1e2e",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ],
  server: {
    proxy: {
      "/api": { target: "http://localhost:3000", rewrite: p => p.replace(/^\/api/, "") }
    }
  }
});
