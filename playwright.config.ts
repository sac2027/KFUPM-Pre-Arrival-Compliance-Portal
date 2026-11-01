import { defineConfig } from '@playwright/test';

// Reuses the preinstalled Chromium; never run `playwright install`.
const launchOptions = {
  executablePath: process.env.PW_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: ['--no-sandbox'],
};
const PROD = 'http://127.0.0.1:4173'; // the production build: what students get
const DEV = 'http://127.0.0.1:5174'; // the dev server: has the worst-case toggle (break-ui)

const sizes = [
  { name: '1280', viewport: { width: 1280, height: 800 }, hasTouch: false },
  { name: '360', viewport: { width: 360, height: 740 }, hasTouch: true },
  { name: '320', viewport: { width: 320, height: 640 }, hasTouch: true },
] as const;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { launchOptions, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
      url: PROD,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      url: DEV,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    ...sizes.map((s) => ({
      name: s.name === '1280' ? 'desktop-1280' : s.name === '360' ? 'mobile-360' : 'small-320',
      testIgnore: /worst-case/,
      use: { baseURL: PROD, viewport: s.viewport, hasTouch: s.hasTouch },
    })),
    ...sizes.map((s) => ({
      name: `worst-${s.name}`,
      testMatch: /worst-case/,
      use: { baseURL: DEV, viewport: s.viewport, hasTouch: s.hasTouch },
    })),
  ],
});
