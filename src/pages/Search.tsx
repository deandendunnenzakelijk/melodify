import { useState, useEffect } from 'react';
import { Search as SearchIcon, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayerControls, useNowPlaying } from '../contexts/PlayerContext';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  duration: number;
  audio_url: string;
  cover_url: string;
  explicit: boolean;
  artist?: {
    name: string;
  };
}

interface Artist {
  id: string;
  name: string;
  avatar_url: string;
  verified: boolean;
  monthly_listeners: number;
}

interface SearchProps {
  onOpenArtist?: (artistId: string) => void;
}

export default function Search({ onOpenArtist }: SearchProps) {
  const { playTrack, togglePlay } = usePlayerControls();
  const { currentTrack, isPlaying } = useNowPlaying();
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length > 0) {
      searchContent();
    } else {
      setTracks([]);
      setArtists([]);
    }
  }, [query]);

  const searchContent = async () => {
    setLoading(true);

    const { data: tracksData } = await supabase
      .from('tracks')
      .select(`
        *,
        artist:artists(name)
      `)
      .ilike('title', `%${query}%`)
      .limit(10);

    const { data: artistsData } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(5);

    if (tracksData) setTracks(tracksData as Track[]);
    if (artistsData) setArtists(artistsData);

    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wat wil je luisteren?"
            className="w-full bg-white dark:bg-gray-900 text-black dark:text-white pl-14 pr-6 py-4 rounded-full text-lg outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {loading && <div className="text-white">Zoeken...</div>}

      {!loading && query && (
        <>
          {artists.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Artiesten</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => onOpenArtist?.(artist.id)}
                    className="bg-gray-800/40 dark:bg-gray-900/40 p-4 rounded-lg hover:bg-gray-700/60 dark:hover:bg-gray-800/60 transition-all cursor-pointer text-left"
                  >
                    <img
                      src={artist.avatar_url || 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&cs=tinysrgb&w=300'}
                      alt={artist.name}
                      className="w-full aspect-square object-cover rounded-full shadow-lg mb-4"
                    />
                    <h3 className="text-white font-semibold truncate text-center">
                      {artist.name}
                    </h3>
                    <p className="text-gray-400 text-sm text-center">Artiest</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tracks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Nummers</h2>
              <div className="space-y-2">
                {tracks.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const showPause = isCurrent && isPlaying;
                  return (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/40 dark:hover:bg-gray-900/40 transition-all group cursor-pointer"
                    onClick={() => {
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        playTrack(track, tracks);
                      }
                    }}
                  >
                    <img
                      src={track.cover_url || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300'}
                      alt={track.title}
                      className="w-14 h-14 rounded shadow-lg"
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
                        className="text-gray-400 text-sm truncate hover:text-white transition-colors"
                      >
                        {track.artist?.name || 'Unknown Artist'}
                      </button>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 bg-green-500 rounded-full p-2 transition-all"
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
                        <Play className="w-5 h-5 text-black fill-current" />
                      )}
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && query && tracks.length === 0 && artists.length === 0 && (
            <div className="text-center text-gray-400 mt-12">
              Geen resultaten gevonden voor "{query}"
            </div>
          )}
        </>
      )}
    </div>
  );
}
