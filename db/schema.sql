-- Fleet management schema. Safe to run repeatedly (IF NOT EXISTS everywhere).

CREATE TABLE IF NOT EXISTS vehicles (
  id             SERIAL PRIMARY KEY,
  plate_number   TEXT NOT NULL UNIQUE,
  make           TEXT NOT NULL,
  model          TEXT NOT NULL,
  year           INTEGER,
  fuel_type      TEXT DEFAULT 'petrol',
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'in_maintenance', 'out_of_service')),
  mileage        INTEGER DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id             SERIAL PRIMARY KEY,
  full_name      TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  phone          TEXT,
  email          TEXT,
  status         TEXT NOT NULL DEFAULT 'available'
                   CHECK (status IN ('available', 'on_trip', 'off_duty')),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance (
  id             SERIAL PRIMARY KEY,
  vehicle_id     INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type   TEXT NOT NULL,
  description    TEXT,
  cost           NUMERIC DEFAULT 0,
  service_date   DATE NOT NULL,
  next_due_date  DATE,
  status         TEXT NOT NULL DEFAULT 'completed'
                   CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id             SERIAL PRIMARY KEY,
  vehicle_id     INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id      INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  start_location TEXT NOT NULL,
  end_location   TEXT NOT NULL,
  start_time     TIMESTAMP NOT NULL,
  end_time       TIMESTAMP,
  distance_km    NUMERIC DEFAULT 0,
  purpose        TEXT,
  status         TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fuel_logs (
  id             SERIAL PRIMARY KEY,
  vehicle_id     INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  log_date       DATE NOT NULL,
  liters         NUMERIC NOT NULL,
  cost           NUMERIC NOT NULL,
  odometer       INTEGER,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_logs(vehicle_id);
