// Local SQLite database for self-contained offline operation
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bcrypt from 'bcryptjs';

const DB = SQLite.openDatabase('fibertrace.db');

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return;
  
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      // Users table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'technician',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Routes table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS routes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          route_type TEXT,
          status TEXT DEFAULT 'active',
          length_meters REAL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Nodes table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS nodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          node_type TEXT,
          latitude REAL,
          longitude REAL,
          power_rating REAL,
          status TEXT DEFAULT 'active',
          route_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (route_id) REFERENCES routes(id)
        );`
      );

      // Jobs table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          assigned_to INTEGER,
          route_id INTEGER,
          priority TEXT DEFAULT 'normal',
          due_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (assigned_to) REFERENCES users(id),
          FOREIGN KEY (route_id) REFERENCES routes(id)
        );`
      );

      // Closures table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS closures (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          location TEXT,
          fiber_count INTEGER,
          status TEXT DEFAULT 'active',
          route_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (route_id) REFERENCES routes(id)
        );`
      );

      // Splices table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS splices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          closure_id INTEGER,
          status TEXT DEFAULT 'active',
          splice_type TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (closure_id) REFERENCES closures(id)
        );`
      );

      // Inventory table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          quantity INTEGER,
          location TEXT,
          status TEXT DEFAULT 'available',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Customers table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          contact_email TEXT,
          contact_phone TEXT,
          location TEXT,
          service_area TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );
    }, 
    error => {
      console.error('Database init error:', error);
      reject(error);
    },
    () => {
      initialized = true;
      seedInitialData();
      resolve(true);
    });
  });
}

async function seedInitialData() {
  // Check if users already exist
  return new Promise(resolve => {
    DB.transaction(tx => {
      tx.executeSql(
        'SELECT COUNT(*) as count FROM users',
        [],
        (_, result) => {
          if (result.rows._array[0].count === 0) {
            // Hash passwords
            const adminHash = bcrypt.hashSync('admin123456', 10);
            const techHash = bcrypt.hashSync('tech123456', 10);
            const fieldHash = bcrypt.hashSync('field123456', 10);

            tx.executeSql(
              `INSERT INTO users (full_name, email, phone, password_hash, role) VALUES 
              ('Admin User', 'admin@fibertrace.app', '555-0001', ?, 'admin'),
              ('John Tech', 'john@fibertrace.app', '555-0002', ?, 'technician'),
              ('Jane Field', 'jane@fibertrace.app', '555-0003', ?, 'field_tech');`,
              [adminHash, techHash, fieldHash]
            );

            // Add sample routes
            tx.executeSql(
              `INSERT INTO routes (name, route_type, status, length_meters, description) VALUES 
              ('Main Backbone Route', 'Backbone', 'active', 15000, 'Primary fiber route'),
              ('Distribution Loop A', 'Distribution', 'active', 8500, 'Secondary distribution'),
              ('Access Network B', 'Access', 'active', 3200, 'End user access route');`
            );

            // Add sample nodes
            tx.executeSql(
              `INSERT INTO nodes (name, node_type, latitude, longitude, power_rating, status, route_id) VALUES 
              ('OLT Central', 'OLT', 37.7749, -122.4194, 48, 'active', 1),
              ('Splitter Node 1', 'Splitter', 37.7750, -122.4195, 24, 'active', 1),
              ('FAT Hub', 'FAT', 37.7751, -122.4196, 12, 'active', 2);`
            );

            // Add sample jobs
            tx.executeSql(
              `INSERT INTO jobs (title, description, status, assigned_to, route_id, priority) VALUES 
              ('Fiber Installation', 'Install new fiber segment', 'pending', 2, 1, 'high'),
              ('Maintenance Check', 'Routine equipment inspection', 'in_progress', 3, 2, 'normal');`
            );
          }
          resolve(true);
        }
      );
    });
  });
}

