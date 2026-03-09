
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('student', 'employee', 'admin');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_number INTEGER NOT NULL,
  label TEXT,
  map_image_url TEXT,
  map_width INTEGER,
  map_height INTEGER,
  map_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(building_id, floor_number)
);

CREATE TYPE room_type AS ENUM (
  'classroom', 'lab', 'office', 'bathroom',
  'staircase', 'elevator', 'common_area', 'other'
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT,
  room_type room_type NOT NULL DEFAULT 'other',
  pos_x DOUBLE PRECISION,
  pos_y DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(floor_id, code)
);

CREATE TYPE node_type AS ENUM (
  'corridor', 'intersection', 'door', 'exit',
  'staircase', 'elevator', 'room_entrance'
);

CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  node_type node_type NOT NULL DEFAULT 'corridor',
  label TEXT,
  pos_x DOUBLE PRECISION NOT NULL,
  pos_y DOUBLE PRECISION NOT NULL,
  is_exit BOOLEAN NOT NULL DEFAULT FALSE,
  is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nodes_floor ON nodes(floor_id);
CREATE INDEX idx_nodes_type ON nodes(node_type);
CREATE INDEX idx_nodes_exit ON nodes(is_exit) WHERE is_exit = TRUE;

CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,  -- distance or time cost
  is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
  is_bidirectional BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (from_node_id <> to_node_id)
);

CREATE INDEX idx_edges_from ON edges(from_node_id);
CREATE INDEX idx_edges_to ON edges(to_node_id);

CREATE TYPE route_priority AS ENUM ('primary', 'secondary', 'accessible');

CREATE TABLE evacuation_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority route_priority NOT NULL DEFAULT 'primary',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evac_routes_floor ON evacuation_routes(floor_id);

CREATE TABLE evacuation_route_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES evacuation_routes(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  instruction TEXT,

  UNIQUE(route_id, step_order)
);

CREATE INDEX idx_route_steps_route ON evacuation_route_steps(route_id);

CREATE TABLE qr_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  qr_code TEXT UNIQUE NOT NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qr_node ON qr_checkpoints(node_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON floors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON evacuation_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE evacuation_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evacuation_route_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone authenticated can read buildings"
  ON buildings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage buildings"
  ON buildings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can read floors"
  ON floors FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage floors"
  ON floors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can read rooms"
  ON rooms FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage rooms"
  ON rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can read nodes"
  ON nodes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage nodes"
  ON nodes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can read edges"
  ON edges FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage edges"
  ON edges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can read evacuation routes"
  ON evacuation_routes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage evacuation routes"
  ON evacuation_routes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can read route steps"
  ON evacuation_route_steps FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage route steps"
  ON evacuation_route_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can read qr checkpoints"
  ON qr_checkpoints FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage qr checkpoints"
  ON qr_checkpoints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
