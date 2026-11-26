# Proyectos · `/api/proyectos`

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/api/proyectos` | Filtro `?check_estatus=` |
| GET | `/api/proyectos/:id` | Detalle |
| GET | `/api/proyectos/:id/obras` | Obras del proyecto |
| POST | `/api/proyectos` | Requiere `check_estatus`, `name_contact`, `id_inmueble`, `ubicacion` |
| PUT | `/api/proyectos/:id` | Parcial |
| DELETE | `/api/proyectos/:id` | 409 si tiene obras |

`id_inmueble` debe existir (inmueble principal del proyecto).
