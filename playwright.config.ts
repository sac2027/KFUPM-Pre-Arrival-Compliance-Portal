import { defineConfig } from '@playwright/test';

// Reuses the preinstalled Chromium; never run `playwright install`.
const launchOptions = {
  executablePath: process.env.PW_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: ['--no-sandbox'],
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173', launchOptions, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-360', use: { viewport: { width: 360, height: 740 }, hasTouch: true } },
    { name: 'small-320', use: { viewport: { width: 320, height: 640 }, hasTouch: true } },
  ],
});
