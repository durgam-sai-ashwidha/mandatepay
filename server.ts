import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Gemini setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

app.post('/api/parse-request', async (req, res) => {
  try {
    const { prompt, knownRecipients, knownPurposes } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please use manual entry mode.',
      });
    }

    const systemInstruction = `You are a strict parameter parser for MandatePay agent payment proposals.
CRITICAL BOUNDARY AND INVARIANT:
- You DO NOT authorize, approve, reject, sign, or execute payments.
- You ONLY extract structured parameter fields from the user's natural language request.
- The downstream deterministic policy engine and Monad smart contract will decide whether this proposed payment is valid.

Extract the following fields:
- recipientAddress: Hex EVM address (e.g. 0x...). If the prompt mentions a recipient alias (like "LabelService" or "DataVendor"), resolve it using the provided known recipient mappings. If no address or matching alias is found, return an empty string.
- amountInMon: The amount in MON as a decimal string (e.g. "0.02" or "0.015"). Extract only the numerical value in MON units.
- purposeId: Normalized identifier string in UPPERCASE_SNAKE_CASE (e.g. DATA_LABELING, RPC_COMPUTE, INFERENCE_CREDITS, STORAGE_DEPOSIT, etc.). If a known purpose matches, use that.
- description: Concise summary of what service or deliverable the agent is requesting payment for.

Context of known mappings:
Known Recipient Aliases: ${JSON.stringify(knownRecipients || {})}
Known Purpose IDs: ${JSON.stringify(knownPurposes || [])}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipientAddress: { type: Type.STRING, description: 'EVM hex address (0x...)' },
            amountInMon: { type: Type.STRING, description: 'Amount in MON formatted as decimal string' },
            purposeId: { type: Type.STRING, description: 'Purpose ID in UPPERCASE_SNAKE_CASE' },
            description: { type: Type.STRING, description: 'Short summary of the task' },
          },
          required: ['recipientAddress', 'amountInMon', 'purposeId', 'description'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini parse error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to parse natural language request',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    chainId: 10143,
    network: 'Monad Testnet',
  });
});

app.get('/contracts/MandateRegistry.sol', (req, res) => {
  res.sendFile('contracts/MandateRegistry.sol', { root: '.' });
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MandatePay server running on http://0.0.0.0:${PORT}`);
  });
}

start();
