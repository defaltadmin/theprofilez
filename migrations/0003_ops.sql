CREATE INDEX IF NOT EXISTS idx_contact_status_created ON contact_messages(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_takedown_status_created ON takedown_requests(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type,entity_id,created_at DESC);
INSERT OR IGNORE INTO site_settings(key,value) VALUES
 ('default_language','en'),
 ('supported_languages','en,ar'),
 ('site_name','TheProfilez'),
 ('profile_photo_max_bytes','3145728');
