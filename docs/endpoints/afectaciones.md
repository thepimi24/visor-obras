# Afectaciones · `/api/afectaciones`

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/api/afectaciones` | Filtros `id_area`, `name_especialidad` |
| GET | `/api/afectaciones/:id` | Detalle |
| POST | `/api/afectaciones` | Requiere `name_afectacion`, `name_especialidad`, `id_area` |
| PUT | `/api/afectaciones/:id` | Parcial |
| DELETE | `/api/afectaciones/:id` | Sin dependencias FK hijas |
