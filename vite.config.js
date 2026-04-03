import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

function firebaseSwPlugin() {
  let env;
  return {
    name: "firebase-sw-inject",
    config(_, { mode }) {
      env = loadEnv(mode, process.cwd(), "");
    },
    buildStart() {
      const template = fs.readFileSync(
        path.resolve(__dirname, "src/firebase-messaging-sw.template.js"),
        "utf-8"
      );
      const result = template
        .replace(/__VITE_FIREBASE_API_KEY__/g, env.VITE_FIREBASE_API_KEY ?? "")
        .replace(/__VITE_FIREBASE_AUTH_DOMAIN__/g, env.VITE_FIREBASE_AUTH_DOMAIN ?? "")
        .replace(/__VITE_FIREBASE_PROJECT_ID__/g, env.VITE_FIREBASE_PROJECT_ID ?? "")
        .replace(/__VITE_FIREBASE_STORAGE_BUCKET__/g, env.VITE_FIREBASE_STORAGE_BUCKET ?? "")
        .replace(/__VITE_FIREBASE_MESSAGING_SENDER_ID__/g, env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "")
        .replace(/__VITE_FIREBASE_APP_ID__/g, env.VITE_FIREBASE_APP_ID ?? "")
        .replace(/__VITE_FIREBASE_MEASUREMENT_ID__/g, env.VITE_FIREBASE_MEASUREMENT_ID ?? "");
      fs.writeFileSync(
        path.resolve(__dirname, "public/firebase-messaging-sw.js"),
        result,
        "utf-8"
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), firebaseSwPlugin()],
});
