// js/store.js
// Kitobchi ilovasi uchun localStorage asosidagi maʼlumotlar qatlamini yaratadi.
// Fayl 1‑satrdan 200‑satrgacha bo‘lishi kerak (300‑qatordan kam).
// Export: window.KitobchiStore

(function () {
  const PREFIX = 'Kitobchi_';

  // Yordamchi: localStorage dan maʼlumot olish
  function _get(key) {
    const val = localStorage.getItem(PREFIX + key);
    if (!val) return null;
    try { return JSON.parse(val); } catch (_) { return null; }
  }

  // Yordamchi: localStorage ga maʼlumot saqlash
  function _set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  // Sozlamalar (settings) CRUD
  const settings = {
    get: () => _get('settings') || {},
    set: (obj) => _set('settings', obj),
  };

  // Loyihalar (projects) CRUD
  const projects = {
    list: () => _get('projects') || [],
    get: (id) => {
      const list = projects.list();
      return list.find((p) => p.id === id) || null;
    },
    create: (proj) => {
      const list = projects.list();
      list.push(proj);
      _set('projects', list);
      return proj;
    },
    update: (id, data) => {
      const list = projects.list();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      _set('projects', list);
      return list[idx];
    },
    delete: (id) => {
      let list = projects.list();
      list = list.filter((p) => p.id !== id);
      _set('projects', list);
      return true;
    },
  };

  // Workspace CRUD (har bir loyiha uchun workspace)
  const workspaces = {
    _key: (projId) => `workspace_${projId}`,
    list: (projId) => _get(workspaces._key(projId)) || [],
    get: (projId, wsId) => {
      const list = workspaces.list(projId);
      return list.find((w) => w.id === wsId) || null;
    },
    create: (projId, ws) => {
      const list = workspaces.list(projId);
      list.push(ws);
      _set(workspaces._key(projId), list);
      return ws;
    },
    update: (projId, wsId, data) => {
      const list = workspaces.list(projId);
      const idx = list.findIndex((w) => w.id === wsId);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      _set(workspaces._key(projId), list);
      return list[idx];
    },
    delete: (projId, wsId) => {
      let list = workspaces.list(projId);
      list = list.filter((w) => w.id !== wsId);
      _set(workspaces._key(projId), list);
      return true;
    },
  };

  // Eksport funksiyalari
  const exportHelper = {
    // HTML eksport: blob yaratib download
    exportHTML: (html, filename = 'kitobchi.html') => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    // JSON eksport
    exportJSON: (obj, filename = 'kitobchi.json') => {
      const json = JSON.stringify(obj, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    // PDF eksport (print‑window orqali)
    exportPDF: (content, title = 'kitobchi') => {
      const win = window.open('', '_blank');
      win.document.write(`<!DOCTYPE html><html><head><title>${title}</title></head><body>${content}</body></html>`);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    },
    // PowerPoint mos HTML: .ppt kengaytmasi bilan PowerPoint/LibreOffice ochadi
    exportPPT: (project, filename = 'kitobchi-taqdimot.ppt') => {
      const escHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
      const slides = (project.pages || []).map((slide, index) => {
        const bullets = Array.isArray(slide.bullets) ? slide.bullets : String(slide.text || '').split(' • ').filter(Boolean);
        return `<section class="slide"><div class="number">${index + 1}</div><h1>${escHtml(slide.title || 'Slayd')}</h1><p>${escHtml(slide.text || '')}</p>${bullets.length ? `<ul>${bullets.map(item => `<li>${escHtml(item)}</li>`).join('')}</ul>` : ''}${slide.imagePrompt ? `<div class="image-note">🖼 Rasm: ${escHtml(slide.imagePrompt)}</div>` : ''}</section>`;
      }).join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(project.title)}</title><style>body{margin:0;background:#111;color:#fff;font-family:Arial,sans-serif}.slide{box-sizing:border-box;width:13.333in;height:7.5in;padding:70px 90px;page-break-after:always;background:linear-gradient(135deg,#182447,#6b3fa0)}.slide:nth-child(2n){background:linear-gradient(135deg,#0c4b59,#a24d6d)}h1{font-size:42pt;margin:35px 0 20px}p,li{font-size:22pt;line-height:1.3}.number{font-size:18pt;color:#b6c7ff}.image-note{margin-top:35px;padding:16px;border:1px solid #ffffff55;border-radius:12px;font-size:14pt}</style></head><body>${slides}</body></html>`;
      const blob = new Blob([html], { type: 'application/vnd.ms-powerpoint' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    // Web Share yoki fallback download
    shareOrDownload: (content, filename = 'kitobchi.txt') => {
      if (navigator.share) {
        navigator.share({ title: filename, text: content }).catch((err) => console.error(err));
      } else {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
  };

  // Eksport qilingan ob'ektni windowga qo‘shamiz
  window.KitobchiStore = {
    settings,
    projects,
    workspaces,
    export: exportHelper,
  };
})();
