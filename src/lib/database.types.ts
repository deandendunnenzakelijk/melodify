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
          is_artist: boolean
          artist_id: string | null
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
          is_artist?: boolean
          artist_id?: string | null
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
          is_artist?: boolean
          artist_id?: string | null
          created_at?: string
          updated_at?: string
      }
      Relationships: []
    }
    artists: {
        Row: {
          id: string
          name: string
          bio: string
          avatar_url: string
          verified: boolean
          monthly_listeners: number
          profile_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          bio?: string
          avatar_url?: string
          verified?: boolean
          monthly_listeners?: number
          profile_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          bio?: string
          avatar_url?: string
          verified?: boolean
          monthly_listeners?: number
          profile_id?: string | null
          created_at?: string
      }
      Relationships: []
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
      Relationships: []
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
      Relationships: []
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
      Relationships: []
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
      Relationships: []
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
      Relationships: []
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
      Relationships: []
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
      Relationships: []
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database['public']

export type Tables<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName] extends { Row: infer Row }
    ? Row
    : never

export type TablesInsert<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName] extends { Insert: infer Insert }
    ? Insert
    : never

export type TablesUpdate<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName] extends { Update: infer Update }
    ? Update
    : never
