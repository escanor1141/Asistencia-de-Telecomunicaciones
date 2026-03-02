# Sistema de Control de Asistencia - Telecomunicaciones

Aplicación Full-Stack para el registro y gestión de asistencia de estudiantes.

## Requisitos
- Node.js 18+
- PostgreSQL

## Estructura
- `backend/`: API REST con Next.js App Router y Prisma ORM
- `frontend/`: Cliente UI con React y Vite

## Instalación y Ejecución Local

1. Instalar dependencias para todo el proyecto desde la raíz:
```bash
npm run install:all
```
*(O puedes entrar a cada carpeta y ejecutar `npm install`)*

2. Configurar Base de Datos:
   - Ingresa a la carpeta `backend`
   - Crea un archivo `.env` basado en `.env.example` con tu string de conexión de PostgreSQL.
   - Ejecuta las migraciones:
```bash
cd backend
npx prisma db push
```

3. Ejecutar entorno de desarrollo:
   - Desde la raíz, ejecuta:
```bash
npm run dev
```
Esto iniciará simultáneamente el Backend en `http://localhost:3001` y el Frontend en `http://localhost:3000`.

## Docker (Producción Backend)
Puedes usar el `Dockerfile` ubicado en la carpeta `backend` para desplegar la API en Railway, Render o cualquier plataforma de contenedores.
