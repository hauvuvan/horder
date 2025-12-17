// Vercel Serverless Function Adapter
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Vercel might pass VercelRequest which is IncomingMessage compatible
    // Express app(req, res) expects standard node http objects
    // It should work directly
    return app(req as any, res as any);
}

