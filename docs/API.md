# API Visor de obras

Servidor único: Node/Express (`npm start`) sirve `/api/*` y `static/`.

## Endpoints

| Recurso | Prefijo | Doc |
|---------|---------|-----|
| Health | `GET /api/health` | — |
| Snapshot | `/api/datos` | [datos](endpoints/datos.md) |
| Áreas | `/api/areas` | [areas](endpoints/areas.md) |
| Espacios | `/api/espacios` | [espacios](endpoints/espacios.md) |
| Proyectos | `/api/proyectos` | [proyectos](endpoints/proyectos.md) |
| Obras | `/api/obras` | [obras](endpoints/obras.md) |
| Inmuebles | `/api/inmuebles` | [inmuebles](endpoints/inmuebles.md) |
| Afectaciones | `/api/afectaciones` | [afectaciones](endpoints/afectaciones.md) |

## Flujo de trabajo Git

- Una rama por tarea: `feat/…`, `docs/…`, `chore/…`
- Commits pequeños y claros (`api/obras: valida id_proyecto al crear`)
- Pull requests hacia `main`
