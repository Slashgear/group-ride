-- Discord snowflake IDs exceed Number.MAX_SAFE_INTEGER, so INTEGER columns lose precision
-- when read by the JavaScript runtime. Rebuild both tables with TEXT for all Discord IDs.
PRAGMA foreign_keys = OFF;

CREATE TABLE rides_new (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  proposer_id TEXT NOT NULL,
  proposer_name TEXT NOT NULL DEFAULT '',
  name TEXT,
  date TEXT NOT NULL,
  meeting_time TEXT,
  meeting_point TEXT NOT NULL,
  distance_km REAL,
  elevation_gain INTEGER,
  elevation_loss INTEGER,
  level TEXT,
  gpx_url TEXT,
  external_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  pinned_message_id TEXT,
  reminder_day_sent INTEGER NOT NULL DEFAULT 0,
  reminder_hour_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  max_participants INTEGER
);

INSERT INTO rides_new
  SELECT id, thread_id, CAST(proposer_id AS TEXT), proposer_name, name, date, meeting_time,
         meeting_point, distance_km, elevation_gain, elevation_loss, level, gpx_url, external_url,
         notes, status, CAST(pinned_message_id AS TEXT), reminder_day_sent, reminder_hour_sent,
         created_at, max_participants
  FROM rides;

CREATE TABLE ride_members_new (
  ride_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  waitlisted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ride_id, user_id),
  FOREIGN KEY (ride_id) REFERENCES rides(id)
);

INSERT INTO ride_members_new
  SELECT ride_id, CAST(user_id AS TEXT), joined_at, waitlisted
  FROM ride_members;

DROP TABLE ride_members;
DROP TABLE rides;

ALTER TABLE rides_new RENAME TO rides;
ALTER TABLE ride_members_new RENAME TO ride_members;

PRAGMA foreign_keys = ON;