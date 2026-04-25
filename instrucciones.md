Read DESIGN.md from the root of this project completely before
doing anything. It is the single source of truth for all visual
and technical decisions.

TECH STACK (do not deviate from this):
- Frontend: React 18 + Vite, React Router DOM, Axios, Tailwind CSS,
  Recharts, react-hot-toast, PapaParse, xlsx, vite-plugin-pwa
- Backend: Next.js 14 App Router, Prisma ORM, PostgreSQL,
  JWT + bcryptjs, node-cron, Brevo, Evolution API
- All code in JavaScript only — no TypeScript (.jsx and .js only)
- Icons: lucide-react only
- Charts: recharts only

LANGUAGE: Everything must be in Spanish:
- All user-facing text (labels, buttons, titles, placeholders,
  messages, tooltips, empty states, errors)
- All variable names, function names, component names
- All comments in code
- Status values: Presente, Ausente, Tardanza, Justificado
- Date format: toLocaleDateString('es-CO')
- Time format: toLocaleTimeString('es-CO')
- Numbers: toLocaleString('es-CO')
- Do NOT translate: JavaScript/React/Next.js reserved words,
  library names, Prisma keywords, HTTP methods, .env variables,
  Next.js file conventions (route.js, page.jsx, layout.jsx)

COLORS (UTS institutional palette from DESIGN.md):
- Primary: #6B2D8B (morado UTS)
- Accent: #8DC63F (verde lima UTS)
- Background: #F8F9FC
- Surface: #FFFFFF
- Border: #E2E6EF
- All colors must use CSS variables — never hardcode hex values

DO NOT touch these folders:
- node_modules/
- .next/
- dist/
- public/
- prisma/migrations/
- .env
- package.json
- package-lock.json

MCP TOOLS:
- Use Stitch MCP server to generate the UI design for each
  of the 6 views before implementing them in code.
- Fetch the Design DNA from Stitch via MCP after each
  generation and use it as the visual reference for the
  React component.
- Do not design components manually — always go through
  Stitch MCP first.

STEP 1 — Token setup:
Update /frontend/src/index.css with all CSS variables from
DESIGN.md section 2. Remove any old hardcoded colors.
Configure /frontend/tailwind.config.js to extend with these
CSS variables.

STEP 2 — Global layout:
Build AppLayout.jsx with:
- Sidebar 240px with UTS purple active states
- Topbar 60px
- Main content area padding 32px, max-width 1200px
- Navigation labels in Spanish:
  Panel Principal, Asistencia, Estudiantes, Cursos,
  Reportes, Configuración, Cerrar Sesión
- App name: AttendTrack UTS
- Sidebar collapses to bottom navigation on < 768px

STEP 3 — Generate and implement the 6 views using Stitch MCP:
For each view invoke Stitch MCP with:
"Design a [view name] for a university attendance system.
Clean minimal style. Primary color #6B2D8B, accent #8DC63F.
DM Sans font. White surfaces, subtle borders #E2E6EF.
Follow DESIGN.md spacing scale."

Implement in this order:
1. Panel Principal (/) — KPI cards with real API data:
   total estudiantes, % asistencia hoy, ausentes hoy.
   Actividad reciente table with real data from API.
   No hardcoded data. Use useEffect to fetch on mount.
   Show "Cargando..." while fetching.
   Show "Error al cargar los datos" on failure.
   Show "No hay actividad reciente" when empty.

2. Asistencia (/asistencia) — date and course selector,
   student list with Presente/Ausente/Tardanza/Justificado
   toggle per row, save button

3. Estudiantes (/estudiantes) — searchable table with
   nombre, ID, curso, % asistencia

4. Cursos (/cursos) — card grid with nombre, profesor,
   horario, % asistencia

5. Reportes (/reportes) — filters by date range and course,
   summary stats, export button

6. Configuración (/configuracion) — institution name,
   schedule config, account info, teachers table

STEP 4 — Connect all views to real API:
Use /frontend/src/services/api.js for all data fetching.
No hardcoded data anywhere in the codebase.
All API responses displayed in Spanish.

STEP 5 — Vibe check:
Open the integrated browser and verify each view visually.
Search entire /frontend/src for:
- Hardcoded hex values → replace with CSS variables
- English user-facing text → translate to Spanish
- TypeScript syntax → remove if any exists

CONSTRAINTS (never violate):
- CSS variables only — no hardcoded colors or sizes
- DM Sans and DM Mono fonts only
- No box-shadow stronger than 0 1px 3px rgba(0,0,0,0.06)
- No background gradients on functional surfaces
- No animations on tables with more than 20 rows
- focus-visible on all inputs and buttons
- aria-label on all icons without visible text
- Follow all rules in DESIGN.md section 10