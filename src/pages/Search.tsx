import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import type { TrackWithArtist } from '../types/tracks';

interface Artist {
  id: string;
  name: string;
  avatar_url: string;
  verified: boolean;
  monthly_listeners: number;
}

export default function Search() {
  const { playTrack } = usePlayer();
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<TrackWithArtist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  const searchContent = useCallback(async () => {
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

    if (tracksData) setTracks(tracksData as TrackWithArtist[]);
    if (artistsData) setArtists(artistsData);

    setLoading(false);
  }, [query]);

  useEffect(() => {
    if (query.length > 0) {
      searchContent();
    } else {
      setTracks([]);
      setArtists([]);
    }
  }, [query, searchContent]);

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
                  <div
                    key={artist.id}
                    className="bg-gray-800/40 dark:bg-gray-900/40 p-4 rounded-lg hover:bg-gray-700/60 dark:hover:bg-gray-800/60 transition-all cursor-pointer"
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {tracks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Nummers</h2>
              <div className="space-y-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/40 dark:hover:bg-gray-900/40 transition-all group cursor-pointer"
                    onClick={() => playTrack(track, tracks)}
                  >
                    <img
                      src={track.cover_url || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300'}
                      alt={track.title}
                      className="w-14 h-14 rounded shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{track.title}</h3>
                      <p className="text-gray-400 text-sm truncate">
                        {track.artist?.name || 'Unknown Artist'}
                      </p>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 bg-green-500 rounded-full p-2 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(track, tracks);
                      }}
                    >
                      <Play className="w-5 h-5 text-black fill-current" />
                    </button>
                  </div>
                ))}
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
