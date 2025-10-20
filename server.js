const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const path = require('path');
const MigrationManager = require('./migrations/migrations');

const app = express();
const PORT = process.env.PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_aqui';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));



// Configurar SQLite
const db = new sqlite3.Database('./notes.db');

// Inicializar el sistema de migraciones
const migrationManager = new MigrationManager(db);

// Inicializar la base de datos
migrationManager.runMigrations().catch(error => {
  console.error('Error inicializando la base de datos:', error);
  process.exit(1);
});

// Función para guardar datos de nodos
function saveNodeData(noteId, nodeData, callback) {
  let completed = 0;
  let hasError = false;
  
  if (nodeData.length === 0) {
    callback(null);
    return;
  }
  
  nodeData.forEach(node => {
    if (node.type === 'list' || node.type === 'flag-list' || node.type === 'todo') {
      node.data.items.forEach(item => {
        db.run(
          'INSERT INTO list_items (note_id, content, flag_id, position, completed) VALUES (?, ?, ?, ?, ?)',
          [noteId, item.content, item.flag_id || null, item.position, item.completed || null],
          function(err) {
            if (err && !hasError) {
              hasError = true;
              callback(err);
              return;
            }
            
            completed++;
            if (completed === nodeData.reduce((total, n) => total + n.data.items.length, 0)) {
              callback(null);
            }
          }
        );
      });
    }
  });
}

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rutas de autenticación
app.post('/api/register', [
  body('username').isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'El usuario o email ya existe' });
          }
          return res.status(500).json({ error: 'Error interno del servidor' });
        }

        const token = jwt.sign(
          { id: this.lastID, username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'Usuario registrado exitosamente',
          token,
          user: { id: this.lastID, username, email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/login', [
  body('username').notEmpty().withMessage('Nombre de usuario requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          message: 'Inicio de sesión exitoso',
          token,
          user: { id: user.id, username: user.username, email: user.email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas de notas
app.get('/api/notes', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC',
    [req.user.id],
    (err, notes) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener las notas' });
      }
      res.json(notes);
    }
  );
});

app.post('/api/notes', authenticateToken, [
  body('title').notEmpty().withMessage('El título es requerido'),
  body('content').notEmpty().withMessage('El contenido es requerido')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, content_html, color = '#ffffff', node_data } = req.body;

    db.run(
      'INSERT INTO notes (user_id, title, content, content_html, color) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, content, content_html || null, color],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al crear la nota' });
        }

        const noteId = this.lastID;

        // Guardar datos de nodos si existen
        if (node_data && node_data.length > 0) {
          saveNodeData(noteId, node_data, (err) => {
            if (err) {
              console.error('Error guardando datos de nodos:', err);
            }
          });
        }

        // Obtener la nota completa con fechas
        db.get(
          'SELECT * FROM notes WHERE id = ?',
          [noteId],
          (err, note) => {
            if (err) {
              return res.status(500).json({ error: 'Error al obtener la nota creada' });
            }
            
            res.status(201).json({
              message: 'Nota creada exitosamente',
              note: note
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/notes/:id', authenticateToken, [
  body('title').notEmpty().withMessage('El título es requerido'),
  body('content').notEmpty().withMessage('El contenido es requerido')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, content_html, color, node_data } = req.body;

    db.run(
      'UPDATE notes SET title = ?, content = ?, content_html = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [title, content, content_html || null, color, id, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al actualizar la nota' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Nota no encontrada' });
        }

        // Eliminar datos de nodos existentes y guardar los nuevos
        if (node_data !== undefined) {
          db.run('DELETE FROM list_items WHERE note_id = ?', [id], (err) => {
            if (err) {
              console.error('Error eliminando datos de nodos:', err);
            }
            
            if (node_data && node_data.length > 0) {
              saveNodeData(id, node_data, (err) => {
                if (err) {
                  console.error('Error guardando datos de nodos:', err);
                }
              });
            }
          });
        }

        // Obtener la nota actualizada completa
        db.get(
          'SELECT * FROM notes WHERE id = ? AND user_id = ?',
          [id, req.user.id],
          (err, note) => {
            if (err) {
              return res.status(500).json({ error: 'Error al obtener la nota actualizada' });
            }
            
            res.json({ 
              message: 'Nota actualizada exitosamente',
              note: note
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM notes WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar la nota' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      res.json({ message: 'Nota eliminada exitosamente' });
    }
  );
});

// Ruta para fijar/desfijar notas
app.patch('/api/notes/:id/pin', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { is_pinned } = req.body;

  if (typeof is_pinned !== 'boolean') {
    return res.status(400).json({ error: 'is_pinned debe ser un valor booleano' });
  }

  db.run(
    'UPDATE notes SET is_pinned = ? WHERE id = ? AND user_id = ?',
    [is_pinned ? 1 : 0, id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar el estado de fijado' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      res.json({ 
        message: is_pinned ? 'Nota fijada exitosamente' : 'Nota desfijada exitosamente',
        is_pinned 
      });
    }
  );
});

// Ruta para obtener elementos de lista de una nota
app.get('/api/notes/:id/items', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.all(
    `SELECT li.*, f.name as flag_name, f.color as flag_color 
     FROM list_items li 
     LEFT JOIN flags f ON li.flag_id = f.id 
     WHERE li.note_id = ? 
     ORDER BY li.position ASC`,
    [id],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener elementos de la lista' });
      }
      res.json(items);
    }
  );
});

// Rutas para flags
app.get('/api/flags', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM flags ORDER BY name ASC',
    (err, flags) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener las flags' });
      }
      res.json(flags);
    }
  );
});

app.post('/api/flags', authenticateToken, [
  body('name').notEmpty().withMessage('El nombre de la flag es requerido'),
  body('color').optional().isHexColor().withMessage('El color debe ser un código hexadecimal válido')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color = '#667eea' } = req.body;

    db.run(
      'INSERT INTO flags (name, color) VALUES (?, ?)',
      [name, color],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Ya existe una flag con ese nombre' });
          }
          return res.status(500).json({ error: 'Error al crear la flag' });
        }

        res.status(201).json({
          message: 'Flag creada exitosamente',
          flag: { id: this.lastID, name, color }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/flags/:id', authenticateToken, [
  body('name').notEmpty().withMessage('El nombre de la flag es requerido'),
  body('color').optional().isHexColor().withMessage('El color debe ser un código hexadecimal válido')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, color } = req.body;

    db.run(
      'UPDATE flags SET name = ?, color = ? WHERE id = ?',
      [name, color, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al actualizar la flag' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Flag no encontrada' });
        }

        res.json({ message: 'Flag actualizada exitosamente' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/flags/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM flags WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar la flag' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Flag no encontrada' });
      }

      res.json({ message: 'Flag eliminada exitosamente' });
    }
  );
});

// Ruta para verificar el estado de las migraciones (solo para desarrollo)
app.get('/api/migrations/status', async (req, res) => {
  try {
    const history = await migrationManager.getMigrationHistory();
    const currentVersion = await migrationManager.getCurrentSchemaVersion();
    
    res.json({
      currentVersion,
      totalMigrations: migrationManager.migrations.length,
      appliedMigrations: history,
      pendingMigrations: migrationManager.migrations.filter(m => m.version > currentVersion)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estado de migraciones' });
  }
});

// Servir la aplicación principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Cerrar conexión a la base de datos al cerrar la aplicación
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Conexión a la base de datos cerrada.');
    process.exit(0);
  });
});
