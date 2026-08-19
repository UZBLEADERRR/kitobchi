// js/store.js
// Kitobchi ilovasi uchun localStorage asosidagi maʼlumotlar qatlamini yaratadi.
// Fayl 1‑satrdan 200‑satrgacha bo‘lishi kerak (300‑qatordan kam).
// Export: window.KitobchiStore

(function () {
  const PREFIX = 'Kitobchi_';

  // Yordamchi: localStorage dan maʼlumot olish
  function _get(key) {
    const val = localStorage.getItem(PREFIX + key);
    return val ? JSON.parse(val) : null;
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
