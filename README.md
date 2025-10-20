# 📝 NotesPlus

Una aplicación de notas moderna con diseño cristalino estilo Windows Aero, construida con Node.js, SQLite y tecnologías web modernas.

![NotesPlus Screenshot](screenshots/desktop-screenshot.png)

## ✨ Características

### 🎨 **Diseño Cristalino**
- Interfaz glassmorphism con efectos de cristal
- Gradientes y transparencias estilo Windows Aero
- Animaciones suaves y transiciones elegantes
- Diseño completamente responsivo

### 📱 **Progressive Web App (PWA)**
- Instalable en dispositivos móviles y escritorio
- Funciona offline con Service Worker
- Notificaciones push (próximamente)
- Atajos de teclado y gestos

### 🔐 **Autenticación Segura**
- Registro e inicio de sesión
- Encriptación de contraseñas con bcrypt
- Tokens JWT para sesiones seguras
- Persistencia de sesión

### 📝 **Editor de Notas Avanzado**
- Editor de texto enriquecido con formato
- Detección automática de URLs
- Nodos arrastrables para listas y TODOs
- Sistema de flags con colores personalizados
- Búsqueda en tiempo real

### 🗂️ **Gestión de Contenido**
- Crear, editar y eliminar notas
- Categorización por colores
- Sistema de flags para organización
- Listas de tareas con estado completado
- Búsqueda instantánea

## 🚀 Instalación

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/notesplus.git
   cd notesplus
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar migraciones de base de datos**
   ```bash
   npm run migrate
   ```

4. **Iniciar el servidor**
   ```bash
   npm start
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **SQLite3** - Base de datos ligera
- **bcrypt** - Encriptación de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **express-validator** - Validación de datos
- **helmet** - Seguridad HTTP
- **cors** - Configuración CORS

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos con glassmorphism
- **JavaScript ES6+** - Lógica de la aplicación
- **Font Awesome** - Iconografía
- **Google Fonts** - Tipografía Inter

### PWA
- **Service Worker** - Funcionalidad offline
- **Web App Manifest** - Metadatos de instalación
- **Cache API** - Almacenamiento offline

## 📁 Estructura del Proyecto

```
notesplus/
├── public/
│   ├── index.html          # Página principal
│   ├── styles.css          # Estilos CSS
│   ├── app.js             # Lógica JavaScript
│   ├── manifest.json      # Manifest PWA
│   ├── sw.js             # Service Worker
│   └── icons/            # Iconos PWA
├── migrations/
│   ├── migrations.js     # Sistema de migraciones
│   └── MIGRATIONS.md     # Documentación
├── server.js            # Servidor Express
├── package.json         # Dependencias npm
├── .gitignore          # Archivos ignorados por Git
└── README.md           # Este archivo
```

## 🔧 Scripts Disponibles

```bash
# Iniciar servidor de desarrollo
npm start

# Ejecutar migraciones
npm run migrate

# Verificar estado de migraciones
npm run migrate:status
```

## 🎯 Funcionalidades Principales

### Sistema de Notas
- **Crear notas** con título y contenido
- **Editor rico** con formato de texto
- **Colores personalizados** para categorización
- **Búsqueda instantánea** por título y contenido

### Nodos Interactivos
- **Lista simple** - Elementos de texto
- **Lista con flags** - Elementos con etiquetas de colores
- **TODOs** - Lista de tareas con estado completado
- **Drag & Drop** - Arrastrar nodos al editor

### Sistema de Flags
- **Crear flags** personalizadas con colores
- **Asignar flags** a elementos de lista
- **Gestión completa** de flags existentes

## 🔒 Seguridad

- **Validación de entrada** en frontend y backend
- **Sanitización** de datos HTML
- **Rate limiting** para prevenir ataques
- **Headers de seguridad** con Helmet
- **CORS** configurado apropiadamente

## 📱 Instalación como PWA

1. Abre la aplicación en Chrome/Edge
2. Haz clic en el botón "Instalar" en la barra de direcciones
3. O usa el botón "Instalar NotesPlus" que aparece automáticamente
4. La aplicación se instalará como una app nativa

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@ejemplo.com

## 🙏 Agradecimientos

- Inspirado en el diseño de Windows Aero
- Iconos de Font Awesome
- Tipografía Inter de Google Fonts
- Comunidad de desarrolladores web

---

⭐ **¡Dale una estrella al proyecto si te gusta!** ⭐