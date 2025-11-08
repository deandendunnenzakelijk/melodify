-- Allow artists to manage their own tracks
CREATE POLICY "Artists can insert own tracks"
  ON tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    artist_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.artist_id = artist_id
    )
  );

CREATE POLICY "Artists can update own tracks"
  ON tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.artist_id = artist_id
    )
  )
  WITH CHECK (
    artist_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.artist_id = artist_id
    )
  );

CREATE POLICY "Artists can delete own tracks"
  ON tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.artist_id = artist_id
    )
  );
