import { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });

    if (!response.ok) return res.status(response.status).json({ error: `Failed to fetch URL: ${response.statusText}` });

    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, noscript, iframe, img, svg, video, audio, canvas').remove();

    let text = $('body').text().replace(/\s+/g, ' ').trim();

    const links: { text: string; href: string }[] = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const linkText = $(el).text().trim();
      if (href && href.startsWith('http') && linkText) {
        links.push({ text: linkText, href });
      }
    });

    const maxLength = 40000;
    if (text.length > maxLength) text = text.substring(0, maxLength) + "... (truncated)";

    res.json({ 
      url,
      title: $('title').text().trim(),
      content: text,
      links: links.slice(0, 50)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to browse URL" });
  }
}
