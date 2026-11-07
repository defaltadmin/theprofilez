
CREATE VIRTUAL TABLE profiles_fts USING fts5(name_en,name_ar,title_en,title_ar,org_en,org_ar,summary_en,summary_ar,content='profiles',content_rowid='id',tokenize='unicode61 remove_diacritics 2');
CREATE TRIGGER profiles_ai AFTER INSERT ON profiles BEGIN
 INSERT INTO profiles_fts(rowid,name_en,name_ar,title_en,title_ar,org_en,org_ar,summary_en,summary_ar) VALUES(new.id,new.name_en,new.name_ar,new.title_en,new.title_ar,new.org_en,new.org_ar,new.summary_en,new.summary_ar);
END;
CREATE TRIGGER profiles_ad AFTER DELETE ON profiles BEGIN
 INSERT INTO profiles_fts(profiles_fts,rowid,name_en,name_ar,title_en,title_ar,org_en,org_ar,summary_en,summary_ar) VALUES('delete',old.id,old.name_en,old.name_ar,old.title_en,old.title_ar,old.org_en,old.org_ar,old.summary_en,old.summary_ar);
END;
CREATE TRIGGER profiles_au AFTER UPDATE ON profiles BEGIN
 INSERT INTO profiles_fts(profiles_fts,rowid,name_en,name_ar,title_en,title_ar,org_en,org_ar,summary_en,summary_ar) VALUES('delete',old.id,old.name_en,old.name_ar,old.title_en,old.title_ar,old.org_en,old.org_ar,old.summary_en,old.summary_ar);
 INSERT INTO profiles_fts(rowid,name_en,name_ar,title_en,title_ar,org_en,org_ar,summary_en,summary_ar) VALUES(new.id,new.name_en,new.name_ar,new.title_en,new.title_ar,new.org_en,new.org_ar,new.summary_en,new.summary_ar);
END;
INSERT INTO profiles_fts(profiles_fts) VALUES('rebuild');