# Aplicación de Notas - Sistema Offline
Proyecto de aplicación web para gestionar notas personales. Funciona sin conexión a internet y sincroniza automáticamente cuando hay red disponible.

# Qué hace
La aplicación permite crear, editar y eliminar notas. Lo interesante es que funciona aunque no tengas internet - las notas se guardan localmente y cuando vuelve la conexión, todo se sincroniza automáticamente entre diferentes dispositivos/ventanas.

# Tecnologías que use
- Backend: Node.js con Express para el servidor (decidi hacerlo con esto ya que estoy aprendiendo esto por mi cuenta)
- Frontend: HTML, CSS y JavaScript puro (sin frameworks)
- Almacenamiento: LocalStorage en el navegador y memoria en el servidor
- API: REST con endpoints para CRUD y sincronización

# Cómo ejecutar
# 1. Instalar dependencias del servidor
Abrir PowerShell en la carpeta `server` y ejecutar:
```powershell
npm install
```
# 2. Iniciar el servidor
Desde la misma carpeta:
```powershell
npm start
```
O también:
```powershell
node server.js
```
El servidor corre en `http://localhost:3000`

# 3. Abrir los clientes
Para probar la sincronización necesitas abrir dos ventanas/clientes. Recomiendo usar Live Server de VS Code:
- Abre `client1/index.html` con Live Server (puerto 5500)
- Abre `client2/index.html` con Live Server en otro puerto
También puedes abrir directamente los archivos HTML en el navegador, pero la sincronización funciona mejor con un servidor local.

# Cómo probarlo
1. Crear notas: Escribe algo en los campos de título y contenido, dale a "Agregar"
2. Editar: Click en "Editar", cambia el texto y guarda
3. Eliminar: Click en "Eliminar" y confirma
4. Ver sincronización: Crea una nota en cliente 1, espera unos segundos y aparecerá en cliente 2
5. Modo offline: Apaga el servidor (Ctrl+C), sigue creando notas. Cuando lo vuelvas a prender, todo se sincroniza

# Notas técnicas
- La sincronización usa "Last Write Wins" - si editas lo mismo en dos lugares, gana el cambio más reciente
- El polling se hace cada 3 segundos (configurable en `app.js`)
- El indicador de conexión revisa cada 2 segundos si hay servidor
- Las notas eliminadas se registran en el servidor para que no reaparezcan al sincronizar


