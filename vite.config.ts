import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        background: 'src/background.ts',
      },
      output: {
        entryFileNames: chunk => {
          return chunk.name === 'background' ? '[name].js' : 'assets/[name].[hash].js'
        }
      }
    }
  }
});