import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { model, messages, temperature } = req.body;
    const apiKey = process.env.VITE_4EVERLAND_API_KEY || 'f0750ba86ebae58e583d0536ebc22d41';

    const response = await fetch('https://ai.api.4everland.org/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: temperature || 0.7, stream: true }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    res.setHeader('Content-Type', 'text/event-stream');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
