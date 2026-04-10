import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || "./data/swoopleague.db";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.resolve(DB_PATH);
    const dir = path.dirname(dbPath);
    const fs = require("fs");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('meet', 'league', 'freestyle', 'team', 'course')),
      instructor TEXT,
      course_name TEXT,
      course_color TEXT CHECK (course_color IN ('silver', 'yellow', 'orange', 'green', 'grey', 'blue', 'red', 'black', 'pink')),
      start_date TEXT,
      end_date TEXT,
      location_name TEXT,
      location_city TEXT,
      coach TEXT,
      description TEXT,
      banner_image_url TEXT,
      facebook_event_url TEXT,
      flat_price_cents INTEGER,
      member_price_cents INTEGER,
      non_member_price_cents INTEGER,
      late_price_cents INTEGER,
      late_registration_date TEXT,
      capacity INTEGER,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pricing_tier (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
      membership_tier TEXT NOT NULL CHECK (membership_tier IN ('non-member', 'member', 'sport')),
      comp_class TEXT CHECK (comp_class IN ('sport', 'intermediate', 'advanced', 'pro')),
      price_cents INTEGER NOT NULL,
      UNIQUE(event_id, membership_tier, comp_class)
    );

    CREATE TABLE IF NOT EXISTS competitor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS registration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES event(id),
      competitor_id INTEGER NOT NULL REFERENCES competitor(id),
      membership_tier TEXT NOT NULL CHECK (membership_tier IN ('non-member', 'member', 'sport')),
      comp_class TEXT CHECK (comp_class IN ('sport', 'intermediate', 'advanced', 'pro')),
      wing_type TEXT,
      wing_size TEXT,
      wing_loading TEXT,
      degree_of_turn TEXT,
      country TEXT,
      price_cents INTEGER NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(event_id, competitor_id)
    );

    CREATE TABLE IF NOT EXISTS payment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL REFERENCES registration(id),
      provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
      provider_payment_id TEXT,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS league_membership (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER NOT NULL REFERENCES competitor(id),
      season INTEGER NOT NULL,
      registration_id INTEGER NOT NULL REFERENCES registration(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(competitor_id, season)
    );

    CREATE TABLE IF NOT EXISTS team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      competitor1_id INTEGER NOT NULL REFERENCES competitor(id),
      competitor2_id INTEGER NOT NULL REFERENCES competitor(id),
      season INTEGER NOT NULL,
      registration_id INTEGER NOT NULL REFERENCES registration(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_registration_event ON registration(event_id);
    CREATE INDEX IF NOT EXISTS idx_registration_competitor ON registration(competitor_id);
    CREATE INDEX IF NOT EXISTS idx_payment_registration ON payment(registration_id);
    CREATE INDEX IF NOT EXISTS idx_pricing_tier_event ON pricing_tier(event_id);
    CREATE INDEX IF NOT EXISTS idx_league_membership_competitor ON league_membership(competitor_id);

    CREATE TABLE IF NOT EXISTS waiver (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER REFERENCES competitor(id),
      registration_id INTEGER REFERENCES registration(id),
      event_id INTEGER REFERENCES event(id),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      phone TEXT,
      total_jumps INTEGER,
      jumps_last_12_months INTEGER,
      canopy_type_and_size TEXT,
      jumps_on_canopy INTEGER,
      initials TEXT NOT NULL,
      signature_data TEXT NOT NULL,
      guardian_name TEXT,
      guardian_signature_data TEXT,
      is_minor INTEGER NOT NULL DEFAULT 0,
      marketing_consent INTEGER NOT NULL DEFAULT 0,
      signed_at TEXT NOT NULL DEFAULT (datetime('now')),
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_waiver_email ON waiver(email);
    CREATE INDEX IF NOT EXISTS idx_waiver_event ON waiver(event_id);
    CREATE INDEX IF NOT EXISTS idx_waiver_registration ON waiver(registration_id);
  `);

  // Add columns to registration if they don't exist
  const regColumns = db.prepare("PRAGMA table_info(registration)").all() as { name: string }[];
  if (!regColumns.some((col) => col.name === "waiver_signed")) {
    db.exec("ALTER TABLE registration ADD COLUMN waiver_signed INTEGER DEFAULT 0");
  }
  if (!regColumns.some((col) => col.name === "team_name")) {
    db.exec("ALTER TABLE registration ADD COLUMN team_name TEXT");
  }

  // Group registration table
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_registration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payer_name TEXT NOT NULL,
      payer_email TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
      stripe_payment_intent_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add group_registration_id column to registration if it doesn't exist
  if (!regColumns.some((col) => col.name === "group_registration_id")) {
    db.exec("ALTER TABLE registration ADD COLUMN group_registration_id INTEGER REFERENCES group_registration(id)");
  }
}
