# Documentación Técnica - Aplicación de Notas Offline

# Arquitectura
- Cliente-Servidor: Comunicación mediante API REST
- Persistencia: LocalStorage (cliente) + Memoria (servidor)
- Sincronización: Polling cada 3 segundos

# Resolución de Conflictos
Last Write Wins: Gana la nota con timestamp más reciente

# Endpoints API
- GET `/api/notes` - Obtener todas las notas
- POST `/api/notes` - Crear nota
- PUT `/api/notes/:id` - Actualizar nota
- DELETE `/api/notes/:id` - Eliminar nota

# Manejo de Eliminaciones
El servidor mantiene un Set de IDs eliminados que se envía en cada sincronización.

# Estados del Cliente
- Conectado: Verde, sincroniza cada 3 seg
- Desconectado: Rojo, trabaja solo con LocalStorage