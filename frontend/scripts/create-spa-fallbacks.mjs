import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const indexFile = path.join(distDir, "index.html");
const spaRoutes = ["chat", "home"];

await Promise.all(
  spaRoutes.map(async (route) => {
    const routeDir = path.join(distDir, route);
    await mkdir(routeDir, { recursive: true });
    await copyFile(indexFile, path.join(routeDir, "index.html"));
  })
);

await copyFile(indexFile, path.join(distDir, "404.html"));
