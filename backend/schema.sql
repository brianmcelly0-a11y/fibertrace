-- FiberTrace Complete Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'technician',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- 2. Login History
CREATE TABLE IF NOT EXISTS login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_info VARCHAR(255)
);

-- 3. Nodes (Active Components)
CREATE TABLE IF NOT EXISTS nodes (
  id SERIAL PRIMARY KEY,
  node_name VARCHAR(255) NOT NULL,
  node_type VARCHAR(100),
  latitude FLOAT,
  longitude FLOAT,
  elevation FLOAT,
  power_status VARCHAR(50),
  power_rating FLOAT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Closures (FAT, ATB, Dome, etc.)
CREATE TABLE IF NOT EXISTS closures (
  id SERIAL PRIMARY KEY,
  closure_name VARCHAR(255) NOT NULL,
  closure_type VARCHAR(100),
  latitude FLOAT,
  longitude FLOAT,
  capacity_total INTEGER,
  capacity_used INTEGER,
  parent_node_id INTEGER REFERENCES nodes(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Splitters
CREATE TABLE IF NOT EXISTS splitters (
  id SERIAL PRIMARY KEY,
  splitter_label VARCHAR(255),
  ratio VARCHAR(50),
  insertion_loss FLOAT,
  location_type VARCHAR(100),
  host_id INTEGER,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Fiber Cables / Lines
CREATE TABLE IF NOT EXISTS fiber_lines (
  id SERIAL PRIMARY KEY,
  line_name VARCHAR(255),
  fiber_count INTEGER,
  length_meters FLOAT,
  start_point_type VARCHAR(100),
  start_point_id INTEGER,
  end_point_type VARCHAR(100),
  end_point_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Power Readings
CREATE TABLE IF NOT EXISTS power_readings (
  id SERIAL PRIMARY KEY,
  node_id INTEGER REFERENCES nodes(id),
  voltage FLOAT,
  current FLOAT,
  battery_level FLOAT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. FAT Ports (Customer Drops)
CREATE TABLE IF NOT EXISTS fat_ports (
  id SERIAL PRIMARY KEY,
  closure_id INTEGER REFERENCES closures(id),
  port_number INTEGER,
  status VARCHAR(50),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  last_service_date TIMESTAMP
);

-- 9. Meter Readings (Bluetooth)
CREATE TABLE IF NOT EXISTS meter_readings (
  id SERIAL PRIMARY KEY,
  device_type VARCHAR(100),
  reading_value FLOAT,
  reading_unit VARCHAR(50),
  linked_asset_type VARCHAR(100),
  linked_asset_id INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Jobs / Work Orders
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  job_title VARCHAR(255),
  job_type VARCHAR(100),
  assigned_to_user_id INTEGER REFERENCES users(id),
  asset_type VARCHAR(100),
  asset_id INTEGER,
  scheduled_date TIMESTAMP,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Job Actions
CREATE TABLE IF NOT EXISTS job_actions (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  action_description TEXT,
  before_photo_path VARCHAR(255),
  after_photo_path VARCHAR(255),
  gps_lat FLOAT,
  gps_lon FLOAT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Daily Reports
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  date DATE,
  summary TEXT,
  total_jobs INTEGER,
  total_distance_walked FLOAT,
  total_lines_added INTEGER,
  power_issues TEXT,
  sync_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Map Tiles (Offline Maps)
CREATE TABLE IF NOT EXISTS map_tiles (
  id SERIAL PRIMARY KEY,
  tile_x INTEGER,
  tile_y INTEGER,
  zoom_level INTEGER,
  tile_image_blob BYTEA,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. GPS Logs
CREATE TABLE IF NOT EXISTS gps_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  latitude FLOAT,
  longitude FLOAT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Asset Updates (Change Log)
CREATE TABLE IF NOT EXISTS asset_updates (
  id SERIAL PRIMARY KEY,
  asset_type VARCHAR(100),
  asset_id INTEGER,
  user_id INTEGER REFERENCES users(id),
  change_description TEXT,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT,
  type VARCHAR(100),
  read_status BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Files / Attachments
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  file_path VARCHAR(255),
  linked_type VARCHAR(100),
  linked_id INTEGER,
  uploaded_by INTEGER REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_nodes_location ON nodes(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_closures_location ON closures(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_gps_logs_user ON gps_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_power_readings_node ON power_readings(node_id);
