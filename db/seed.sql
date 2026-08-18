-- Sample starter data so the app isn't empty after first deploy.
-- Safe to run multiple times thanks to ON CONFLICT DO NOTHING.

INSERT INTO vehicles (plate_number, make, model, year, fuel_type, status, mileage) VALUES
  ('LSO 1234', 'Toyota', 'Hilux', 2021, 'diesel', 'active', 42500),
  ('LSO 5678', 'Isuzu', 'D-Max', 2020, 'diesel', 'active', 61200),
  ('LSO 9012', 'Toyota', 'Corolla', 2022, 'petrol', 'in_maintenance', 15300)
ON CONFLICT (plate_number) DO NOTHING;

INSERT INTO drivers (full_name, license_number, phone, email, status) VALUES
  ('Thabo Mokoena', 'DL-00123', '+266 5000 1111', 'thabo@example.com', 'available'),
  ('Palesa Nthunya', 'DL-00456', '+266 5000 2222', 'palesa@example.com', 'on_trip')
ON CONFLICT (license_number) DO NOTHING;
