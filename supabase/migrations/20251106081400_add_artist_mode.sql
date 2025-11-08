-- Enable artist mode support for user profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_artist boolean DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS artist_id uuid;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_artist_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_artist_id_fkey
  FOREIGN KEY (artist_id)
  REFERENCES artists(id)
  ON DELETE SET NULL;

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS profile_id uuid;

ALTER TABLE artists
  DROP CONSTRAINT IF EXISTS artists_profile_id_fkey;

ALTER TABLE artists
  ADD CONSTRAINT artists_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_profile_id
  ON artists(profile_id)
  WHERE profile_id IS NOT NULL;

CREATE POLICY "Artists can manage their own artist entry"
  ON artists FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
