import { useState, useEffect, useCallback } from 'react';
import { Heart, Play, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { formatTime } from '../lib/utils';
import type { TrackWithArtist } from '../types/tracks';

export default function LikedSongs() {
  const { profile } = useAuth();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [likedTracks, setLikedTracks] = useState<TrackWithArtist[]>([]);
  const [loading, setLoading] = useState(true);

  interface LikedTrackRow {
    track: TrackWithArtist;
  }

  const loadLikedSongs = useCallback(async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('liked_tracks')
      .select(`
        track:tracks(
          *,
          artist:artists(name)
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      const tracks = data.map((item: LikedTrackRow) => item.track);
      setLikedTracks(tracks);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (profile) {
      loadLikedSongs();
    }
  }, [profile, loadLikedSongs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Laden...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="bg-gradient-to-b from-purple-900 to-gray-900 dark:from-purple-950 dark:to-black p-8 pb-6">
        <div className="flex items-end gap-6">
          <div className="w-56 h-56 bg-gradient-to-br from-purple-400 to-blue-600 rounded shadow-2xl flex items-center justify-center">
            <Heart className="w-24 h-24 text-white fill-current" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-2">PLAYLIST</p>
            <h1 className="text-7xl font-bold text-white mb-6">Liked Songs</h1>
            <div className="flex items-center gap-2 text-white">
              <span className="font-semibold">{profile?.display_name}</span>
              <span>•</span>
              <span>{likedTracks.length} nummers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/20 dark:bg-black/40 p-8">
        {likedTracks.length > 0 && (
          <button
            onClick={() => playTrack(likedTracks[0], likedTracks)}
            className="bg-green-500 hover:bg-green-400 text-black rounded-full p-4 mb-6 transition-all hover:scale-105 shadow-lg"
          >
            <Play className="w-7 h-7 fill-current" />
          </button>
        )}

        {likedTracks.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Je hebt nog geen nummers geliked</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[auto_2fr_1fr_auto] gap-4 px-4 py-2 text-gray-400 text-sm border-b border-gray-800 mb-2">
              <div>#</div>
              <div>TITEL</div>
              <div>ARTIEST</div>
              <div><Clock className="w-4 h-4" /></div>
            </div>

            <div className="space-y-1">
              {likedTracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`grid grid-cols-[auto_2fr_1fr_auto] gap-4 px-4 py-3 rounded hover:bg-white/10 dark:hover:bg-white/5 group cursor-pointer ${
                    currentTrack?.id === track.id ? 'bg-white/10 dark:bg-white/5' : ''
                  }`}
                  onClick={() => playTrack(track, likedTracks)}
                >
                  <div className="flex items-center justify-center text-gray-400">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className="text-green-500"
                      >
                        <span className="text-sm">▶</span>
                      </button>
                    ) : (
                      <span className="group-hover:hidden">{index + 1}</span>
                    )}
                    <button
                      className="hidden group-hover:block"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(track, likedTracks);
                      }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={track.cover_url || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300'}
                      alt={track.title}
                      className="w-10 h-10 rounded"
                    />
                    <div className="min-w-0">
                      <div className={`font-semibold truncate ${
                        currentTrack?.id === track.id ? 'text-green-500' : 'text-white'
                      }`}>
                        {track.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-400 truncate">
                    {track.artist?.name || 'Unknown Artist'}
                  </div>

                  <div className="flex items-center text-gray-400">
                    {formatTime(track.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
