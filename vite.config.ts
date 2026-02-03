import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        cooldown: 'cooldown.html',
        background: 'src/background.ts',
        content: 'src/content/youtube.ts',
      },
      output: {
        entryFileNames: chunk => {
          if (chunk.name === 'background') return '[name].js';
          if (chunk.name === 'content') return '[name].js';
          return 'assets/[name].[hash].js';
        }
      }
    }
  }
});