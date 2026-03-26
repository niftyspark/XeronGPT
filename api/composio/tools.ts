import { VercelRequest, VercelResponse } from '@vercel/node';
import { Composio } from 'composio-core';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const socialMediaApps = "twitter,linkedin,instagram,facebook,reddit";
    const response = await composio.actions.list({
      apps: socialMediaApps
    });
    res.json(response.items);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch Composio tools" });
  }
}
