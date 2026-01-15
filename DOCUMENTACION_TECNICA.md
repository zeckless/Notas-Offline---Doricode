# Aplicación de Notas con Soporte Offline

Prueba técnica para Doricode - Sistema de notas personales con sincronización offline-first.

## Descripción

Aplicación web para gestionar notas personales que funciona completamente offline. Las notas se guardan localmente y cuando hay conexión, se sincronizan automáticamente entre diferentes clientes.

## Características principales

- Crear, editar y eliminar notas
- Funciona sin conexión a internet
- Sincronización automática entre clientes
- Indicador visual de estado de conexión
- Resolución de conflictos con Last Write Wins
- Persistencia local con LocalStorage

## Tecnologías utilizadas

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Almacenamiento**: LocalStorage (cliente) y memoria (servidor)
- **Comunicación**: API REST con polling cada 3 segundos

## Inicio Rápido

### 1. Instalar dependencias

```powershell
cd server
npm install
```

### 2. Iniciar servidor

```powershell
node server.js
```

El servidor corre en `http://localhost:3000`

### 3. Abrir clientes

Para probar la sincronización, abre ambos clientes:

- Abre `client1/index.html` con Live Server (VS Code)
- Abre `client2/index.html` con Live Server en otra ventana

También puedes abrir los archivos HTML directamente en el navegador.

## Cómo usar

1. **Crear nota**: Escribe título y contenido, presiona "Agregar Nota"
2. **Editar nota**: Click en "✏️ Editar", modifica el texto y presiona "💾 Guardar"
3. **Eliminar nota**: Click en "🗑️ Eliminar" y confirma
4. **Ver sincronización**: Crea una nota en un cliente, aparecerá automáticamente en el otro en 3 segundos
5. **Modo offline**: Detén el servidor, la app sigue funcionando. Al reiniciar, todo se sincroniza

## Estructura del proyecto

```
├── client1/              # Cliente 1
│   ├── index.html       # Interfaz HTML
│   ├── app.js          # Lógica de la aplicación
│   └── styles.css      # Estilos
├── client2/             # Cliente 2 (mismo código)
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── server/              # Backend
│   ├── server.js       # Servidor Express
│   ├── package.json    # Dependencias
│   └── README.md       # Documentación del servidor
├── prueba_tecnica.md    # Requerimientos originales
├── politica_uso_de_git.md
├── politica_uso_de_IA.md
└── README.md           # Este archivo
```

## API Endpoints

- `POST /api/notes/sync` - Sincronizar notas (Last Write Wins)
- `DELETE /api/notes/:id` - Eliminar una nota
- `GET /api/health` - Verificar estado del servidor

## Decisiones técnicas

### ¿Por qué Node.js + Express?
Elegí Node.js porque estoy aprendiéndolo por mi cuenta y quería aplicar lo aprendido. Express hace simple crear una API REST.

### ¿Por qué Last Write Wins?
Es la estrategia más simple para resolver conflictos. Si dos clientes editan la misma nota, gana el que guardó más recientemente (mayor timestamp).

### ¿Por qué polling y no WebSockets?
Para simplicidad. WebSockets sería mejor para tiempo real, pero polling cada 3 segundos es suficiente para este caso de uso.

### Manejo de eliminaciones
El servidor mantiene un registro de IDs eliminados que envía en cada sincronización. Esto evita que notas eliminadas reaparezcan al sincronizar desde otros clientes.

## Pruebas recomendadas

1. **Sincronización básica**:
   - Crea nota en cliente 1 → Aparece en cliente 2
   - Edita en cliente 2 → Se actualiza en cliente 1
   - Elimina en cliente 1 → Desaparece en cliente 2

2. **Modo offline**:
   - Detén el servidor (Ctrl+C)
   - Crea notas en ambos clientes
   - Reinicia servidor
   - Verifica que todo se sincronice

3. **Conflictos**:
   - Edita la misma nota en ambos clientes casi simultáneamente
   - La última modificación prevalece

4. **Persistencia**:
   - Crea notas
   - Cierra el navegador
   - Vuelve a abrir → Las notas siguen ahí

## Problemas comunes

**No sincroniza**: Verifica que el servidor esté corriendo en puerto 3000

**Notas duplicadas**: Limpia LocalStorage con `localStorage.clear()` en la consola del navegador

**Puerto ocupado**: Cambia el `PORT` en `server.js` y actualiza `SERVER_URL` en los `app.js`

## Versionamiento

Este proyecto usa Semantic Versioning según la política de Doricode:
- Versión inicial: `0.1.0`

## Autor

Mario - Prueba técnica para proceso de selección Doricode

## Notas adicionales

- El servidor usa almacenamiento en memoria, por lo que las notas se pierden al reiniciarlo
- No hay autenticación ni gestión de usuarios (uso personal)
- El código está limpio y comentado donde es necesario
