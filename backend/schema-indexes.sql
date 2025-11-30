-- Performance optimization: Database indexes
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_created_by ON routes(created_by);
CREATE INDEX IF NOT EXISTS idx_nodes_route_id ON nodes(route_id);
CREATE INDEX IF NOT EXISTS idx_nodes_latitude_longitude ON nodes(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_closures_route_id ON closures(route_id);
CREATE INDEX IF NOT EXISTS idx_closures_latitude_longitude ON closures(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_splices_closure_id ON splices(closure_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_assigned_to ON inventory(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_uploads_entity_id ON uploads(entity_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
