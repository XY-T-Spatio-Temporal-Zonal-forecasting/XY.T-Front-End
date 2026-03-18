import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
server: {
proxy: {
"/api": "https://unrocky-contradictious-alberta.ngrok-free.dev",
},
},
base: '/XY.T-Front-End/',
plugins: [react()],
});
