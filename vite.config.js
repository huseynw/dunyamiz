import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Root = layihə qovluğu (index.html burada olduğu üçün)
  root: '.',

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // Source map TAM KAPALI — DevTools-da orijinal kod görünmür
    sourcemap: false,

    // Terser ilə güclü minify + obfuscate
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // console.log-ları sil
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.info', 'console.warn', 'console.debug'],
      },
      mangle: {
        toplevel: true,          // Global dəyişən adlarını dəyiş
        eval: true,
      },
      format: {
        comments: false,         // Bütün kommentləri sil
      },
    },

    rollupOptions: {
      input: {
        // İki HTML entry point
        main: resolve(__dirname, 'index.html'),
        video: resolve(__dirname, 'video.html'),
      },
      output: {
        // Hash ilə fayl adları — orijinal adlar gizlənir
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: (assetInfo) => {
          // Media fayllarını (şəkil, audio) olduğu kimi saxla
          const ext = assetInfo.name?.split('.').pop()?.toLowerCase() || '';
          const mediaExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp3', 'wav', 'ogg', 'mp4', 'webm', 'ico'];
          if (mediaExts.includes(ext)) {
            return 'assets/[name][extname]';
          }
          return 'assets/[hash][extname]';
        },
      },
    },

    // Chunk ölçüsü xəbərdarlığını arıqlar
    chunkSizeWarningLimit: 500,
  },

  // CSS source map-ları da kapat
  css: {
    devSourcemap: false,
  },

  // Dev server
  server: {
    port: 5173,
    open: true,
  },
});
