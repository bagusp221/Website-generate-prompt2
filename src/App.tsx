/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Sparkles, 
  Copy, 
  Download, 
  RefreshCw, 
  Trash2,
  CheckCircle2,
  Check,
  Zap,
  ShoppingBag,
  Image as ImageIcon,
  Type,
  Palette,
  Settings,
  Clock
} from 'lucide-react';

const MOODS = ['Elegan', 'Modern', 'Futuristik', 'Minimalis', 'Premium', 'Ceria', 'Soft Pastel', 'Corporate', 'Luxury', 'Vintage', 'Dark Mode', 'Colorful', 'Monochrome', 'Naturalistic'];
const DESIGN_STYLES = ['Modern Flat', 'Realistic Photography', '3D Render', 'Cinematic', 'Minimalist', 'Futuristic', 'Corporate Clean', 'Luxury Premium', 'Retro Vintage', 'Cyberpunk', 'Japanese Style', 'Chinese Style', 'Vietnam Style', 'Watercolor', 'Geometric', 'Brutalist'];
const FORMATS = ['Prompt Singkat', 'Prompt Detail', 'Prompt Profesional', 'Prompt Midjourney', 'Prompt Stable Diffusion'];

const TEMPLATES = [
  {label: '🔥 Promo Diskon', desc: 'Sale & diskon besar', data: {type: 'Banner', headline: 'PROMO BESAR-BESARAN', subheadline: 'Diskon hingga 70% untuk semua produk', moods: ['Ceria'], mainColor: '#e53935', accentColor: '#ffeb3b', visual: 'Produk-produk dengan tag diskon warna-warni berserakan, latar belakang cerah meriah', designStyles: ['Modern Flat'], layout: 'Center Focus — Fokus elemen di tengah', industry: 'UMKM Umum', notes: 'Desain harus terasa meriah dan menarik perhatian.'}},
  {label: '🎉 Grand Opening', desc: 'Pembukaan toko baru', data: {type: 'Spanduk', headline: 'GRAND OPENING', subheadline: 'Hadir untuk melayani Anda dengan sepenuh hati', moods: ['Premium'], mainColor: '#1a237e', accentColor: '#ffc107', visual: 'Pita merah yang dipotong dengan gunting emas, dekorasi balon', designStyles: ['Cinematic'], layout: 'Dynamic Diagonal — Komposisi diagonal dinamis', industry: 'UMKM Umum', notes: 'Terkesan mewah dan elegan.'}},
  {label: '🏮 Imlek Sale', desc: 'Promo Chinese New Year', data: {type: 'Banner', headline: 'GONG XI FA CAI', subheadline: 'Keberuntungan dan diskon melimpah!', moods: ['Premium', 'Ceria'], mainColor: '#e53935', accentColor: '#ffc107', visual: 'Lampion merah gantung, ornamen awan emas, koin tradisional Cina berserakan', designStyles: ['Chinese Style', 'Luxury Premium'], layout: 'Center Focus — Fokus elemen di tengah', industry: 'Fashion & Retail', notes: 'Gunakan nuansa oriental yang kental, meriah dan elegan.'}},
  {label: '🍜 Vietnam Cafe', desc: 'Poster promo ala Vietnam', data: {type: 'Poster', headline: 'PHO & COFFEE', subheadline: 'Autentik dari Hanoi, kini hadir disini', moods: ['Vintage', 'Naturalistic'], mainColor: '#4b5320', accentColor: '#ffcc00', visual: 'Mangkuk pho hangat berasap di meja kayu tua, secangkir kopi dengan drip filter tradisional', designStyles: ['Vietnam Style', 'Watercolor'], layout: 'Full Background — Visual memenuhi background', industry: 'Kuliner & F&B', notes: 'Berikan sentuhan rustic dan memori vintage warna hangat.'}},
];

