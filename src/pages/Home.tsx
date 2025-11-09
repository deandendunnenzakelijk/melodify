import { useState, useEffect, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayerControls, useNowPlaying } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  album_id: string | null;
  duration: number;
  audio_url: string;
  cover_url: string;
  explicit: boolean;
  play_count: number;
  artist?: {
    name: string;
  };
}

interface HomeProps {
  onOpenArtist?: (artistId: string) => void;
}

export default function Home({ onOpenArtist }: HomeProps) {
  const { playTrack, togglePlay } = usePlayerControls();
  const { currentTrack, isPlaying } = useNowPlaying();
  const { profile } = useAuth();
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    const { data: trending } = await supabase
      .from('tracks')
      .select(`
        *,
        artist:artists(name)
      `)
      .order('play_count', { ascending: false })
      .limit(6);

    if (trending) {
      setTrendingTracks(trending as Track[]);
    }

    if (profile) {
      const { data: recent } = await supabase
        .from('listening_history')
        .select(`
          track:tracks(
            *,
            artist:artists(name)
          )
        `)
        .eq('user_id', profile.id)
        .order('played_at', { ascending: false })
        .limit(6);

      if (recent) {
        const uniqueTracks = Array.from(
          new Map(recent.map((item: any) => [item.track.id, item.track])).values()
        );
        setRecentTracks(uniqueTracks as Track[]);
      }
    }

    const { data: recommended } = await supabase
      .from('tracks')
      .select(`
        *,
        artist:artists(name)
      `)
      .limit(6);

    if (recommended) {
      setRecommendedTracks(recommended as Track[]);
    }

    setLoading(false);
  };

  const TrackGrid = useMemo(
    () =>
      ({ tracks, title }: { tracks: Track[]; title: string }) => (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {tracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const showPause = isCurrent && isPlaying;
              return (
                <div
                  key={track.id}
                  className="bg-gray-800/40 dark:bg-gray-900/40 p-4 rounded-lg hover:bg-gray-700/60 dark:hover:bg-gray-800/60 transition-all group cursor-pointer"
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playTrack(track, tracks);
                    }
                  }}
                >
                  <div className="relative mb-4">
                    <img
                      src={track.cover_url || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300'}
                      alt={track.title}
                      className="w-full aspect-square object-cover rounded-lg shadow-lg"
                    />
                    <button
                      className="absolute bottom-2 right-2 bg-green-500 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playTrack(track, tracks);
                        }
                      }}
                    >
                      {showPause ? (
                        <Pause className="w-5 h-5 text-black" />
                      ) : (
                        <Play className="w-5 h-5 text-black" />
                      )}
                    </button>
                  </div>
                  <h3 className="text-white font-semibold truncate">{track.title}</h3>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (track.artist_id) {
                        onOpenArtist?.(track.artist_id);
                      }
                    }}
                    className="text-gray-400 text-sm truncate hover:text-white transition-colors"
                  >
                    {track.artist?.name || 'Unknown Artist'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ),
    [currentTrack, isPlaying, onOpenArtist, playTrack, togglePlay]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white mb-8">
        Welkom terug{profile ? `, ${profile.display_name}` : ''}
      </h1>

      {recentTracks.length > 0 && (
        <TrackGrid tracks={recentTracks} title="Recent afgespeeld" />
      )}

      <TrackGrid tracks={trendingTracks} title="Trending nu" />

      <TrackGrid tracks={recommendedTracks} title="Aanbevolen voor jou" />
    </div>
  );
}
