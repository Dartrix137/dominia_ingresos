# DOMINIA 1.0 — Sistema de Control de Acceso

## 📋 Qué hace la aplicación

Sistema interno para gestionar el ingreso de asistentes al evento **DOMINIA 1.0** en el Teatro San Fernando (Cali). Permite registrar asistentes, generar tickets QR únicos en PDF, y verificar el ingreso el día del evento escaneando los QR.

### Flujo principal

1. **Registro de asistentes** (antes del evento)
   - Individual: nombre + cédula + localidad → genera PDF con QR único
   - Masivo: importación por CSV con reporte de errores por fila

2. **Generación de tickets PDF** (formato cyberpunk)
   - Replica exacta del diseño LSD | La Sucursal Digital
   - Cada asistente recibe un PDF con su QR único (UUID v4 no adivinable)
   - Datos variables: nombre, cédula, localidad, QR
   - Datos fijos: header LSD, footer del evento, imagen del cyborg

3. **Verificación de ingreso** (día del evento)
   - El staff escanea el QR del asistente con la cámara del dispositivo
   - Alternativa: ingreso manual del UUID/URL si la cámara falla
   - La página muestra: "✓ REGISTRADO" + datos + timestamp, o "✗ ACCESO DENEGADO" si no existe
   - Botón "MARCAR INGRESO" registra el ingreso
   - Botón "REVERTIR INGRESO" deshace un ingreso por error

4. **Dashboard en vivo**
   - Stats en tiempo real: total, ingresados, pendientes, % de ingreso
   - Gráfico de ingresos por hora (detección de hora pico)
   - Breakdown por localidad (VIP / General Baja / General Alta)
   - Lista de asistentes con búsqueda, filtros y acciones (PDF, editar, eliminar)

---

## 🛠️ Stack tecnológico

### Core
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 16.1.3 | Framework full-stack (App Router, Turbopack) |
| **React** | 19 | Librería de UI |
| **TypeScript** | 5 | Lenguaje tipado |
| **Tailwind CSS** | 4 | Estilos utility-first |

### Base de datos
| Tecnología | Uso |
|------------|-----|
| **Prisma ORM** | 6.19 — ORM con tipado |
| **SQLite** | Base de datos embebida |

**Modelos:**
- `Attendee` — id, uuid, fullName, cedula, locality, timestamps
- `CheckIn` — id, attendeeId, checkedAt, revertedAt

### UI / Componentes
| Tecnología | Uso |
|------------|-----|
| **shadcn/ui** (New York) | Componentes accesibles (Tabs, Select, Dialog, etc.) |
| **Radix UI** | Primitivos accesibles subyacentes |
| **Lucide React** | Iconografía |
| **Sonner** | Notificaciones toast |
| **Framer Motion** | Animaciones |

### Funcionalidades específicas
| Tecnología | Uso |
|------------|-----|
| **jsPDF** | Generación del PDF del ticket |
| **qrcode** | Generación del código QR (UUID v4) |
| **papaparse** | Parsing y validación del CSV |
| **html5-qrcode** | Escáner de QR con cámara (con fallback) |
| **Recharts** | Gráfico de barras de ingresos por hora |
| **sharp** | Procesamiento de imagen del cyborg (recorte + oscurecimiento) |

### Herramientas de desarrollo
| Herramienta | Uso |
|-------------|-----|
| **Bun** | Runtime y package manager |
| **ESLint** | Linting |
| **Agent Browser** | Verificación E2E automatizada |

---

## 🏗️ Arquitectura

### Rutas (App Router)
```
/                        → Dashboard (client-only, dinámico)
/scan                    → Escáner de QR con cámara
/v/[uuid]                → Verificación pública del ticket
/api/attendees           → CRUD de asistentes
/api/attendees/[id]      → PATCH/DELETE
/api/attendees/[id]/check-in
/api/attendees/[id]/revert
/api/attendees/import    → POST CSV
/api/verify/[uuid]       → GET verificación
/api/stats               → GET estadísticas en vivo
/api/pdf/[id]            → GET PDF del ticket
```

### Estructura de archivos
```
src/
├── app/
│   ├── page.tsx                       # Server: loader del dashboard
│   ├── dashboard-client-loader.tsx    # Client: dynamic import (ssr: false)
│   ├── dashboard-client.tsx           # Dashboard completo
│   ├── scan/
│   │   ├── page.tsx
│   │   └── scan-client.tsx            # Escáner con fallback
│   ├── v/[uuid]/
│   │   ├── page.tsx                   # Server: lookup del asistente
│   │   └── verify-client.tsx          # UI de verificación
│   ├── api/...                        # Route handlers
│   └── layout.tsx                     # Layout + Sonner toaster
├── lib/
│   ├── constants.ts                   # Config del evento
│   ├── db.ts                          # Cliente Prisma
│   └── pdf.ts                         # Generador del PDF
└── components/ui/                     # shadcn/ui components
```

---

## 🎨 Diseño

**Estética cyberpunk** alineada con el brand LSD | La Sucursal Digital:
- Fondo negro puro (#000000)
- Verde neón (#00FF88) — acciones primarias, pills
- Violeta eléctrico (#8B00FF) — barras, acentos
- Tipografía bold + tracking amplio
- Efectos neón (text-shadow con glow)
- Layout responsive (mobile-first)

---

## ✅ Decisiones técnicas clave

| Decisión | Justificación |
|----------|---------------|
| **Sin autenticación** | App interna — el usuario solicitó quitar el PIN |
| **UUID v4 en QR** | No adivinable — evita clonación de tickets |
| **Dashboard con `ssr: false`** | Evita hydration mismatch con IDs de Radix |
| **Escáner con fallback triple** | Cámara trasera → frontal → cualquier dispositivo → ingreso manual |
| **Cyborg oscurecido en sharp** | Oculta texto residual del JPEG original |
| **CSV con header mapping flexible** | Acepta `fullName`/`nombre`/`name`, `cedula`/`documento`/`id`, etc. |
| **CheckIn revertible** | Permite deshacer errores del staff sin perder histórico |
