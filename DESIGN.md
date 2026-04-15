# Design System — MercaConnect

## 1. Visual Theme & Atmosphere

MercaConnect adopta un minimalismo verde-neutro: superficies blancas o gris muy claro, texto oscuro de alto contraste, y el verde de marca usado con moderación como acento de confianza. El sidebar y navbar usan `#1A3E35` (verde oscuro profundo) como ancla visual de la marca. El acento `#74E79C` aparece solo en estados activos, indicadores y CTAs — nunca como fondo de página.

La tipografía base es **Poppins** (variable `--font-poppins`), una sans-serif geométrica de alta legibilidad. Los componentes UI heredan de shadcn/ui con ajustes mínimos.

El sistema de elevación usa sombras sutiles (no bordes) para separar capas — inspirado en el enfoque de Cal.com pero adaptado al panel operativo de un negocio.

**Principios clave:**
- Fondo del panel: blanco puro (`#ffffff`) o gris muy claro (`#f9fafb`) — no verde
- El verde `#1A3E35` ancla la navegación (sidebar + navbar) — coherencia de marca sin saturar el contenido
- El acento `#74E79C` es escaso: solo active states, badges de progreso, iconos de éxito
- Sombras sobre bordes para la elevación de cards
- Espaciado generoso: mínimo 24px entre secciones del dashboard

---

## 2. Color Palette & Roles

### Paleta de Marca MercaConnect

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Forest Dark** | `#1A3E35` | Navbar, Sidebar, botones primarios oscuros |
| **Mint Accent** | `#74E79C` | Active states, badges, progreso, iconos de éxito |
| **Mint Light** | `#EEFAEE` | Fondo muy claro (evitar en panel — demasiado tintado) |

### Roles en el panel

| Token | Light | Dark | Descripción |
|-------|-------|------|-------------|
| `background` | `#ffffff` | `#0d1f1a` | Canvas principal del panel |
| `card` | `#ffffff` | `#122018` | Superficie de tarjetas |
| `foreground` | `#111827` | `#f0fdf4` | Texto principal |
| `muted-foreground` | `#6b7280` | `#9ca3af` | Texto secundario, etiquetas |
| `border` | `#e5e7eb` | `#1f3a30` | Bordes de cards e inputs |
| `primary` | `#1A3E35` | `#74E79C` | Botón primario, enlaces de acción |
| `accent` | `#74E79C` | `#74E79C` | Active states, indicadores |
| `muted` | `#f3f4f6` | `#1a2e26` | Fondos de sección muted |

### Filosofía de uso del color

- **No uses `#74E79C` como fondo de sección** — solo como acento puntual
- **No uses `#EEFAEE` como fondo del panel** — el blanco puro es más limpio y profesional
- **`#1A3E35` es el color de marca** — sidebar y navbar lo usan; en el contenido solo en botones primarios oscuros
- El verde claro (`#74E79C` al 10–20% de opacidad) está permitido en hover states y backgrounds de badges

---

## 3. Typography

| Rol | Familia | Tamaño | Peso | Notas |
|-----|---------|--------|------|-------|
| Heading principal | Poppins | 28–32px | 700 | Títulos de página |
| Section heading | Poppins | 20–24px | 600 | Encabezados de sección |
| Card title | Poppins | 16px | 600 | Títulos de tarjeta |
| Body | Poppins | 14–16px | 400 | Texto de contenido |
| Label / Caption | Poppins | 12–13px | 500 | Etiquetas, metadatos |
| Metric number | Poppins | 24–28px | 700 | Cifras de KPI |

**Reglas:**
- `tracking-tight` en headings grandes (≥20px)
- `text-muted-foreground` para texto secundario — nunca hardcodear colores grises
- Usar siempre tokens semánticos de Tailwind (`text-foreground`, `text-muted-foreground`) en lugar de colores fijos

---

## 4. Component Stylings

### Cards
- Fondo: `bg-card` (blanco en light, oscuro en dark)
- Borde: `border border-border` — 1px, gris neutro
- Sombra: `shadow-sm` — elevación sutil, no dramática
- Radio: `rounded-xl` (12px)
- Hover: `hover:shadow-md transition-shadow`

### Botones primarios
- **Dark primary:** `bg-[#1A3E35] text-white hover:bg-[#1A3E35]/90` — el CTA principal
- **Outline:** `variant="outline"` shadcn — borde `border-border`, fondo transparente
- **Ghost:** `variant="ghost"` — sin borde, fondo en hover

