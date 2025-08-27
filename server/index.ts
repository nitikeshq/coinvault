import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";

// Load env variables
dotenv.config();
const app = express();

// CORS configuration to allow credentials (cookies)
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

  // Dynamic manifest endpoint
  app.get("/manifest.json", async (req, res) => {
    try {
      const { storage } = await import("./storage");
      const settings = await storage.getWebsiteSettings();
      const siteName = settings?.siteName || "Crypto Wallet";
      const shortName = settings?.siteName && settings.siteName.length > 12 ? 
        settings.siteName.substring(0, 12) : 
        (settings?.siteName || "CryptoWallet");
      
      const manifest = {
        name: siteName,
        short_name: shortName,
        description: settings?.seoDescription || "Secure BEP-20 token wallet for cryptocurrency trading and management",
        start_url: "/",
        display: "standalone",
        background_color: settings?.primaryColor || "#0F172A",
        theme_color: settings?.primaryColor || "#0F172A",
        orientation: "portrait",
        categories: ["finance", "business", "productivity"],
        lang: "en",
        dir: "ltr",
        scope: "/",
        icons: [
          {
            src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE5MiIgaGVpZ2h0PSIxOTIiIHJ4PSI0OCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz48cGF0aCBkPSJNNDggOTZjMC0yNi41MSAyMS40OS00OCA0OC00OGgyNGMxMy4yNSAwIDI0IDEwLjc1IDI0IDI0djBjMCAxMy4yNS0xMC43NSAyNC0yNCAyNEg5NmMtMTMuMjUgMC0yNCA2LjMtMjQgMjR2MjRjMCAxMy4yNSAxMC43NSAyNCAyNCAyNGgyNGMxMy4yNSAwIDI0IDEwLjc1IDI0IDI0djBjMCAxMy4yNS0xMC43NSAyNC0yNCAyNEg5NmMtMjYuNTEgMC00OC0yMS40OS00OC00OFY5NnoiIGZpbGw9IndoaXRlIi8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMTkyIiB5Mj0iMTkyIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iIzA1OTY2OSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0Y1OUUwQiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg==",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ],
        shortcuts: [
          {
            name: "Wallet",
            short_name: "Wallet", 
            description: "View wallet balance",
            url: "/?section=wallet"
          }
        ],
        prefer_related_applications: false
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json(manifest);
    } catch (error) {
      console.error('Error generating manifest:', error);
      res.status(500).json({ error: 'Failed to generate manifest' });
    }
  });

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5771', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
