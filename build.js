// Statik fayllarni "dist" papkaga koʻchiradi — Capacitor shu yerdan oladi.
import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

for (const file of ['index.html', 'style.css', 'app.js']) {
  cpSync(file, `dist/${file}`);
}
cpSync('js', 'dist/js', { recursive: true });
console.log('dist tayyor');
