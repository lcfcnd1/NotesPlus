// migrations/migrations.js
// Sistema de migraciones para NotesPlus

const sqlite3 = require('sqlite3').verbose();

class MigrationManager {
  constructor(db) {
    this.db = db;
    this.migrations = [];
    this.loadMigrations();
  }

  loadMigrations() {
    this.migrations = [
      {
        version: 1,
        description: 'Crear tablas iniciales',
        up: () => {
          return new Promise((resolve, reject) => {
            this.db.serialize(() => {
              // Tabla de versiones de esquema
              this.db.run(`CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                description TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )`);

              // Tabla de usuarios
              this.db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )`);

              // Tabla de notas
              this.db.run(`CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                color TEXT DEFAULT '#ffffff',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
              )`, (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            });
          });
        }
      },
      // Migración para soporte de contenido HTML y nodos
      {
        version: 2,
        description: 'Agregar soporte para contenido HTML y nodos',
        up: () => {
          return new Promise((resolve, reject) => {
            this.db.serialize(() => {
              // Agregar campo para contenido HTML
              this.db.run(`ALTER TABLE notes ADD COLUMN content_html TEXT`, (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                
                // Crear tabla para flags
                this.db.run(`CREATE TABLE IF NOT EXISTS flags (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL,
                  color TEXT DEFAULT '#667eea',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  
                  // Crear tabla para elementos de lista con flags
                  this.db.run(`CREATE TABLE IF NOT EXISTS list_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    note_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    flag_id INTEGER,
                    position INTEGER DEFAULT 0,
                    completed BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
                    FOREIGN KEY (flag_id) REFERENCES flags (id) ON DELETE SET NULL
                  )`, (err) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    
                    resolve();
                  });
                });
              });
            });
          });
        }
      },
      {
        version: 3,
        description: 'Agregar campo completed a list_items para soporte de TODOs',
        up: () => {
          return new Promise((resolve, reject) => {
            this.db.run(`ALTER TABLE list_items ADD COLUMN completed BOOLEAN DEFAULT 0`, (err) => {
              if (err) {
                // Si la columna ya existe, no es un error
                if (err.message.includes('duplicate column name')) {
                  console.log('Columna completed ya existe en list_items');
                  resolve();
                } else {
                  reject(err);
                }
              } else {
                resolve();
              }
            });
          });
        }
      },
      {
        version: 4,
        description: 'Agregar campo is_pinned para fijar notas',
        up: () => {
          return new Promise((resolve, reject) => {
            this.db.run(`ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT 0`, (err) => {
              if (err) {
                // Si la columna ya existe, no es un error
                if (err.message.includes('duplicate column name')) {
                  console.log('Columna is_pinned ya existe en notes');
                  resolve();
                } else {
                  reject(err);
                }
              } else {
                resolve();
              }
            });
          });
        }
      },
      // {
      //   version: 5,
      //   description: 'Agregar campo de favoritos a las notas',
      //   up: () => {
      //     return new Promise((resolve, reject) => {
      //       this.db.run(`ALTER TABLE notes ADD COLUMN is_favorite BOOLEAN DEFAULT 0`, (err) => {
      //         if (err) reject(err);
      //         else resolve();
      //       });
      //     });
      //   }
      // },
      // {
      //   version: 4,
      //   description: 'Agregar tabla de archivos adjuntos',
      //   up: () => {
      //     return new Promise((resolve, reject) => {
      //       this.db.run(`CREATE TABLE IF NOT EXISTS attachments (
      //         id INTEGER PRIMARY KEY AUTOINCREMENT,
      //         note_id INTEGER NOT NULL,
      //         filename TEXT NOT NULL,
      //         file_path TEXT NOT NULL,
      //         file_size INTEGER,
      //         mime_type TEXT,
      //         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      //         FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
      //       )`, (err) => {
      //         if (err) reject(err);
      //         else resolve();
      //       });
      //     });
      //   }
      // }
    ];
  }

  async runMigrations() {
    try {
      console.log('🔍 Verificando migraciones de base de datos...');
      
      // Obtener la versión actual de la base de datos
      const currentVersion = await this.getCurrentSchemaVersion();
      console.log(`📊 Versión actual de la base de datos: ${currentVersion}`);
      
      // Ejecutar migraciones pendientes
      const pendingMigrations = this.migrations.filter(migration => migration.version > currentVersion);
      
      if (pendingMigrations.length === 0) {
        console.log('✅ Base de datos actualizada');
        return;
      }
      
      console.log(`🔄 Ejecutando ${pendingMigrations.length} migración(es) pendiente(s)...`);
      
      for (const migration of pendingMigrations) {
        console.log(`📝 Ejecutando migración v${migration.version}: ${migration.description}`);
        await migration.up();
        await this.updateSchemaVersion(migration.version, migration.description);
        console.log(`✅ Migración v${migration.version} completada`);
      }
      
      console.log('🎉 Todas las migraciones completadas exitosamente');
      
    } catch (error) {
      console.error('❌ Error ejecutando migraciones:', error);
      throw error;
    }
  }

  getCurrentSchemaVersion() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT MAX(version) as version FROM schema_version', (err, row) => {
        if (err) {
          // Si la tabla no existe, significa que es la primera vez
          resolve(0);
        } else {
          resolve(row.version || 0);
        }
      });
    });
  }

  updateSchemaVersion(version, description) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO schema_version (version, description) VALUES (?, ?)',
        [version, description],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Método para agregar nuevas migraciones dinámicamente
  addMigration(migration) {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  // Método para obtener el historial de migraciones
  async getMigrationHistory() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM schema_version ORDER BY version ASC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = MigrationManager;
