import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://zhouhongtao.cn',
  output: 'static',
  adapter: vercel(),
  build: {
    assets: 'assets',
  },
});
