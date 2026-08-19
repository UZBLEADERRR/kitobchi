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
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function withRetry(task, attempts = 4) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try { return await task(); } catch (error) {
        lastError = error;
        // Vaqtinchalik uzilish, 429 yoki server xatosida sekin-asta qayta urinadi.
        if (attempt < attempts - 1) await sleep(800 * (2 ** attempt));
      }
    }
    throw lastError;
  }
  async function models() {
    const found = [], seen = new Set();
    let pageToken = '';
    do {
      const suffix = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const data = await withRetry(() => request(`/models?pageSize=100${suffix}`));
      (data.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .forEach(model => { if (!seen.has(model.name)) { seen.add(model.name); found.push(model); } });
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return found;
  }
  function textOf(data) {
    return data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  }
  async function generate(prompt, model, history = [], options = {}) {
    if (!model) throw new Error('Gemini API modellar ro‘yxati topilmadi. Sozlamalarda “Modellarni tekshirish”ni bosing.');
    const contents = [...history, { role: 'user', parts: [{ text: prompt }] }];
    let answer = '';
    let requestContents = contents;
    const maxContinuations = options.maxContinuations ?? 3;
    for (let part = 0; part <= maxContinuations; part += 1) {
      const data = await withRetry(() => request(`/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contents: requestContents, generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } })
      }));
      const chunk = textOf(data);
      if (!chunk) break;
      answer += chunk;
      const finish = data?.candidates?.[0]?.finishReason;
      if (finish !== 'MAX_TOKENS' && finish !== 'LENGTH') break;
      // Model token limitiga urilsa, oxirgi matndan davom ettirishni so‘raydi.
      requestContents = [...contents, { role: 'model', parts: [{ text: answer }] }, {
        role: 'user', parts: [{ text: 'Javobingiz uzilib qoldi. Aynan shu joydan davom eting, takrorlamang.' }]
      }];
    }
    return answer || 'AI javob qaytarmadi.';
  }
  async function generateResilient(prompt, model, history = [], options = {}) {
    return withRetry(() => generate(prompt, model, history, options), 3);
  }
  async function imagePrompt(prompt, model) { return generate(`Rasm yaratish uchun aniq vizual prompt yozing. Mavzu: ${prompt}`, model); }
  window.KitobchiAPI = { models, generate, generateResilient, imagePrompt };
})();
