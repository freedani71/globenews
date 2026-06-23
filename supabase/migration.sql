-- Führe dieses Script im Supabase SQL-Editor aus (https://supabase.com/dashboard -> SQL Editor)

-- 1. Ban-Spalten zu profiles hinzufügen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned  BOOLEAN     DEFAULT FALSE;
-- ban_count: Anzahl bisheriger Verstösse (0 = noch keiner)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_count  INTEGER     DEFAULT 0;
-- ban_until: Ablaufzeitpunkt einer temporären Sperre (NULL = keine aktive Sperre)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_until  TIMESTAMPTZ DEFAULT NULL;

-- 2. Kommentare-Tabelle erstellen
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security aktivieren
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. Jeder kann Kommentare lesen
CREATE POLICY "Kommentare lesen" ON comments
  FOR SELECT USING (true);

-- 5. Eingeloggte Nutzer können eigene Kommentare schreiben
CREATE POLICY "Eigene Kommentare schreiben" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Nutzer können eigene Kommentare löschen (Admins via Service Role)
CREATE POLICY "Eigene Kommentare löschen" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Realtime für Kommentare aktivieren (Echtzeit-Updates)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 8. Per-User-Likes Tabelle
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes lesen"          ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Eigene Likes setzen"  ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigene Likes loeschen" ON comment_likes FOR DELETE USING (auth.uid() = user_id);
