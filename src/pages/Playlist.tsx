import { useEffect, useState, useMemo } from 'react';
import { Play, Pause, Loader2, Music2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayerControls, useNowPlaying } from '../contexts/PlayerContext';
import type { Database } from '../lib/database.types';

interface PlaylistPageProps {
  playlistId: string | null;
  onOpenArtist?: (artistId: string) => void;
}

type PlaylistRecord = Database['public']['Tables']['playlists']['Row'];

type PlaylistTrack = {
  position: number;
  track: Database['public']['Tables']['tracks']['Row'] & {
    artist?: { name: string };
  };
};

interface LoadedPlaylist {
  playlist: PlaylistRecord;
  tracks: PlaylistTrack[];
  owner?: {
    display_name: string;
    avatar_url: string;
  };
}

export default function Playlist({ playlistId, onOpenArtist }: PlaylistPageProps) {
  const { playTrack, togglePlay } = usePlayerControls();
  const { currentTrack, isPlaying } = useNowPlaying();
  const [data, setData] = useState<LoadedPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) {
      setData(null);
      return;
    }

    const loadPlaylist = async () => {
      setLoading(true);
      setError(null);

      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select(`*, owner:profiles(display_name, avatar_url), playlist_tracks(position, track:tracks(*, artist:artists(name)))`)
        .eq('id', playlistId)
        .maybeSingle();

      if (playlistError) {
        setError('Kon playlist niet laden.');
        setData(null);
        setLoading(false);
        return;
      }

      if (!playlistData) {
        setData(null);
        setLoading(false);
        return;
      }

      const tracks: PlaylistTrack[] = (playlistData.playlist_tracks || [])
        .filter((item: any) => item.track)
        .map((item: any) => ({
          position: item.position,
          track: item.track,
        }))
        .sort((a, b) => a.position - b.position);

      setData({
        playlist: playlistData as PlaylistRecord,
        tracks,
        owner: playlistData.owner,
      });
      setLoading(false);
    };

    loadPlaylist();
  }, [playlistId]);

  const handlePlay = (trackId?: string) => {
    if (!data || data.tracks.length === 0) return;

    if (trackId) {
      const track = data.tracks.find((t) => t.track.id === trackId)?.track;
      if (track) {
        if (currentTrack?.id === track.id) {
          togglePlay();
        } else {
          playTrack(track, data.tracks.map((t) => t.track));
        }
      }
    } else {
      const [first] = data.tracks;
      if (!first) return;
      if (currentTrack?.id === first.track.id) {
        togglePlay();
      } else {
        playTrack(first.track, data.tracks.map((t) => t.track));
      }
    }
  };

  const totalTracks = data?.tracks.length ?? 0;
  const totalDuration = useMemo(() => {
    if (!data) return 0;
    return data.tracks.reduce((sum, item) => sum + (item.track.duration || 0), 0);
  }, [data]);

  if (!playlistId) {
    return (
      <div className="p-8 text-gray-400">
        Selecteer een playlist om de details te bekijken.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-400">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-gray-400">
        Playlist niet gevonden.
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
        {data.playlist.cover_url ? (
          <img
            src={data.playlist.cover_url}
            alt={data.playlist.name}
            className="w-44 h-44 object-cover rounded shadow-lg"
          />
        ) : (
          <div className="w-44 h-44 bg-gradient-to-br from-gray-700 to-gray-900 rounded shadow-lg flex items-center justify-center">
            <Music2 className="w-12 h-12 text-gray-500" />
          </div>
        )}
        <div className="flex-1">
          <p className="uppercase text-sm text-gray-400 font-semibold">Playlist</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">{data.playlist.name}</h1>
          {data.playlist.description && (
            <p className="text-gray-300 mb-3 whitespace-pre-line">{data.playlist.description}</p>
          )}
          <div className="text-sm text-gray-300 flex items-center gap-2">
            {data.owner?.avatar_url && (
              <img src={data.owner.avatar_url} alt={data.owner.display_name} className="w-6 h-6 rounded-full" />
            )}
            {data.owner?.display_name && <span className="font-semibold">{data.owner.display_name}</span>}
            <span>•</span>
            <span>{totalTracks} nummers</span>
            <span>•</span>
            <span>{Math.round(totalDuration / 60)} min</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2 rounded-full transition-colors"
          onClick={() => handlePlay()}
        >
          {currentTrack && data.tracks.some((item) => item.track.id === currentTrack.id) && isPlaying
            ? 'Pauzeren'
            : 'Afspelen'}
        </button>
      </div>

      {data.tracks.length === 0 ? (
        <div className="text-gray-400">Deze playlist bevat nog geen nummers.</div>
      ) : (
        <div className="space-y-2">
          {data.tracks.map((item, index) => {
            const track = item.track;
            const isCurrent = currentTrack?.id === track.id;
            const showPause = isCurrent && isPlaying;
            return (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/40 dark:hover:bg-gray-900/40 transition-all cursor-pointer"
                onClick={() => handlePlay(track.id)}
              >
                <span className="w-6 text-gray-400">{index + 1}</span>
                <img
                  src={track.cover_url || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300'}
                  alt={track.title}
                  className="w-14 h-14 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{track.title}</h3>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (track.artist_id) {
                        onOpenArtist?.(track.artist_id);
                      }
                    }}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {track.artist?.name || 'Unknown Artist'}
                  </button>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 bg-green-500 rounded-full p-2 transition-all"
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePlay(track.id);
                  }}
                >
                  {showPause ? (
                    <Pause className="w-5 h-5 text-black" />
                  ) : (
                    <Play className="w-5 h-5 text-black" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
