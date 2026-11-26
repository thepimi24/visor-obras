# Inmuebles · `/api/inmuebles`

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/api/inmuebles` | Filtros `id_obra_proyecto`, `estado_inmueble` |
| GET | `/api/inmuebles/:id` | Detalle |
| POST | `/api/inmuebles` | Requiere obra existente |
| PUT | `/api/inmuebles/:id` | Parcial |
| DELETE | `/api/inmuebles/:id` | 409 si un proyecto lo usa como principal |
