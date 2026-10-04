import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import { uploadsDir } from '../config/schema.js';
import { processInbox } from '../services/fleet.js';
import { decodeVin, vehiclePortraitDataUrl } from '../services/vehicleLookup.js';

const router = express.Router();

router.post('/core/invoke-llm', authenticateToken, async (req, res, next) => {
  try {
    const prompt = String(req.body?.prompt || '');

    if (/emails de réservation|booking emails/i.test(prompt)) {
      const summary = await processInbox(req.user.id);
      return res.json(summary);
    }

    const vin = prompt.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i)?.[1];
    if (vin) {
      const vehicle = await decodeVin(vin);
      return res.json(vehicle);
    }

    return res.status(422).json({
      error: 'FleetSync identifie un véhicule à partir d’un VIN (base publique NHTSA) ou traite les emails déjà importés. Aucun service d’IA externe n’est appelé.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/core/upload-file', authenticateToken, async (req, res, next) => {
  try {
    const { filename = 'image.png', data_url: dataUrl } = req.body || {};
    const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) return res.status(400).json({ error: 'Image attendue en data URL' });

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) return res.status(413).json({ error: 'Image trop volumineuse (5 Mo max)' });

    const extension = match[1].split('/')[1].replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '') || 'png';
    const safeName = `${crypto.randomUUID()}.${extension}`;
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, safeName), buffer);

    const base = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ file_url: `${base}/uploads/${safeName}`, file_id: safeName, filename });
  } catch (error) {
    next(error);
  }
});

router.post('/core/generate-image', authenticateToken, (req, res) => {
  const prompt = String(req.body?.prompt || '');
  const year = prompt.match(/\b(19|20)\d{2}\b/)?.[0];
  const named = prompt.match(/photo of a\s+(?:\d{4}\s+)?(.+?),/i);
  const parts = (named?.[1] || '').split(/\s+/);
  const make = parts[0] || '';
  const model = parts.slice(1).join(' ');
  res.json({
    url: vehiclePortraitDataUrl({ year, make, model }),
    image_id: crypto.randomUUID(),
  });
});

export default router;
