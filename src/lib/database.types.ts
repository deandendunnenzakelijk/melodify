export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          bio: string
          avatar_url: string
          is_premium: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          bio?: string
          avatar_url?: string
          is_premium?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          bio?: string
          avatar_url?: string
          is_premium?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      artists: {
        Row: {
          id: string
          name: string
          bio: string
          avatar_url: string
          verified: boolean
          monthly_listeners: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          bio?: string
          avatar_url?: string
          verified?: boolean
          monthly_listeners?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          bio?: string
          avatar_url?: string
          verified?: boolean
          monthly_listeners?: number
          created_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          title: string
          artist_id: string
          cover_url: string
          release_date: string
          total_tracks: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          artist_id: string
          cover_url?: string
          release_date?: string
          total_tracks?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist_id?: string
          cover_url?: string
          release_date?: string
          total_tracks?: number
          created_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          title: string
          artist_id: string
          album_id: string | null
          duration: number
          audio_url: string
          cover_url: string
          play_count: number
          explicit: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          artist_id: string
          album_id?: string | null
          duration?: number
          audio_url: string
          cover_url?: string
          play_count?: number
          explicit?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist_id?: string
          album_id?: string | null
          duration?: number
          audio_url?: string
          cover_url?: string
          play_count?: number
          explicit?: boolean
          created_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          cover_url: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          cover_url?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          cover_url?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      playlist_tracks: {
        Row: {
          id: string
          playlist_id: string
          track_id: string
          position: number
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          track_id: string
          position?: number
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          track_id?: string
          position?: number
          added_at?: string
        }
      }
      liked_tracks: {
        Row: {
          id: string
          user_id: string
          track_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          track_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          track_id?: string
          created_at?: string
        }
      }
      listening_history: {
        Row: {
          id: string
          user_id: string
          track_id: string
          played_at: string
        }
        Insert: {
          id?: string
          user_id: string
          track_id: string
          played_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          track_id?: string
          played_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
    }
  }
}
