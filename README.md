# Klock Academia — Frontend

React 19 + Vite 8, PWA instalable. Consume el backend de academia.

## Scripts

- `npm run dev` — desarrollo en `http://localhost:5173`.
- `npm run build` — type-check (`tsc -b`) + bundle de producción en `dist/`.
- `npm run preview` — sirve el build localmente.

## Variables de entorno (`.env`)

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | URL del backend **incluyendo `/api`**. Ej. `https://<backend>.onrender.com/api`. |

## Despliegue en Vercel

- Root del proyecto: `academia-product/frontend`.
- Build command: `npm run build`. Output: `dist`.
- Variable: `VITE_API_BASE_URL`.
- `vercel.json` ya incluye el rewrite SPA y los headers no-cache del Service Worker.

## Reconocimiento facial

Los modelos de `face-api.js` viven en `public/models/`. El componente `FaceScan`
hace la captura guiada (estilo círculo/silueta) y la verificación contra el backend.