export default function App() {
  const [formData, setFormData] = useState({
    customer: '',
    industry: '',
    type: '',
    w: '',
    h: '',
    unit: 'cm',
    orientation: 'Portrait',
    printTarget: 'Outdoor',
    mainColor: '#1a237e',
    accentColor: '#ffc107',
    tertiaryColor: '',
    moods: ['Modern'],
    colorIntensity: 3,
    headline: '',
    subheadline: '',
    extraText: '',
    fontStyle: '',
    fontName: '',
    textHierarchy: 'Headline Dominan',
    visual: '',
    designStyles: ['Modern Flat'],
    layout: '',
    lighting: 'Natural Light',
    detailLevel: 3,
    format: 'Prompt Profesional',
    lang: '🇮🇩 Indonesia',
    ratio: '9:16',
    quality: 'High Quality',
    notes: '',
    includeNeg: '✅ Ya',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedNegative, setGeneratedNegative] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [totalGen, setTotalGen] = useState(0);
  const [activeOutputTab, setActiveOutputTab] = useState('positive');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'moods' | 'designStyles', value: string) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(value)) return { ...prev, [field]: arr.filter(v => v !== value) };
      return { ...prev, [field]: [...arr, value] };
    });
  };

  const applyTemplate = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    showToast('✅ Template diterapkan!');
  };

  const generatePrompt = async () => {
    setIsLoading(true);
    setGeneratedPrompt('');
    setGeneratedNegative('');
    setActiveOutputTab('positive');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          includeNeg: formData.includeNeg === '✅ Ya'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server mengalami kendala');
      }

      const data = await res.json();
      setGeneratedPrompt(data.result || '');
      setGeneratedNegative(data.negative || '');
      setTotalGen(prev => prev + 1);
      
      const promptPreview = data.result || '';
      setHistory(prev => [[promptPreview, formData.type || 'Desain', formData.format || 'Prompt', new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})], ...prev].slice(0, 10));

      showToast('✅ Prompt berhasil digenerate!');
    } catch (e: any) {
      console.error(e);
      showToast(`❌ ${e.message || 'Gagal menghasilkan prompt'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, msg: string) => {
    if (!text) {
      showToast('⚠️ Belum ada prompt!');
      return;
    }
    navigator.clipboard.writeText(text);
    showToast(msg);
  };

  const downloadTxt = () => {
    if (!generatedPrompt) {
      showToast('⚠️ Belum ada prompt!');
      return;
    }
    const content = `PrintPrompt AI — Hasil Generate\n========================================\n\nPOSITIVE PROMPT:\n${generatedPrompt}\n\n${generatedNegative ? 'NEGATIVE PROMPT:\n' + generatedNegative + '\n\n' : ''}========================================\nDigenerate: ${new Date().toLocaleString('id-ID')} - ${formData.customer || 'Untilted'}`;
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    a.download = `printprompt-${Date.now()}.txt`;
    a.click();
    showToast('⬇️ File TXT diunduh!');
  };

  const strVals = [
    { label: 'Jenis Media', val: formData.type },
    { label: 'Customer', val: formData.customer },
    { label: 'Ukuran', val: (formData.w || '?') + 'x' + (formData.h || '?') + ' ' + formData.unit },
    { label: 'Warna Utama', val: formData.mainColor },
    { label: 'Aksen', val: formData.accentColor },
    { label: 'Mood', val: formData.moods.slice(0, 3).join(', ') },
    { label: 'Gaya Desain', val: formData.designStyles.slice(0, 2).join(', ') },
    { label: 'Font Style', val: formData.fontStyle },
    { label: 'Layout', val: formData.layout?.split('—')[0]?.trim() },
    { label: 'Target Cetak', val: formData.printTarget },
    { label: 'Pencahayaan', val: formData.lighting },
    { label: 'Format', val: formData.format },
  ];

  const charCount = generatedPrompt.length;
  const wordCount = generatedPrompt.split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen pb-16">
      <nav>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg,#7c6ef8,#9d91fa)' }}>
            <Printer size={18} color="white" />
          </div>
          <span className="font-bold text-[var(--text)]">PrintPrompt AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent2)] font-semibold border border-[var(--accent)]">BETA</span>
        </div>
        <button className="px-4 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent2)] text-white rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-1.5" onClick={generatePrompt}>
          <Sparkles size={16} /> Generate Prompt
        </button>
      </nav>

      <div className="text-center pt-12 pb-8 px-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 bg-[var(--accent-bg)] border border-[var(--accent)] text-[var(--accent2)] text-xs font-semibold px-3 py-1 rounded-full mb-5">
          <Sparkles size={12} /> Powered by Gemini AI
        </div>
        <h1 className="text-4xl font-extrabold leading-tight mb-3" style={{ background: 'linear-gradient(135deg, #f0f0f5 30%, #9d91fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Generator Prompt Desain Cetak Profesional
        </h1>
        <p className="text-[var(--text2)] text-[15px] leading-relaxed mb-6">
          Buat prompt AI spesifik untuk banner, spanduk, baliho, poster, dll. Termasuk gaya <strong>Desain Tiongkok</strong> dan <strong>Desain Vietnam</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 px-6 max-w-7xl mx-auto items-start">
        <div className="flex flex-col gap-4">
          
          {/* Quick Templates */}
          <div className="card">
            <div className="card-header">
              <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs bg-[var(--accent-bg)]"><Zap size={14} color="var(--accent2)" /></div>
              <h3 className="text-[13px] font-semibold">Template Cepat</h3>
              <span className="text-[11px] text-[var(--text3)] ml-auto bg-[var(--bg4)] px-2 py-0.5 rounded">4 preset</span>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t, i) => (
                  <button type="button" key={i} className="bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-2 text-left hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors text-[var(--text)]" onClick={() => applyTemplate(t.data)}>
                    <span className="text-xs font-semibold block mb-0.5">{t.label}</span>
                    <span className="text-[10px] text-[var(--text3)] leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="card">
            <div className="card-header">
              <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs bg-[var(--green-bg)]"><ShoppingBag size={14} color="var(--green)" /></div>
              <h3 className="text-[13px] font-semibold">Informasi Customer</h3>
              <span className="text-[11px] text-[var(--text3)] ml-auto bg-[var(--bg4)] px-2 py-0.5 rounded">wajib</span>
            </div>
            <div className="card-body flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Nama Customer / Brand <span className="req">*</span></label>
                <input type="text" value={formData.customer} onChange={e => updateField('customer', e.target.value)} placeholder="contoh: Toko Sinar Jaya, Kafe Aroma" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Industri / Bidang Usaha</label>
                <select value={formData.industry} onChange={e => updateField('industry', e.target.value)}>
                  <option value="">— pilih industri —</option>
                  <option>Kuliner & F&B</option><option>Fashion & Retail</option><option>Teknologi</option>
                  <option>Properti</option><option>Kesehatan & Kecantikan</option><option>Pendidikan</option>
                  <option>Hiburan & Event</option><option>Otomotif</option><option>UMKM Umum</option>
                </select>
              </div>
            </div>
          </div>

          {/* Spec Design */}
          <div className="card">
            <div className="card-header">
              <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs bg-[var(--red-bg)]"><ImageIcon size={14} color="var(--red)" /></div>
              <h3 className="text-[13px] font-semibold">Spesifikasi Desain</h3>
            </div>
            <div className="card-body flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Jenis Media Cetak <span className="req">*</span></label>
                <select value={formData.type} onChange={e => updateField('type', e.target.value)}>
                  <option value="">— pilih jenis —</option>
                  <option>Banner</option><option>X-Banner</option><option>Roll Banner</option>
                  <option>Baliho</option><option>Spanduk</option><option>Poster</option>
                  <option>Brosur / Flyer</option><option>Backdrop</option><option>Neon Box</option>
                  <option>Sticker / Label</option><option>Packaging Box</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Ukuran & Satuan</label>
                <div className="grid grid-cols-[1fr_1fr_80px] gap-2">
                  <input type="number" placeholder="Lebar" value={formData.w} onChange={e => updateField('w', e.target.value)} />
                  <input type="number" placeholder="Tinggi" value={formData.h} onChange={e => updateField('h', e.target.value)} />
                  <select value={formData.unit} onChange={e => updateField('unit', e.target.value)}>
                    <option>cm</option><option>mm</option><option>meter</option><option>inch</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Orientasi</label>
                <div className="pill-group">
                  {['Portrait', 'Landscape', 'Square'].map(o => (
                    <div key={o} className={`pill ${formData.orientation === o ? 'active' : ''}`} onClick={() => updateField('orientation', o)}>{o}</div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Target Cetak</label>
                <div className="pill-group">
                  {['Outdoor', 'Indoor', 'Digital'].map(o => (
                    <div key={o} className={`pill ${formData.printTarget === o ? 'active' : ''}`} onClick={() => updateField('printTarget', o)}>{o}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="card">
            <div className="card-header">
              <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs bg-[var(--green-bg)]"><Type size={14} color="var(--green)" /></div>
              <h3 className="text-[13px] font-semibold">Tipografi & Teks</h3>
            </div>
            <div className="card-body flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Headline Utama <span className="req">*</span></label>
                <textarea rows={2} value={formData.headline} onChange={e => updateField('headline', e.target.value)} placeholder="contoh: PROMO BESAR AKHIR TAHUN" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Subheadline / Tagline</label>
                <textarea rows={2} value={formData.subheadline} onChange={e => updateField('subheadline', e.target.value)} placeholder="contoh: Diskon hingga 70% untuk semua produk" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Pilih Hierarki</label>
                <div className="pill-group">
                  {['Headline Dominan', 'Seimbang', 'Minimalis Teks'].map(o => (
                    <div key={o} className={`pill ${formData.textHierarchy === o ? 'active' : ''}`} onClick={() => updateField('textHierarchy', o)}>{o}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Elements & Style */}
          <div className="card">
            <div className="card-header">
              <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs bg-[var(--gold-bg)]"><Palette size={14} color="var(--gold)" /></div>
              <h3 className="text-[13px] font-semibold">Gaya Visual</h3>
            </div>
            <div className="card-body flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Warna Utama & Aksen</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="flex gap-2 items-center">
                    <input type="color" className="w-[36px] h-[36px] p-0.5 rounded cursor-pointer bg-[var(--bg3)]" value={formData.mainColor} onChange={e => updateField('mainColor', e.target.value)} />
                    <input type="text" className="flex-1" placeholder="Utama" value={formData.mainColor} onChange={e => updateField('mainColor', e.target.value)} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="color" className="w-[36px] h-[36px] p-0.5 rounded cursor-pointer bg-[var(--bg3)]" value={formData.accentColor} onChange={e => updateField('accentColor', e.target.value)} />
                    <input type="text" className="flex-1" placeholder="Aksen" value={formData.accentColor} onChange={e => updateField('accentColor', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Mood / Skema Warna</label>
                <div className="pill-group">
                  {MOODS.map(m => (
                    <div key={m} className={`pill ${formData.moods.includes(m) ? 'active' : ''}`} onClick={() => toggleArrayField('moods', m)}>{m}</div>
                  ))}
                </div>
              </div>

              <hr className="border-[var(--border)] -mx-4" />

              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Gaya Desain Khusus <span className="req">*</span></label>
                <div className="p-3 bg-[var(--bg3)] border border-[var(--border)] rounded-lg mb-3">
                  <div className="text-xs text-[var(--text3)] mb-2">Pilih gaya artistik desain mu:</div>
                  <div className="pill-group">
                    {DESIGN_STYLES.map(s => (
                      <div key={s} className={`pill ${formData.designStyles.includes(s) ? 'active' : ''} transition-all`} onClick={() => toggleArrayField('designStyles', s)}>
                        {s === 'Chinese Style' && '🏮 '}
                        {s === 'Vietnam Style' && '🍜 '}
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1">Deskripsi Ilustrasi / Visual Utama</label>
                <textarea rows={3} value={formData.visual} onChange={e => updateField('visual', e.target.value)} placeholder="contoh: Seorang barista sedang menuang latte art di kafe modern ala Vietnam" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-t border-[var(--border)]">
              <button 
                onClick={generatePrompt}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-br from-[var(--accent)] to-[#a08cf8] rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(124,110,248,0.2)]"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isLoading ? 'Menyeduh Prompt...' : '✨ Generate Prompt Sekarang'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-6 sticky top-20">
          
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-[var(--accent2)]">{charCount}</div>
              <div className="text-[11px] text-[var(--text3)] mt-0.5">Karakter</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-[var(--text)]">{wordCount}</div>
              <div className="text-[11px] text-[var(--text3)] mt-0.5">Kata</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-[var(--gold)]">{totalGen}</div>
              <div className="text-[11px] text-[var(--text3)] mt-0.5">Generate</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-[var(--green)]">{history.length}</div>
              <div className="text-[11px] text-[var(--text3)] mt-0.5">History</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-[var(--bg3)] text-[13px] font-semibold text-[var(--text)] py-2.5">
              📋 Struktur Realtime
            </div>
            <div className="p-4 grid grid-cols-3 gap-3 bg-[var(--bg2)]">
              {strVals.map((f, i) => (
                <div key={i} className="bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-3">
                  <div className="text-[10px] text-[var(--text3)] font-semibold uppercase tracking-wider mb-1">{f.label}</div>
                  <div className="text-xs font-medium text-[var(--text)] truncate">{f.val || <span className="text-[var(--text3)] italic">kosong</span>}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Block */}
          <div className="card flex-1 flex flex-col min-h-[350px]">
            <div className="flex bg-[var(--bg3)] border-b border-[var(--border)]">
              <button className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${activeOutputTab === 'positive' ? 'text-[var(--accent2)] border-[var(--accent)]' : 'text-[var(--text3)] border-transparent hover:text-[var(--text2)]'}`} onClick={() => setActiveOutputTab('positive')}>✨ Positive Prompt</button>
              <button className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${activeOutputTab === 'negative' ? 'text-rose-400 border-rose-500' : 'text-[var(--text3)] border-transparent hover:text-[var(--text2)]'}`} onClick={() => setActiveOutputTab('negative')}>🚫 Negative Prompt</button>
            </div>
            
            <div className="p-5 flex-1 bg-[var(--bg2)]">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-[13px]">{activeOutputTab === 'positive' ? '🎯 Hasil Prompt AI' : '🚫 Negative Constraints'}</span>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg4)] hover:bg-[var(--border)] border border-[var(--border)] rounded text-xs transition-colors text-[var(--text2)] hover:text-white" onClick={() => handleCopy(activeOutputTab === 'positive' ? generatedPrompt : generatedNegative, '✅ Tersalin!')}>
                    <Copy size={12} /> Salin
                  </button>
                  {activeOutputTab === 'positive' && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg4)] hover:bg-[var(--border)] border border-[var(--border)] rounded text-xs transition-colors text-[var(--text2)] hover:text-white" onClick={downloadTxt}>
                      <Download size={12} /> TXT
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-black/40 border border-[var(--border)] text-[13.5px] leading-[1.8] min-h-[220px] whitespace-pre-wrap overflow-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--text3)] space-y-3 py-10">
                    <RefreshCw className="animate-spin text-[var(--accent)]" size={24} />
                    <span>Menganalisis profil dan meracik prompt...</span>
                  </div>
                ) : (
                  activeOutputTab === 'positive' 
                    ? (generatedPrompt ? generatedPrompt : <span className="italic text-[var(--text3)]">Prompt siap diracik untuk media cetakmu. Tekan generate...</span>)
                    : (generatedNegative ? generatedNegative : <span className="italic text-[var(--text3)]">Negative prompt akan digenerate otomatis beserta positive prompt...</span>)
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header justify-between py-2.5">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text)]">
                <Clock size={14} /> History
              </div>
              {history.length > 0 && <button className="text-[11px] text-rose-400 hover:text-rose-300 px-2 flex items-center gap-1" onClick={() => setHistory([])}><Trash2 size={12}/> Bersihkan</button>}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-[var(--text3)] italic">Belum ada history.</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="p-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg3)] cursor-pointer transition-colors" onClick={() => {setGeneratedPrompt(h[0]); setActiveOutputTab('positive'); document.documentElement.scrollIntoView({behavior:'smooth'}); showToast('📋 Prompt diganti dari history')}}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] bg-[var(--accent-bg)] text-[var(--accent2)] px-1.5 rounded uppercase font-bold border border-[var(--accent)]">{h[1]}</span>
                      <span className="text-[9px] bg-[var(--gold-bg)] text-[var(--gold)] px-1.5 rounded uppercase font-bold border border-[var(--gold)]">{h[2]}</span>
                      <span className="text-[10px] text-[var(--text3)]">{h[3]}</span>
                    </div>
                    <div className="text-[11px] text-[var(--text2)] truncate">{h[0]}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      <div className={`fixed bottom-6 right-6 bg-[var(--bg3)] border border-[var(--green)] text-[var(--green)] px-4 py-3 rounded-xl text-[13px] font-medium shadow-xl flex items-center gap-2 transition-all duration-300 z-[999] ${toastMsg ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 size={16} />
        {toastMsg}
      </div>

      <footer className="border-t border-[var(--border)] mt-10 py-6 text-center text-[var(--text3)] text-xs">
        <p>PrintPrompt AI &copy; 2026 — Dibuat dengan ❤️ menggunakan <span className="text-[var(--accent2)]">Gemini AI</span></p>
        <p className="mt-1">Tersedia untuk Midjourney · DALL·E · Leonardo AI · Canva AI</p>
      </footer>
    </div>
  );
}

