import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

app.options("/api/generate", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

app.all("/api/generate", (req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  next();
});

app.post("/api/generate", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI API KEY STATUS:", apiKey ? (apiKey === "MY_GEMINI_API_KEY" ? "PLACEHOLDER" : "PRESENT") : "MISSING");
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(500).json({ error: "Gemini API key is missing or using default placeholder. Please add a valid key in the Settings panel (Secrets)." });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const d = req.body;
    const isEn = typeof d.lang === 'string' && d.lang.includes('English');
    const intensityRaw = ['', 'very soft and muted', 'soft and light', 'balanced and natural', 'bold and vivid', 'extremely vibrant and saturated'];
    const detailRaw = ['', 'ultra minimal elements', 'simple clean composition', 'moderate visual complexity', 'detailed and rich visual', 'extremely detailed and complex'];
    
    // Explicitly clamp values to avoid reading from undefined
    const intenVal = Number(d.colorIntensity) || 3;
    const detailVal = Number(d.detailLevel) || 3;
    const intensityStr = intensityRaw[intenVal] || 'balanced and natural';
    const detailStr = detailRaw[detailVal] || 'moderate visual complexity';

    const sysPrompt = `Kamu adalah AI spesialis prompt generator untuk desain cetak profesional Indonesia. Kamu menghasilkan prompt yang sangat detail, teknis, dan profesional untuk AI image generator.

FORMAT KETAT:
- Untuk format Prompt Singkat: 1 kalimat padat, maksimal 60 kata
- Untuk format Prompt Detail: 3-4 kalimat, 80-150 kata  
- Untuk format Prompt Profesional: 4-6 kalimat terstruktur, 120-200 kata, gunakan terminologi desain profesional
- Untuk format Prompt Midjourney: mulai dengan deskripsi visual, akhiri dengan parameter --ar --style --q 2 --v 6
- Untuk format Prompt Stable Diffusion: format (subject:weight), tambahkan LoRA dan embedding hints
- Bahasa output wajib ${isEn ? 'English' : 'Indonesia'}, tidak peduli format apa.
- Selalu sertakan: kualitas cetak, resolusi, dan technical specs yang relevan
- JANGAN sertakan penjelasan, komentar, atau meta-teks. Langsung tulis promptnya.
${d.includeNeg ? '- Setelah prompt utama, tambahkan baris baru lalu tulis "NEGATIVE:" diikuti negative prompt yang berisi hal-hal yang harus dihindari.' : ''}`;

    const userMsg = `Buat ${d.format || 'Prompt Profesional'} desain cetak dalam bahasa ${isEn ? 'English' : 'Indonesia'}:

DATA DESAIN:
- Nama brand/customer: ${d.customer || '(tidak disebutkan)'}
- Industri: ${d.industry || '(umum)'}
- Jenis media: ${d.type || 'Banner'}
- Ukuran: ${d.w || '?'} x ${d.h || '?'} ${d.unit}
- Orientasi: ${d.orientation || 'Portrait'}
- Target cetak: ${d.printTarget || 'Outdoor'}

WARNA & VISUAL:
- Warna utama/background: ${d.mainColor || '(bebas)'}
- Warna aksen: ${d.accentColor || '(bebas)'}
- Warna tersier: ${d.tertiaryColor || '(tidak ada)'}
- Mood: ${Array.isArray(d.moods) ? d.moods.join(', ') : 'Modern'}
- Intensitas warna: ${intensityStr}

TEKS & TIPOGRAFI:
- Headline: "${d.headline || '(tidak ada)'}"
- Subheadline: "${d.subheadline || '(tidak ada)'}"
- Info tambahan: "${d.extraText || '(tidak ada)'}"
- Gaya font: ${d.fontStyle || 'Sans Serif Clean'}
- Font spesifik: ${d.fontName || '(bebas)'}
- Hierarki teks: ${d.textHierarchy || 'Seimbang'}

KOMPOSISI VISUAL:
- Deskripsi ilustrasi: ${d.visual || '(tidak ada)'}
- Gaya desain: ${Array.isArray(d.designStyles) ? d.designStyles.join(', ') : 'Modern'}
- Komposisi layout: ${d.layout || 'Center Focus'}
- Pencahayaan: ${d.lighting || 'Natural Light'}
- Tingkat detail: ${detailStr}

OUTPUT SETTINGS:
- Format prompt: ${d.format || 'Prompt Profesional'}
- Aspek rasio: ${d.ratio || '16:9'}
- Kualitas: ${d.quality || 'High Quality'}
- Catatan tambahan: ${d.notes || '(tidak ada)'}
${d.includeNeg ? '\nSertakan NEGATIVE PROMPT di bawah prompt utama dengan prefix "NEGATIVE:".' : ''}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: sysPrompt + "\n\n" + userMsg }] }
      ]
    });

    const raw = response.text || "";

    let pos = raw;
    let neg = "";

    if (d.includeNeg && /NEGATIVE:/i.test(raw)) {
      const parts = raw.split(/NEGATIVE:/i);
      pos = parts[0].trim();
      neg = parts.slice(1).join("").trim();
    }

    res.json({ result: pos, negative: neg });
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    // Return the detailed error to the client
    const errorMessage = e?.status === 400 && e?.message?.includes('API key not valid') 
      ? "API Key tidak valid. Silakan periksa pengaturan (Settings > Secrets) dan masukkan Gemini API Key yang benar." 
      : e.message || "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
