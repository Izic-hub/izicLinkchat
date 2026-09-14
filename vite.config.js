import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "LinkChat",
        short_name: "LinkChat",
        description: "Your Group. Your People. One Conversation.",
        theme_color: "#4338CA",
        background_color: "#F3F4FA",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Caches the app shell so it still loads (with cached data) if the
        // connection drops — actual live data (messages, etc.) still needs
        // a real connection, this just stops the app itself going blank.
        globPatterns: ["**/*.{js,css,html,svg,png}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes("supabase.co") && url.pathname.includes("/storage/"),
            handler: "CacheFirst",
            options: { cacheName: "linkchat-images", expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 } },
          },
        ],
      },
    }),
  ],
});
