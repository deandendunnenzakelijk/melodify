import { useEffect, useState } from 'react';
import { Play, Pause, Loader2, Music2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayerControls, useNowPlaying } from '../contexts/PlayerContext';
import type { Database } from '../lib/database.types';

type ArtistRecord = Database['public']['Tables']['artists']['Row'];

type TrackRecord = Database['public']['Tables']['tracks']['Row'] & {
  artist?: { name: string };
};

interface ArtistPageProps {
  artistId: string | null;
  onOpenArtist?: (artistId: string) => void;
}

export default function Artist({ artistId, onOpenArtist }: ArtistPageProps) {
  const { playTrack, togglePlay } = usePlayerControls();
  const { currentTrack, isPlaying } = useNowPlaying();
  const [artist, setArtist] = useState<ArtistRecord | null>(null);
  const [tracks, setTracks] = useState<TrackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) {
      setArtist(null);
      setTracks([]);
      return;
    }

    const loadArtist = async () => {
      setLoading(true);
      setError(null);

      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .maybeSingle();

      if (artistError) {
        setError('Kon artiestgegevens niet laden.');
        setArtist(null);
        setTracks([]);
        setLoading(false);
        return;
      }

      setArtist(artistData);

      if (artistData) {
        const { data: trackData, error: trackError } = await supabase
          .from('tracks')
          .select(`*, artist:artists(name)`)
          .eq('artist_id', artistData.id)
          .order('created_at', { ascending: false });

        if (trackError) {
          setError('Kon tracks niet laden.');
          setTracks([]);
        } else {
          setTracks((trackData || []) as TrackRecord[]);
        }
      } else {
        setTracks([]);
      }

      setLoading(false);
    };

    loadArtist();
  }, [artistId]);

  const handleTrackClick = (track: TrackRecord) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    playTrack(track, tracks);
  };

  if (!artistId) {
    return (
      <div className="p-8 text-gray-400">
        Selecteer een artiest om het profiel te bekijken.
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

  if (!artist) {
    return (
      <div className="p-8 text-gray-400">
        Artiest niet gevonden.
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-6 mb-8">
        {artist.avatar_url ? (
          <img
            src={artist.avatar_url}
            alt={artist.name}
            className="w-32 h-32 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center shadow-lg">
            <Music2 className="w-12 h-12 text-gray-500" />
          </div>
        )}
        <div>
          <p className="text-sm uppercase text-gray-400 font-semibold">Artiest</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{artist.name}</h1>
          {artist.bio && (
            <p className="text-gray-300 max-w-2xl whitespace-pre-line">{artist.bio}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2 rounded-full transition-colors"
          onClick={() => {
            if (tracks.length > 0) {
              handleTrackClick(tracks[0]);
            }
          }}
        >
          {currentTrack && currentTrack.artist_id === artist.id && isPlaying ? 'Pauzeren' : 'Afspelen'}
        </button>
      </div>

      <h2 className="text-2xl font-bold text-white mb-4">Nummers</h2>
      {tracks.length === 0 ? (
        <div className="text-gray-400">Deze artiest heeft nog geen nummers.</div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            const showPause = isCurrent && isPlaying;
            return (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/40 dark:hover:bg-gray-900/40 transition-all cursor-pointer"
                onClick={() => handleTrackClick(track)}
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
                    handleTrackClick(track);
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