// AUTH OPERATIONS
export async function registerUser(data: { full_name: string; email: string; phone?: string; password: string; role?: string }) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      const passwordHash = bcrypt.hashSync(data.password, 10);
      tx.executeSql(
        `INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
        [data.full_name, data.email, data.phone || '', passwordHash, data.role || 'technician'],
        (_, result) => {
          const user = {
            id: result.insertRowId,
            full_name: data.full_name,
            email: data.email,
            role: data.role || 'technician',
          };
          resolve({ success: true, user });
        },
        error => {
          reject({ success: false, error: error.message });
        }
      );
    });
  });
}

export async function loginUser(email: string, password: string) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (_, result) => {
          if (result.rows.length === 0) {
            reject({ success: false, error: 'User not found' });
            return;
          }

          const user = result.rows._array[0];
          const passwordMatch = bcrypt.compareSync(password, user.password_hash);

          if (!passwordMatch) {
            reject({ success: false, error: 'Invalid credentials' });
            return;
          }

          const userData = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
          };

          resolve({ success: true, user: userData });
        },
        error => {
          reject({ success: false, error: error.message });
        }
      );
    });
  });
}

// ROUTES OPERATIONS
export async function getRoutes() {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM routes ORDER BY created_at DESC`,
        [],
        (_, result) => {
          resolve({ routes: result.rows._array });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function getRoute(id: number) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM routes WHERE id = ?`,
        [id],
        (_, result) => {
          if (result.rows.length === 0) {
            reject(new Error('Route not found'));
            return;
          }
          resolve(result.rows._array[0]);
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function createRoute(data: any) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `INSERT INTO routes (name, route_type, status, length_meters, description) VALUES (?, ?, ?, ?, ?)`,
        [data.name, data.route_type, data.status || 'active', data.length_meters || 0, data.description || ''],
        (_, result) => {
          resolve({
            id: result.insertRowId,
            ...data,
          });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function updateRoute(id: number, data: any) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `UPDATE routes SET name = ?, route_type = ?, status = ?, length_meters = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [data.name, data.route_type, data.status, data.length_meters, data.description, id],
        () => {
          resolve({ id, ...data });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function deleteRoute(id: number) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `DELETE FROM routes WHERE id = ?`,
        [id],
        () => {
          resolve({ success: true });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

// NODES OPERATIONS
export async function getNodes() {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM nodes ORDER BY created_at DESC`,
        [],
        (_, result) => {
          resolve({ nodes: result.rows._array });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function getNode(id: number) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM nodes WHERE id = ?`,
        [id],
        (_, result) => {
          if (result.rows.length === 0) {
            reject(new Error('Node not found'));
            return;
          }
          resolve(result.rows._array[0]);
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function createNode(data: any) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `INSERT INTO nodes (name, node_type, latitude, longitude, power_rating, status, route_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.name, data.node_type, data.latitude || 0, data.longitude || 0, data.power_rating || 0, data.status || 'active', data.route_id || null],
        (_, result) => {
          resolve({
            id: result.insertRowId,
            ...data,
          });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function updateNode(id: number, data: any) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `UPDATE nodes SET name = ?, node_type = ?, latitude = ?, longitude = ?, power_rating = ?, status = ?, route_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [data.name, data.node_type, data.latitude, data.longitude, data.power_rating, data.status, data.route_id, id],
        () => {
          resolve({ id, ...data });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

// JOBS OPERATIONS
export async function getJobs() {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM jobs ORDER BY created_at DESC`,
        [],
        (_, result) => {
          resolve({ jobs: result.rows._array });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function getJob(id: number) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM jobs WHERE id = ?`,
        [id],
        (_, result) => {
          if (result.rows.length === 0) {
            reject(new Error('Job not found'));
            return;
          }
          resolve(result.rows._array[0]);
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function createJob(data: any) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `INSERT INTO jobs (title, description, status, assigned_to, route_id, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.title, data.description || '', data.status || 'pending', data.assigned_to || null, data.route_id || null, data.priority || 'normal', data.due_date || null],
        (_, result) => {
          resolve({
            id: result.insertRowId,
            ...data,
          });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function updateJob(id: number, data: any) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `UPDATE jobs SET title = ?, description = ?, status = ?, assigned_to = ?, route_id = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [data.title, data.description, data.status, data.assigned_to, data.route_id, data.priority, data.due_date, id],
        () => {
          resolve({ id, ...data });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

// CLOSURES OPERATIONS
export async function getClosures() {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM closures ORDER BY created_at DESC`,
        [],
        (_, result) => {
          resolve({ closures: result.rows._array });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function createClosure(data: any) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `INSERT INTO closures (name, location, fiber_count, status, route_id) VALUES (?, ?, ?, ?, ?)`,
        [data.name, data.location || '', data.fiber_count || 0, data.status || 'active', data.route_id || null],
        (_, result) => {
          resolve({
            id: result.insertRowId,
            ...data,
          });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

// INVENTORY OPERATIONS
export async function getInventory() {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM inventory ORDER BY created_at DESC`,
        [],
        (_, result) => {
          resolve({ inventory: result.rows._array });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

export async function createInventoryItem(data: any) {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `INSERT INTO inventory (name, quantity, location, status) VALUES (?, ?, ?, ?)`,
        [data.name, data.quantity || 0, data.location || '', data.status || 'available'],
        (_, result) => {
          resolve({
            id: result.insertRowId,
            ...data,
          });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

// MAP DATA
export async function getMapData() {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT r.id, r.name as routeName, n.id as nodeId, n.name as nodeName, n.latitude, n.longitude, n.node_type 
         FROM routes r 
         LEFT JOIN nodes n ON n.route_id = r.id 
         WHERE r.status = 'active' AND n.status = 'active'`,
        [],
        (_, result) => {
          resolve({
            routes: result.rows._array,
          });
        },
        error => {
          reject(error);
        }
      );
    });
  });
}

// STATS
export async function getStats() {
  return new Promise((resolve, reject) => {
    DB.transaction(tx => {
      tx.executeSql(
        `SELECT 
          (SELECT COUNT(*) FROM routes WHERE status = 'active') as totalRoutes,
          (SELECT COUNT(*) FROM nodes WHERE status = 'active') as totalNodes,
          (SELECT COUNT(*) FROM jobs WHERE status = 'pending') as pendingJobs,
          (SELECT COUNT(*) FROM jobs WHERE status = 'in_progress') as inProgressJobs`,
        [],
        (_, result) => {
          resolve(result.rows._array[0]);
        },
        error => {
          reject(error);
        }
      );
    });
  });
}
