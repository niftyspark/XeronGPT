import { VercelRequest, VercelResponse } from '@vercel/node';
import { Composio } from 'composio-core';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    res.status(500).json({ error: error.message || "Failed to execute Composio action" });
  }
}