### Sidebar (navegación principal)
- Fondo: `#1A3E35` (Forest Dark)
- Texto normal: `text-white/70`
- Texto hover: `text-white`
- Hover bg: `bg-white/10`
- Active bg: `bg-[#74E79C]/20 text-[#74E79C]`
- Sección labels: `text-white/40 uppercase tracking-wider text-xs`

### Navbar
- Fondo: `#1A3E35`
- Z-index: 20 (por encima del sidebar)
- Altura: `h-16`

### Badges / status pills
- Éxito / activo: fondo `#74E79C/15`, texto `#1A3E35` (light) o `#74E79C` (dark)
- Advertencia: `amber` tokens
- Error: `destructive` tokens
- Radio: `rounded-full`

### Inputs
- Borde: `border-border`
- Focus: ring `#74E79C` a 50% opacidad
- Radio: `rounded-lg` (8px)

### Status badges de pedidos
- `entregado`: `bg-emerald-100 text-emerald-700`
- `pendiente`: `bg-amber-100 text-amber-700`
- `cancelado`: `bg-red-100 text-red-700`
- otros: `bg-blue-100 text-blue-700`

---

## 5. Layout Principles

### Spacing
- Base: 8px
- Entre cards del dashboard: `gap-4` (16px)
- Padding del content area: `p-6` (24px)
- Secciones del dashboard: `space-y-6`
- Section heading margin: `mb-4`

### Grid
- Métricas KPI: `grid-cols-2 lg:grid-cols-4`
- Sección de detalles: `grid-cols-1 lg:grid-cols-7` (4+3)
- Max width del contenido: `max-w-6xl mx-auto`

### Sidebar
- Ancho: `w-64` (256px)
- Oculto en mobile: `hidden md:block`
- Main content offset: `md:ml-64`

---

## 6. Depth & Elevation

| Nivel | Clase Tailwind | Uso |
|-------|----------------|-----|
| Flat | sin sombra | Canvas, textos |
| Surface | `shadow-sm` | Cards estándar |
| Raised | `shadow-md` | Cards en hover, dropdowns |
| Overlay | `shadow-lg` | Modales, popovers |

**Filosofía:**
- Sombras, no bordes coloridos, para separar capas
- En dark mode las sombras se reducen; la separación la dan los fondos ligeramente más claros
- Sin gradientes en el panel (solo en landing si aplica)

---

## 7. Do's and Don'ts

### Do
- Usar `text-foreground` y `text-muted-foreground` — nunca hardcodear colores de texto
- Usar `bg-card` para surfaces — nunca `bg-white` directo
- Reservar `#74E79C` para estados activos, progreso e íconos de éxito
- Mantener el sidebar y navbar en `#1A3E35` como ancla de marca
- `rounded-xl` para cards, `rounded-lg` para inputs y botones
- Whitespace generoso: `space-y-6` mínimo en el contenido del dashboard

### Don't
- No usar `#EEFAEE` como fondo del panel (demasiado tintado, poco profesional)
- No hardcodear colores en componentes — usar tokens CSS variables
- No saturar el contenido con verde — el blanco es el canvas
- No usar bordes de colores de marca en cards — usar `border-border` neutro
- No reducir el padding del content por debajo de `p-6`

---

## 8. Responsive Behavior

| Breakpoint | Comportamiento |
|------------|---------------|
| `< md` (768px) | Sidebar oculto, navbar con hamburger |
| `md` (768px+) | Sidebar fijo visible, main con `ml-64` |
| `lg` (1024px+) | Grid de 4 columnas para métricas |
| `xl` (1280px+) | Max-width `max-w-6xl` centrado |

### Mobile
- Cards se apilan en una columna
- Métricas: 2 columnas en `sm`, 4 en `lg`
- Touch targets mínimo 44px

---

## 9. Quick Reference

```
Colores de marca:
  Forest Dark:  #1A3E35  → navbar, sidebar, botón primario
  Mint Accent:  #74E79C  → active, badges, éxito
  Mint Light:   #EEFAEE  → NO usar en panel

Tokens clave:
  bg-background    → canvas del panel (blanco)
  bg-card          → superficie de tarjetas
  text-foreground  → texto principal
  text-muted-foreground → texto secundario
  border-border    → bordes neutros

Sombras:
  shadow-sm  → cards en reposo
  shadow-md  → cards en hover / dropdowns
```
