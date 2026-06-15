# ITSM Icetel

Portal de tickets para el registro de eventos e incidencias del datacenter, operado por monitoreo. Construido con **React + Vite** y conectado a **Supabase**.

Tiene dos pestañas:

1. **Tickets** — ingresar, editar, comentar y cerrar tickets, con el panel general.
2. **Estadísticas** — métricas mensuales del servicio, incluyendo MTTR y MTBF.

---

## 1. Requisitos

- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`).
- Una cuenta de Supabase (proyecto creado con `farredondo@icetel.cl`).

## 2. Configurar la base de datos en Supabase

1. Entra a tu proyecto en [supabase.com](https://supabase.com).
2. Menú lateral → **SQL Editor** → **New query**.
3. Copia y pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y presiona **Run**.
   - Esto crea las tablas `tickets` y `ticket_comentarios`, los tipos (enums), índices y las políticas de acceso (RLS).
4. (Opcional) Al final del archivo hay un bloque comentado con datos de ejemplo; descoméntalo y vuelve a ejecutar si quieres probar con tickets de muestra.

## 3. Obtener las credenciales

En Supabase → **Project Settings** (engranaje) → **API**:

- **Project URL** → variable `VITE_SUPABASE_URL`
- **anon public** key → variable `VITE_SUPABASE_ANON_KEY`

> La `anon key` es pública por diseño; la seguridad la dan las políticas RLS. Para uso interno dejamos acceso abierto; si más adelante quieres restringir por usuario, se activa Supabase Auth.

## 4. Ejecutar en local

```bash
npm install              # instala dependencias (una sola vez)
cp .env.example .env     # crea tu archivo .env
# edita .env y pega tu URL y anon key
npm run dev              # abre http://localhost:5173
```

Para generar la versión de producción:

```bash
npm run build            # genera la carpeta dist/
npm run preview          # previsualiza el build
```

## 5. Publicar en GitHub Pages

El repo incluye un workflow en `.github/workflows/deploy.yml` que compila y publica automáticamente.

1. Sube el proyecto a un repositorio de GitHub (rama `main`).
2. En el repo → **Settings → Secrets and variables → Actions → New repository secret**, crea:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. En **Settings → Pages → Build and deployment → Source**, elige **GitHub Actions**.
4. Cada `push` a `main` desplegará el sitio. La URL aparece en la pestaña **Actions** y en Settings → Pages.

---

## Estructura del proyecto

```
itsm-icetel/
├─ supabase/schema.sql        # script de base de datos
├─ src/
│  ├─ App.jsx                 # layout + pestañas + carga de datos
│  ├─ constants.js            # catálogos (tipos, áreas, salas, activos)
│  ├─ supabaseClient.js       # conexión a Supabase
│  ├─ lib/stats.js            # cálculos de estadísticas, MTTR y MTBF
│  └─ components/
│     ├─ TicketsTab.jsx       # panel general (tabla + acciones)
│     ├─ TicketForm.jsx       # alta/edición de tickets
│     ├─ CommentsModal.jsx    # observaciones del ticket
│     ├─ CloseTicketModal.jsx # cierre con fecha/hora obligatoria
│     ├─ StatsTab.jsx         # pestaña de estadísticas
│     ├─ Combobox.jsx         # selector con búsqueda (sala/activo)
│     └─ Icons.jsx            # íconos SVG
└─ .github/workflows/deploy.yml
```

## Catálogos pendientes

Los listados de **salas** y **activos** están como ejemplo en `src/constants.js`
(`SALAS` y `ACTIVOS`). Reemplázalos por el detalle real de Icetel cuando lo tengas
— el buscador del desplegable funciona automáticamente con cualquier lista.

## Notas sobre las métricas

- **MTTR** (Tiempo Medio de Respuesta): promedio de `fecha_cierre − fecha_inicio` de los **incidentes cerrados** del mes seleccionado.
- **MTBF** (Tiempo Medio Entre Fallos): se calcula solo para activos con **más de un incidente** en el mes. Muestra el tiempo medio transcurrido entre incidentes consecutivos de cada activo.
