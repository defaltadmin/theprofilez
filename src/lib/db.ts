export function audit(db: D1Database,actor: string,action: string,entity: string,id: string | number,detail: unknown = {}): D1PreparedStatement {
 return db.prepare('INSERT INTO audit_log(actor,action,entity,entity_id,detail) VALUES(?,?,?,?,?)').bind(actor,action,entity,String(id),JSON.stringify(detail));
}
export async function profileById(db: D1Database,id: string | number): Promise<Record<string,unknown> | null> {
 return db.prepare('SELECT * FROM profiles WHERE id = ? AND deleted_at IS NULL').bind(id).first();
}

export async function profileBySlug(db: D1Database, slug: string): Promise<Record<string,unknown> | null> {
 return db.prepare('SELECT * FROM profiles WHERE slug = ? AND deleted_at IS NULL AND status = ?').bind(slug, 'published').first();
}

export async function publishedProfiles(db: D1Database): Promise<Record<string,unknown>[]> {
 const {results} = await db.prepare('SELECT * FROM profiles WHERE status = ? AND deleted_at IS NULL ORDER BY updated_at DESC').bind('published').all();
 return results as Record<string,unknown>[];
}

export async function featuredProfile(db: D1Database): Promise<Record<string,unknown> | null> {
 return db.prepare('SELECT * FROM profiles WHERE status = ? AND deleted_at IS NULL AND featured = 1 ORDER BY updated_at DESC LIMIT 1').bind('published').first();
}

export async function sectors(db: D1Database): Promise<Record<string,unknown>[]> {
 const {results} = await db.prepare('SELECT * FROM sectors ORDER BY sort_order').all();
 return results as Record<string,unknown>[];
}

export async function cities(db: D1Database): Promise<Record<string,unknown>[]> {
 const {results} = await db.prepare('SELECT * FROM cities ORDER BY name_en').all();
 return results as Record<string,unknown>[];
}