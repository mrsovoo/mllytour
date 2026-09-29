import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/**
 * Local dev runner.
 *
 *   npm run dev          → sayt:5173 + backend:4000
 *   npm run dev:admin    → admin panel:3000 (faqat /admin)
 *   npm run dev:partner  → hamkor paneli:3001 (faqat /partner)
 *
 * Panel rejimlarida frontend `VITE_APP_PANEL=admin|partner` bilan ko'tariladi:
 * ilova faqat shu panelning marshrutlarini (va kirish uchun `/auth`) ko'rsatadi,
 * qolgan manzillar panelga yo'naltiriladi. Backend allaqachon ishlayotgan
 * bo'lsa (masalan, `npm run dev` yoniq bo'lsa) u qayta ishga tushirilmaydi —
 * barcha dev serverlar bitta backenddan foydalanadi.
 */
const PANEL_PORTS = { admin: '3000', partner: '3001' };
const panelArg = process.argv.find((arg) => arg.startsWith('--panel='))?.slice(8);
const panel = panelArg ?? (process.argv.includes('--admin') ? 'admin' : 'public');
const FRONTEND_PORT = process.env.FRONTEND_PORT || PANEL_PORTS[panel] || '5173';
const BACKEND_PORT = process.env.PORT || '4000';

/** Port bandmi? */
function isPortBusy(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once('error', () => resolve(true));
    probe.once('listening', () => probe.close(() => resolve(false)));
    probe.listen(Number(port), '127.0.0.1');
  });
}

const backendBusy = await isPortBusy(BACKEND_PORT);
if (backendBusy) {
  console.log(
    `Backend allaqachon ishlayapti (http://127.0.0.1:${BACKEND_PORT}) — qayta ishga tushirilmaydi.`,
  );
}

const backend = backendBusy
  ? null
  : spawn('node', ['server/index.mjs'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env, PORT: BACKEND_PORT },
    });

const frontend = spawn(
  'npx',
  ['vite', '--host', '0.0.0.0', '--port', FRONTEND_PORT, '--strictPort'],
  {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, ...(panel === 'public' ? {} : { VITE_APP_PANEL: panel }) },
  },
);

console.log(
  panel === 'public'
    ? `Sayt: http://localhost:${FRONTEND_PORT} (backend :${BACKEND_PORT})`
    : `${panel === 'admin' ? 'Admin panel' : 'Hamkor paneli'}: http://localhost:${FRONTEND_PORT}/${panel} (backend :${BACKEND_PORT})`,
);

const shutdown = () => {
  backend?.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

backend?.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Backend exited with code ${code}`);
    frontend.kill('SIGTERM');
    process.exit(code ?? 1);
  }
});

frontend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Frontend exited with code ${code}`);
    backend?.kill('SIGTERM');
    process.exit(code ?? 1);
  }
});
