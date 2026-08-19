// Gemini API: model nomlari hech qachon hardcode qilinmaydi.
(function () {
  const BASE = 'https://generativelanguage.googleapis.com/v1beta';
  const getKey = () => (window.KitobchiStore?.settings.get().apiKey || '').trim();
  async function request(path, options = {}) {
    const key = getKey();
    if (!key) throw new Error('Avval Sozlamalarda Gemini API kalitini kiriting.');
    const res = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `API xatosi: ${res.status}`);
    return data;
  }
  async function models() {
    const data = await request('/models');
    return (data.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent'));
  }
  async function generate(prompt, model, history = []) {
    const contents = [...history, { role: 'user', parts: [{ text: prompt }] }];
    const data = await request(`/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({contents}) });
    return data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || 'AI javob qaytarmadi.';
  }
  async function imagePrompt(prompt, model) { return generate(`Rasm yaratish uchun aniq vizual prompt yozing. Mavzu: ${prompt}`, model); }
  window.KitobchiAPI = { models, generate, imagePrompt };
})();
