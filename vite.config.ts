import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    pure: ["console.log"],
    drop: ["debugger"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              /node_modules\/(react|react-dom|react-router-dom|scheduler)\//.test(
                id
              )
            ) {
              return "react-core"
            }
            return "vendor"
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/api": { target: "http://localhost:8788", changeOrigin: true },
      "/cdn": { target: "http://localhost:8788", changeOrigin: true },
    },
  },
})
