
PRAGMA foreign_keys = ON;
CREATE TABLE sectors(id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name_en TEXT NOT NULL, name_ar TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE cities(id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name_en TEXT NOT NULL, name_ar TEXT NOT NULL);
CREATE TABLE tags(id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name_en TEXT NOT NULL, name_ar TEXT NOT NULL);
CREATE TABLE profiles(
 id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 published_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 name_en TEXT NOT NULL DEFAULT '', name_ar TEXT NOT NULL DEFAULT '', title_en TEXT NOT NULL DEFAULT '', title_ar TEXT NOT NULL DEFAULT '',
 org_en TEXT NOT NULL DEFAULT '', org_ar TEXT NOT NULL DEFAULT '', summary_en TEXT NOT NULL DEFAULT '', summary_ar TEXT NOT NULL DEFAULT '',
 body_en TEXT NOT NULL DEFAULT '', body_ar TEXT NOT NULL DEFAULT '', pull_quote_en TEXT NOT NULL DEFAULT '', pull_quote_ar TEXT NOT NULL DEFAULT '',
 sector_id INTEGER REFERENCES sectors(id), city TEXT REFERENCES cities(slug), photo_key TEXT, photo_alt TEXT NOT NULL DEFAULT '',
 linkedin_url TEXT NOT NULL DEFAULT '', x_url TEXT NOT NULL DEFAULT '', instagram_url TEXT NOT NULL DEFAULT '', facebook_url TEXT NOT NULL DEFAULT '',
 website_url TEXT NOT NULL DEFAULT '', org_linkedin_url TEXT NOT NULL DEFAULT '',
 featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN (0,1)), consent_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(consent_confirmed IN (0,1)),
 consent_note TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT
);
CREATE TABLE profile_tags(profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE, tag_id INTEGER REFERENCES tags(id), PRIMARY KEY(profile_id,tag_id));
CREATE INDEX profiles_status_published ON profiles(status,published_at);
CREATE INDEX profiles_sector ON profiles(sector_id);
CREATE INDEX profiles_featured ON profiles(featured);