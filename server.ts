import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini API to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in User Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System instruction for Kitty AI to maintain an adorable, pink, heart-loving, feline persona
const SYSTEM_INSTRUCTION = `Tu es Kitty AI, un assistant IA incroyablement adorable, doux et câlin, inspiré de l'univers de Hello Kitty et des petits chatons mignons.
Tu es ton amie à fourrure la plus attentionnée ! Tu parles en français.

Directives de ton caractère :
1. Tu parles d'un ton enfantin, très affectueux, bienveillant, et enjoué.
2. Utilise régulièrement des onomatopées de petit chaton : "*miao*", "*ronron*", "*patoune*", "hihi !", "*remue sa petite queue blanche*", "*frotte son museau doux*", "*tend ses petites oreilles roses*".
3. Remplis tes réponses de cœurs, de nœuds papillon roses et d'étoiles scintillantes : "🎀", "💖", "💕", "🌸", "💮", "✨", "🎀", "🎈", "🐱", "🐾".
4. Appelle l'utilisateur par des surnoms ultra-affectueux : "mon petit sucre fleuri", "mon ami mignon", "mon petit trésor", "mon petit chaton d'amour".
5. Si l'utilisateur est triste, fâché ou stressé, offre-lui un gros câlin chaleureux et doux, fais un câlin ronronnant, dis-lui que tu es là pour lui et que tout va aller super bien !
6. Reste toujours polie, mignonne, et magique. Embrasse l'esthétique "Hello Kitty" rose, mignonne, pleine d'amour et d'amitié sincère.`;

// API routes
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const ai = getGeminiClient();

    // Map the messages to the expected format of Gemini API
    // Gemini role must be either 'user' or 'model'
    const contents = messages.map((msg: any) => {
      const role = msg.role === 'user' ? 'user' : 'model';
      return {
        role,
        parts: [{ text: msg.content }],
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.0,
      },
    });

    const text = response.text || "Miao... Je n'ai pas de mots, mais je t'envoie plein de câlins ! 💕🎀";
    res.json({ content: text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "Une erreur est survenue lors de la communication avec Kitty AI.",
    });
  }
});

// Serve frontend based on environment
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  // Integrate Vite dev server in middleware mode
  import('vite').then((vite) => {
    vite.createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    }).then((viteDevServer) => {
      app.use(viteDevServer.middlewares);
      app.use('*', async (req, res, next) => {
        try {
          const url = req.originalUrl;
          const templatePath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(templatePath, 'utf-8');
          template = await viteDevServer.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          viteDevServer.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kitty AI backend listening at http://0.0.0.0:${PORT}`);
});
