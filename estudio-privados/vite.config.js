import { defineConfig } from 'vite';

// base relativa: el sitio compilado funciona en cualquier subcarpeta o servidor estático.
// Puerto fijo: el avance se guarda en localStorage, que depende de la dirección (origen).
// Si el puerto cambiara de un día a otro, parecería que el avance se perdió.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
});
