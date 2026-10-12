# SpartanGym Web

Frontend React/Vite para administración y recepción de SpartanGym.

## Desarrollo

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Configura `VITE_API_BASE_URL` en `.env`. Para la API local:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

No pongas secretos en variables `VITE_*`: quedan visibles en el bundle del
navegador.

## Validación y producción

```powershell
npm run lint
npm run build
npm run preview
```

El proyecto usa rutas protegidas por rol para las áreas de administración y
recepción. La sesión y el token JWT se gestionan desde `src/services/api.js`.
