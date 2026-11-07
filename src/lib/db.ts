export function audit(db: D1Database,actor: string,action: string,entity: string,id: string | number,detail: unknown = {}): D1PreparedStatement {
 return db.prepare('INSERT INTO audit_log(actor,action,entity,entity_id,detail) VALUES(?,?,?,?,?)').bind(actor,action,entity,String(id),JSON.stringify(detail));
}
export async function profileById(db: D1Database,id: string | number): Promise<Record<string,unknown> | null> {
 return db.prepare('SELECT * FROM profiles WHERE id = ? AND deleted_at IS NULL').bind(id).first();
}