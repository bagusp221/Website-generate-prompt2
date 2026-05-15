import { GoogleGenAI } from "@google/genai";

export async function onRequestPost({ request, env }) {
  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return new Response(JSON.stringify({ error: "Gemini API key is missing or using default placeholder. Please add a valid key in the Settings panel (Secrets)." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const d = await request.json();
    const isEn = typeof d.lang === 'string' && d.lang.includes('English');
    const intensityRaw = ['', 'very soft and muted', 'soft and light', 'balanced and natural', 'bold and vivid', 'extremely vibrant and saturated'];
    const detailRaw = ['', 'ultra minimal elements', 'simple clean composition', 'moderate visual complexity', 'detailed and rich visual', 'extremely detailed and complex'];
    
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

    return new Response(JSON.stringify({ result: pos, negative: neg }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    const errorMsg = e.message || "Unknown error";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
