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
