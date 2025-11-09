import { useEffect, useState } from 'react';
import { Music2, Play, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerControls } from '../contexts/PlayerContext';

interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  created_at: string;
  track_count?: number;
}

interface LibraryProps {
  openCreatePlaylist?: boolean;
  onCreatePlaylistHandled?: () => void;
  onOpenPlaylist?: (playlistId: string) => void;
}

export default function Library({
  openCreatePlaylist,
  onCreatePlaylistHandled,
  onOpenPlaylist,
}: LibraryProps) {
  const { profile, loading: authLoading } = useAuth();
  const { playTrack } = usePlayerControls();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      loadLibrary();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  useEffect(() => {
    if (openCreatePlaylist) {
      setShowCreateModal(true);
      onCreatePlaylistHandled?.();
    }
  }, [openCreatePlaylist, onCreatePlaylistHandled]);

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
    } else {
      setPlaylists([]);
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

  const createPlaylist = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    if (!newPlaylistName.trim()) {
      setCreateError('Geef je playlist een naam.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    const { data, error } = await supabase
      .from('playlists')
      .insert({
        user_id: profile.id,
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        cover_url: '',
        is_public: false,
      })
      .select()
      .maybeSingle();

    if (error) {
      setCreateError('Kon playlist niet aanmaken. Probeer het opnieuw.');
      setCreating(false);
      return;
    }

    if (data) {
      setPlaylists((prev) => [
        {
          ...data,
          track_count: 0,
        },
        ...prev,
      ] as Playlist[]);
    }

    setCreating(false);
    setShowCreateModal(false);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white">Je bibliotheek</h1>
        {profile && (
          <button
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-full transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Nieuwe playlist
          </button>
        )}
      </div>

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
              onClick={() => onOpenPlaylist?.(playlist.id)}
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

      {showCreateModal && profile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Nieuwe playlist</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createPlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Naam</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Bijvoorbeeld: Mijn favorieten"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Beschrijving</label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Voeg een beschrijving toe"
                />
              </div>
              {createError && <p className="text-red-400 text-sm">{createError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                  }}
                  className="px-4 py-2 rounded-full text-gray-300 hover:text-white"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors disabled:opacity-60"
                >
                  {creating ? 'Aanmaken...' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
