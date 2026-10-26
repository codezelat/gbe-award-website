// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://gbeaward.com',
  output: 'server',
  // Preserve Astro 6's spacing between inline elements after the security upgrade.
  compressHTML: true,
  adapter: vercel(),
  integrations: [react()],
  redirects: {
    '/pdf': 'https://drive.google.com/file/d/1rJ1JfccI57Yyr928QCoCr_1UqjmU9z3c/view?usp=sharing'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
