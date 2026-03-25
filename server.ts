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

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HuggingFace API Error: ${response.status} - ${errorText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      res.json({ image: `data:image/jpeg;base64,${base64Image}` });
    } catch (error: any) {
      console.error('Image Generation Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for 4EVERLAND Chat API
  app.post("/api/chat", async (req, res) => {
    try {
      const { model, messages, temperature } = req.body;
      const apiKey = process.env.VITE_4EVERLAND_API_KEY || 'f0750ba86ebae58e583d0536ebc22d41';

      const response = await fetch('https://ai.api.4everland.org/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: temperature || 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
      res.end();
    } catch (error: any) {
      console.error('Chat Proxy Error:', error);
      res.status(500).json({ error: error.message });
    }
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
