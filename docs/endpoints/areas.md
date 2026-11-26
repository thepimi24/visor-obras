# Áreas · `/api/areas`

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/api/areas` | Lista todas |
| GET | `/api/areas/:id` | 404 si no existe |
| POST | `/api/areas` | Requiere `name_area` |
| PUT | `/api/areas/:id` | Parcial; campos opcionales |
| DELETE | `/api/areas/:id` | 409 si hay espacios/obras/afectaciones |

## Body POST
```json
{ "name_area": "Piso 2", "descripcion_area": null, "notas_area": null }
```
