import { useState, useEffect } from 'react';
import { Music2, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';

interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  created_at: string;
  track_count?: number;
}

export default function Library() {
  const { profile } = useAuth();
  const { playTrack } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadLibrary();
    }
  }, [profile]);

  const loadLibrary = async () => {
    if (!profile) return;

    const { data: playlistsData } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_tracks(count)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (playlistsData) {
      const playlistsWithCount = playlistsData.map((p: any) => ({
        ...p,
        track_count: p.playlist_tracks[0]?.count || 0,
      }));
      setPlaylists(playlistsWithCount);
    }

    setLoading(false);
  };

  const playPlaylist = async (playlistId: string) => {
    const { data: playlistTracks } = await supabase
      .from('playlist_tracks')
      .select(`
        track:tracks(
          *,
          artist:artists(name)
        )
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (playlistTracks && playlistTracks.length > 0) {
      const tracks = playlistTracks.map((pt: any) => pt.track);
      playTrack(tracks[0], tracks);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Je bibliotheek</h1>

      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <Music2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Je hebt nog geen playlists</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-800/40 dark:bg-gray-900/40 p-4 rounded-lg hover:bg-gray-700/60 dark:hover:bg-gray-800/60 transition-all group cursor-pointer"
            >
              <div className="relative mb-4">
                {playlist.cover_url ? (
                  <img
                    src={playlist.cover_url}
                    alt={playlist.name}
                    className="w-full aspect-square object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg shadow-lg flex items-center justify-center">
                    <Music2 className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                {playlist.track_count! > 0 && (
                  <button
                    className="absolute bottom-2 right-2 bg-green-500 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPlaylist(playlist.id);
                    }}
                  >
                    <Play className="w-5 h-5 text-black fill-current" />
                  </button>
                )}
              </div>
              <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
              <p className="text-gray-400 text-sm">
                {playlist.track_count} {playlist.track_count === 1 ? 'nummer' : 'nummers'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
