/*
  # Spotify Clone Database Schema

  ## Overview
  Complete database schema for a Spotify-like music streaming application with user authentication,
  music management, playlists, social features, and premium subscriptions.

  ## New Tables

  ### 1. profiles
  Extended user profile information linked to auth.users
  - `id` (uuid, primary key, references auth.users)
  - `username` (text, unique)
  - `display_name` (text)
  - `bio` (text)
  - `avatar_url` (text)
  - `is_premium` (boolean, default false)
  - `is_admin` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. artists
  Artist profiles and information
  - `id` (uuid, primary key)
  - `name` (text)
  - `bio` (text)
  - `avatar_url` (text)
  - `verified` (boolean)
  - `monthly_listeners` (integer)
  - `created_at` (timestamptz)

  ### 3. albums
  Album information
  - `id` (uuid, primary key)
  - `title` (text)
  - `artist_id` (uuid, references artists)
  - `cover_url` (text)
  - `release_date` (date)
  - `total_tracks` (integer)
  - `created_at` (timestamptz)

  ### 4. tracks
  Individual music tracks
  - `id` (uuid, primary key)
  - `title` (text)
  - `artist_id` (uuid, references artists)
  - `album_id` (uuid, references albums)
  - `duration` (integer, in seconds)
  - `audio_url` (text)
  - `cover_url` (text)
  - `play_count` (integer)
  - `explicit` (boolean)
  - `created_at` (timestamptz)

  ### 5. playlists
  User-created playlists
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text)
  - `description` (text)
  - `cover_url` (text)
  - `is_public` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. playlist_tracks
  Junction table for playlist-track relationships
  - `id` (uuid, primary key)
  - `playlist_id` (uuid, references playlists)
  - `track_id` (uuid, references tracks)
  - `position` (integer)
  - `added_at` (timestamptz)

  ### 7. liked_tracks
  User's liked/saved tracks
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `track_id` (uuid, references tracks)
  - `created_at` (timestamptz)

  ### 8. listening_history
  Track playback history
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `track_id` (uuid, references tracks)
  - `played_at` (timestamptz)

  ### 9. follows
  User following relationships
  - `id` (uuid, primary key)
  - `follower_id` (uuid, references profiles)
  - `following_id` (uuid, references profiles)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to manage their own data
  - Public read access for tracks, albums, artists
  - Admin-only write access for content management
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  is_premium boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  verified boolean DEFAULT false,
  monthly_listeners integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artists"
  ON artists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage artists"
  ON artists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  cover_url text DEFAULT '',
  release_date date DEFAULT CURRENT_DATE,
  total_tracks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view albums"
  ON albums FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage albums"
  ON albums FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  duration integer NOT NULL DEFAULT 0,
  audio_url text NOT NULL,
  cover_url text DEFAULT '',
  play_count integer DEFAULT 0,
  explicit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tracks"
  ON tracks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tracks"
  ON tracks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public playlists and own playlists"
  ON playlists FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create own playlists"
  ON playlists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create playlist_tracks junction table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tracks in accessible playlists"
  ON playlist_tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND (playlists.is_public = true OR playlists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add tracks to own playlists"
  ON playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tracks from own playlists"
  ON playlist_tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Create liked_tracks table
CREATE TABLE IF NOT EXISTS liked_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE liked_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own liked tracks"
  ON liked_tracks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can like tracks"
  ON liked_tracks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike tracks"
  ON liked_tracks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create listening_history table
CREATE TABLE IF NOT EXISTS listening_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  played_at timestamptz DEFAULT now()
);

ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON listening_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to own history"
  ON listening_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid() AND follower_id != following_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_liked_tracks_user ON liked_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON listening_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);