import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const GEMINI_MODEL = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getUpstreamErrorMessage(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GEMINI_API_KEY is not configured')) {
    return {
      status: 503,
      message: 'AI Conductor requires GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('403')) {
    return {
      status: 403,
      message: 'Invalid or unauthorized Gemini API key. Please check Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'AI Conductor quota temporarily reached. Please try again in a moment.',
    };
  }
  return {
    status: 502,
    message: raw || 'AI Conductor could not reach Gemini right now.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  // 1. Live Bilingual Station Announcer (English + Tamil)
  app.post('/api/conductor/announce', async (req, res) => {
    try {
      const {
        stationName = 'ஷவீஷ் ஜெஷுருன் சா',
        stationTamil = 'ஷவீஷ் ஜெஷுருன் சா நிலையம்',
        nextStationName = 'Neelam Lake Halt',
        destinationName = '',
        timeFormatted = '17:45',
        period = 'sunset',
        weather = 'clear',
        season = 'spring',
        activeVehicle = 'none',
        selectedStops = [],
      } = req.body ?? {};

      const ai = getGeminiClient();
      const prompt = [
        `Current Station / Area: ${stationName} (${stationTamil})`,
        `Next Scheduled Stop: ${nextStationName}`,
        destinationName ? `Selected Destination: ${destinationName}` : 'Mode: Scenic Loop',
        Array.isArray(selectedStops) && selectedStops.length > 0
          ? `Selected Stops: ${selectedStops.join(', ')}`
          : '',
        `Time: ${timeFormatted} (${period}) | Season: ${season} | Weather: ${weather} | Player Vehicle: ${activeVehicle}`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are the warm, poetic, realistic bilingual Railway Station Announcer for DREAMLINE (a scenic Tamil Nadu-meets-anime coastal & alpine railway). Produce concise, atmospheric station PA announcements in natural English and natural Tamil script reflecting the exact station, weather, season, and time of day. Keep announcementEn under 32 words, announcementTa under 32 words, and platformTip under 18 words.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              announcementEn: {
                type: Type.STRING,
                description: 'Natural English railway PA announcement.',
              },
              announcementTa: {
                type: Type.STRING,
                description: 'Natural Tamil script railway PA announcement.',
              },
              platformTip: {
                type: Type.STRING,
                description: 'Short helpful travel or scenic tip for the current weather/time.',
              },
            },
            required: ['announcementEn', 'announcementTa', 'platformTip'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Empty response from AI Station Announcer.' });
        return;
      }
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (err) {
      const { status, message } = getUpstreamErrorMessage(err);
      res.status(status).json({ error: message });
    }
  });

  // 2. Smart Natural-Language AI Railway Conductor & Trip Planner
  app.post('/api/conductor/plan-route', async (req, res) => {
    try {
      const {
        prompt: userRequest,
        originStationIndex = 0,
        timeFormatted = '17:45',
        weather = 'clear',
        season = 'spring',
        stations = [],
      } = req.body ?? {};

      if (typeof userRequest !== 'string' || userRequest.trim().length < 2) {
        res.status(400).json({ error: 'Please tell the AI Conductor where you would like to travel.' });
        return;
      }

      const validStations: Array<{ index: number; id: string; name: string; jpName: string; regionTag: string }> =
        Array.isArray(stations) && stations.length > 0
          ? stations
          : [
              { index: 0, id: 'poongavanam', name: 'ஷவீஷ் ஜெஷுருன் சா', jpName: 'ஷவீஷ் ஜெஷுருன் சா நிலையம்', regionTag: 'Main Station & En Illam' },
              { index: 1, id: 'aomizu_lakeside', name: 'Neelam Lake Halt', jpName: 'நீலம் ஏரி நிலையம்', regionTag: 'Lake & Campsite' },
              { index: 2, id: 'panimalai_snow', name: 'Panimalai Snow Station', jpName: 'பனிமலை நிலையம்', regionTag: 'Snow Mountains & Giant Igloo Iceland' },
              { index: 3, id: 'pachai_vayal', name: 'Pachai Vayal Halt', jpName: 'பச்சை வயல் நிலையம்', regionTag: 'Green Valley, Waterfall & Olga Camper' },
              { index: 4, id: 'kadalkarai_coast', name: 'Kadalkarai Coast Station', jpName: 'கடற்கரை நிலையம்', regionTag: 'Turquoise Ocean Beach & Harbour' },
              { index: 5, id: 'dinosaur_island_station', name: 'SSJ Dinosaur Island Station', jpName: 'டினோசர் தீவு நிலையம்', regionTag: 'Far-Offshore Sea Railway Dinosaur Island' },
            ];

      const n = validStations.length;
      const safeOrigin = ((Number(originStationIndex) % n) + n) % n;
      // Order upcoming stations along the forward railway loop after origin
      const upcomingOrder: Array<{ index: number; name: string; regionTag: string }> = [];
      for (let step = 1; step < n; step++) {
        const idx = (safeOrigin + step) % n;
        const st = validStations[idx];
        upcomingOrder.push({ index: idx, name: st.name, regionTag: st.regionTag });
      }

      const ai = getGeminiClient();
      const contents = [
        `Passenger Request: "${userRequest.trim()}"`,
        `Current Origin Station Index: ${safeOrigin} (${validStations[safeOrigin]?.name ?? 'Main Station'})`,
        `Time: ${timeFormatted} | Season: ${season} | Weather: ${weather}`,
        `Upcoming stations in exact forward loop order from origin (choose destinationStationIndex and optional intermediateStationIndices strictly from these indices):`,
        ...upcomingOrder.map((u, pos) => `  Loop Order #${pos + 1}: index=${u.index} — ${u.name} (${u.regionTag})`),
      ].join('\n');

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction:
            'You are the friendly bilingual AI Railway Conductor on DREAMLINE Express. Map the passenger request to valid upcoming station indices from the provided loop order. Select the final destinationStationIndex and any requested intermediateStationIndices that appear BEFORE destinationStationIndex in loop order. Respond with concise, warm English and Tamil conductor replies and a brief boarding announcement.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              destinationStationIndex: {
                type: Type.INTEGER,
                description: 'Final destination station index from the upcoming loop list.',
              },
              intermediateStationIndices: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: 'Optional intermediate stop indices before the destination in loop order.',
              },
              conductorMessageEn: {
                type: Type.STRING,
                description: 'Short warm English reply from the conductor (max 28 words).',
              },
              conductorMessageTa: {
                type: Type.STRING,
                description: 'Short warm Tamil reply from the conductor (max 28 words).',
              },
              announcementEn: {
                type: Type.STRING,
                description: 'Brief English boarding PA announcement (max 24 words).',
              },
              announcementTa: {
                type: Type.STRING,
                description: 'Brief Tamil boarding PA announcement (max 24 words).',
              },
            },
            required: [
              'destinationStationIndex',
              'intermediateStationIndices',
              'conductorMessageEn',
              'conductorMessageTa',
              'announcementEn',
              'announcementTa',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Empty response from AI Railway Conductor.' });
        return;
      }
      const parsed = JSON.parse(rawText);

      // Sanitize returned indices strictly against upcoming forward loop order
      const upcomingIds = upcomingOrder.map((u) => u.index);
      let destIdx = Number(parsed.destinationStationIndex);
      if (!upcomingIds.includes(destIdx)) {
        destIdx = upcomingIds[upcomingIds.length - 1];
      }
      const destPos = upcomingIds.indexOf(destIdx);
      const rawIntermediates: number[] = Array.isArray(parsed.intermediateStationIndices)
        ? parsed.intermediateStationIndices.map(Number)
        : [];
      const sanitizedIntermediates = upcomingIds.filter(
        (idx, pos) => pos < destPos && rawIntermediates.includes(idx)
      );

      res.json({
        destinationStationIndex: destIdx,
        intermediateStationIndices: sanitizedIntermediates,
        conductorMessageEn: String(parsed.conductorMessageEn ?? ''),
        conductorMessageTa: String(parsed.conductorMessageTa ?? ''),
        announcementEn: String(parsed.announcementEn ?? ''),
        announcementTa: String(parsed.announcementTa ?? ''),
      });
    } catch (err) {
      const { status, message } = getUpstreamErrorMessage(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DREAMLINE server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DREAMLINE server:', err);
  process.exit(1);
});
