import express from "express";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import cors from "cors";
import path from "path";
import { Composio } from "composio-core";

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/browse", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch URL: ${response.statusText}` });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove scripts, styles, and other non-content tags
      $('script, style, noscript, iframe, img, svg, video, audio, canvas').remove();

      // Extract text content
      let text = $('body').text();
      
      // Clean up whitespace
      text = text.replace(/\s+/g, ' ').trim();

      // Extract links for navigation
      const links: { text: string; href: string }[] = [];
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const linkText = $(el).text().trim();
        if (href && href.startsWith('http') && linkText) {
          links.push({ text: linkText, href });
        }
      });

      // Limit text length to avoid massive payloads
      const maxLength = 40000;
      if (text.length > maxLength) {
        text = text.substring(0, maxLength) + "... (truncated)";
      }

      res.json({ 
        url,
        title: $('title').text().trim(),
        content: text,
        links: links.slice(0, 50) // Return top 50 links
      });
    } catch (error: any) {
      console.error("Browse error:", error);
      res.status(500).json({ error: error.message || "Failed to browse URL" });
    }
  });

  app.get("/api/composio/tools", async (req, res) => {
    try {
      // Filter for social media apps
      const socialMediaApps = "twitter,linkedin,instagram,facebook,reddit";
      const response = await composio.actions.list({
        apps: socialMediaApps
      });
      res.json(response.items);
    } catch (error: any) {
      console.error("Composio tools error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch Composio tools" });
    }
  });

  app.post("/api/composio/execute", async (req, res) => {
    try {
      const { action, parameters } = req.body;
      const result = await composio.actions.execute({
        actionName: action,
        requestBody: {
          input: parameters
        }
      });
      res.json(result);
    } catch (error: any) {
      console.error("Composio execution error:", error);
      res.status(500).json({ error: error.message || "Failed to execute Composio action" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
