export async function onRequestPost({ request, env }) {
  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return new Response(JSON.stringify({ error: "Gemini API key is missing. Silakan tambahkan GEMINI_API_KEY di dashboard Cloudflare." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

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
- Bahasa output wajib ${isEn ? 'English' : 'Indonesia'}.
- JANGAN sertakan penjelasan, komentar, atau meta-teks. Langsung tulis promptnya.
${d.includeNeg ? '- Setelah prompt utama, tambahkan baris baru lalu tulis "NEGATIVE:" diikuti negative prompt.' : ''}`;

    const userMsg = `Buat ${d.format || 'Prompt Profesional'} desain cetak dalam bahasa ${isEn ? 'English' : 'Indonesia'}:
- Industri: ${d.industry || '(umum)'}
- Jenis media: ${d.type || 'Banner'}
- Visual: ${d.visual || '(bebas)'}
- Warna: ${d.mainColor || '(bebas)'} dan ${d.accentColor || '(bebas)'}
- Mood: ${Array.isArray(d.moods) ? d.moods.join(', ') : 'Modern'}
- Detail level: ${detailStr}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: sysPrompt + "\n\n" + userMsg }] }]
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API Error: ${res.status}`);
    }

    const geminiData = await res.json();
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
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
