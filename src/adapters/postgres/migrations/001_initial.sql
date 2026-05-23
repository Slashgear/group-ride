CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  proposer_id BIGINT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  meeting_point TEXT NOT NULL,
  distance_km REAL,
  elevation_gain INTEGER,
  elevation_loss INTEGER,
  level TEXT,
  gpx_url TEXT,
  external_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ride_members (
  ride_id TEXT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (ride_id, user_id),
  FOREIGN KEY (ride_id) REFERENCES rides(id)
);
