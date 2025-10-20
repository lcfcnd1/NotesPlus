# Sistema de Migraciones de NotesPlus

## 📋 Descripción

El sistema de migraciones de NotesPlus permite actualizar la estructura de la base de datos de manera controlada y versionada, evitando problemas cuando se ejecuta el servidor múltiples veces o cuando se necesitan agregar nuevas funcionalidades.

## 🔧 Cómo Funciona

### 1. **Verificación Automática**
- Cada vez que se inicia el servidor, se verifica la versión actual de la base de datos
- Solo se ejecutan las migraciones que aún no han sido aplicadas
- Se mantiene un registro de todas las migraciones aplicadas

### 2. **Tabla de Control**
Se crea automáticamente una tabla `schema_version` que contiene:
- `version`: Número de versión de la migración
- `description`: Descripción de lo que hace la migración
- `applied_at`: Fecha y hora cuando se aplicó la migración

### 3. **Migraciones Disponibles**
Actualmente se encuentra la migración inicial (versión 1) que crea:
- Tabla `users` para usuarios
- Tabla `notes` para notas
- Tabla `schema_version` para control de versiones

## 🚀 Agregar Nuevas Migraciones

### Ejemplo: Agregar campo de categorías

Para agregar un nuevo campo a las notas existentes, sigue estos pasos:

1. **Edita el archivo `migrations/migrations.js`**
2. **Descomenta y modifica la migración de ejemplo:**

```javascript
{
  version: 2,
  description: 'Agregar campo de categorías a las notas',
  up: () => {
    return new Promise((resolve, reject) => {
      this.db.run(`ALTER TABLE notes ADD COLUMN category TEXT DEFAULT 'general'`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
```

3. **Reinicia el servidor**
4. **La migración se aplicará automáticamente**

### Ejemplo: Agregar tabla de archivos adjuntos

```javascript
{
  version: 3,
  description: 'Agregar tabla de archivos adjuntos',
  up: () => {
    return new Promise((resolve, reject) => {
      this.db.run(`CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
```

## 📊 Verificar Estado de Migraciones

### Endpoint de Desarrollo
Puedes verificar el estado de las migraciones visitando:
```
GET http://localhost:3000/api/migrations/status
```

Respuesta ejemplo:
```json
{
  "currentVersion": 1,
  "totalMigrations": 3,
  "appliedMigrations": [
    {
      "version": 1,
      "description": "Crear tablas iniciales",
      "applied_at": "2024-01-15 10:30:00"
    }
  ],
  "pendingMigrations": [
    {
      "version": 2,
      "description": "Agregar campo de categorías a las notas"
    },
    {
      "version": 3,
      "description": "Agregar tabla de archivos adjuntos"
    }
  ]
}
```

## ⚠️ Consideraciones Importantes

### 1. **Orden de Versiones**
- Las migraciones deben tener números de versión secuenciales
- No se pueden saltar versiones
- Si necesitas insertar una migración entre versiones existentes, usa decimales (ej: 1.5)

### 2. **Modificaciones de Estructura**
- **ALTER TABLE**: Para agregar/modificar columnas
- **CREATE TABLE**: Para nuevas tablas
- **CREATE INDEX**: Para índices de rendimiento
- **Evita**: DROP TABLE o DROP COLUMN en migraciones (pueden causar pérdida de datos)

### 3. **Valores por Defecto**
- Siempre especifica valores por defecto para nuevas columnas
- Esto evita errores con registros existentes

### 4. **Backup Recomendado**
- Antes de aplicar migraciones importantes, haz backup de la base de datos
- El archivo `notes.db` contiene todos los datos

## 🔄 Flujo de Trabajo Recomendado

1. **Desarrollo Local**
   - Agrega la nueva migración al archivo
   - Prueba localmente
   - Verifica que no haya errores

2. **Producción**
   - Haz backup de la base de datos
   - Despliega el nuevo código
   - Las migraciones se aplicarán automáticamente al iniciar

3. **Verificación**
   - Usa el endpoint `/api/migrations/status` para verificar
   - Revisa los logs del servidor
   - Prueba las nuevas funcionalidades

## 🛠️ Comandos Útiles

### Ver logs de migraciones
```bash
npm start
# Busca en la consola mensajes como:
# 🔍 Verificando migraciones de base de datos...
# 📊 Versión actual de la base de datos: 1
# 🔄 Ejecutando 1 migración(es) pendiente(s)...
# 📝 Ejecutando migración v2: Agregar campo de categorías
# ✅ Migración v2 completada
```

### Backup de base de datos
```bash
# En Windows
copy notes.db notes_backup.db

# En Linux/Mac
cp notes.db notes_backup.db
```

### Restaurar backup
```bash
# En Windows
copy notes_backup.db notes.db

# En Linux/Mac
cp notes_backup.db notes.db
```

## 🎯 Ejemplos de Migraciones Comunes

### Agregar campo booleano
```javascript
{
  version: 4,
  description: 'Agregar campo de favoritos',
  up: () => {
    return new Promise((resolve, reject) => {
      this.db.run(`ALTER TABLE notes ADD COLUMN is_favorite BOOLEAN DEFAULT 0`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
```

### Agregar campo con índice
```javascript
{
  version: 5,
  description: 'Agregar campo de fecha de vencimiento con índice',
  up: () => {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`ALTER TABLE notes ADD COLUMN due_date DATETIME`, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          this.db.run(`CREATE INDEX IF NOT EXISTS idx_notes_due_date ON notes(due_date)`, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });
  }
}
```

### Migración compleja con datos
```javascript
{
  version: 6,
  description: 'Migrar datos existentes y agregar nueva estructura',
  up: () => {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 1. Crear nueva tabla
        this.db.run(`CREATE TABLE IF NOT EXISTS note_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          note_id INTEGER NOT NULL,
          tag_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // 2. Migrar datos existentes (ejemplo)
          this.db.run(`INSERT INTO note_tags (note_id, tag_name) 
                       SELECT id, 'general' FROM notes WHERE color = '#ffffff'`, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });
  }
}
```

---

**¡Con este sistema puedes evolucionar tu base de datos de manera segura y controlada! 🚀**
