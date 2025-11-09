import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { TablesInsert, TablesUpdate } from '../lib/database.types';
import type { TrackWithArtist } from '../types/tracks';

interface PlayerContextType {
  currentTrack: TrackWithArtist | null;
  isPlaying: boolean;
  queue: TrackWithArtist[];
  currentTime: number;
  duration: number;
  volume: number;
  repeat: 'off' | 'all' | 'one';
  shuffle: boolean;
  playTrack: (track: TrackWithArtist, playlist?: TrackWithArtist[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: TrackWithArtist) => void;
  isLiked: boolean;
  toggleLike: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<TrackWithArtist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<TrackWithArtist[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [shuffle, setShuffle] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addToHistory = useCallback(async (track: TrackWithArtist) => {
    if (!user) return;

    const historyEntry: TablesInsert<'listening_history'> = {
      user_id: user.id,
      track_id: track.id,
    };

    await supabase
      .from('listening_history')
      .insert(historyEntry as never);

    const playCountUpdate: TablesUpdate<'tracks'> = {
      play_count: (track.play_count ?? 0) + 1,
    };

    await supabase
      .from('tracks')
      .update(playCountUpdate as never)
      .eq('id', track.id);
  }, [user]);

  const playTrack = useCallback((track: TrackWithArtist, playlist?: TrackWithArtist[]) => {
    const audio = audioRef.current ?? new Audio();
    if (!audioRef.current) {
      audioRef.current = audio;
      audio.volume = volume;
    }

    const resolvedQueue = playlist && playlist.length > 0 ? playlist : [track];
    const queueIndex = playlist ? playlist.findIndex((t) => t.id === track.id) : 0;

    setQueue(resolvedQueue);
    setHistoryIndex(queueIndex >= 0 ? queueIndex : 0);
    setCurrentTrack(track);
    setDuration(track.duration ?? 0);
    setCurrentTime(0);

    audio.src = track.audio_url;
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
      });

    void addToHistory(track);
  }, [addToHistory, volume]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setIsPlaying((prev) => {
      if (prev) {
        audio.pause();
        return false;
      }
      audio.play().catch(() => {
        setIsPlaying(false);
      });
      return true;
    });
  }, [currentTrack]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    let nextIndex = historyIndex + 1;

    if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    setHistoryIndex(nextIndex);
    playTrack(queue[nextIndex], queue);
  }, [historyIndex, playTrack, queue, repeat]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIndex = historyIndex - 1;

    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    setHistoryIndex(prevIndex);
    playTrack(queue[prevIndex], queue);
  }, [currentTime, historyIndex, playTrack, queue, repeat, seek]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prevShuffle => {
      const nextShuffle = !prevShuffle;
      if (nextShuffle) {
        setQueue(prevQueue => {
          if (prevQueue.length === 0) {
            return prevQueue;
          }
          const shuffled = [...prevQueue].sort(() => Math.random() - 0.5);
          if (currentTrack) {
            const currentIndex = shuffled.findIndex(t => t.id === currentTrack.id);
            if (currentIndex > 0) {
              [shuffled[0], shuffled[currentIndex]] = [shuffled[currentIndex], shuffled[0]];
            }
          }
          setHistoryIndex(0);
          return shuffled;
        });
      }
      return nextShuffle;
    });
  }, [currentTrack]);

  const addToQueue = useCallback((track: TrackWithArtist) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const toggleLike = useCallback(async () => {
    if (!user || !currentTrack) return;

    if (isLiked) {
      await supabase
        .from('liked_tracks')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', currentTrack.id);
      setIsLiked(false);
    } else {
      const likeInsert: TablesInsert<'liked_tracks'> = {
        user_id: user.id,
        track_id: currentTrack.id,
      };
      await supabase
        .from('liked_tracks')
        .insert(likeInsert as never);
      setIsLiked(true);
    }
  }, [currentTrack, isLiked, user]);

  useEffect(() => {
    const audio = audioRef.current ?? new Audio();
    if (!audioRef.current) {
      audioRef.current = audio;
      audio.volume = volume;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (repeat === 'one') {
        void audio.play();
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playNext, repeat, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    let cancelled = false;

    const checkIfLiked = async () => {
      if (!user || !currentTrack) {
        if (!cancelled) {
          setIsLiked(false);
        }
        return;
      }

      const { data } = await supabase
        .from('liked_tracks')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', currentTrack.id)
        .maybeSingle();

      if (!cancelled) {
        setIsLiked(Boolean(data));
      }
    };

    void checkIfLiked();

    return () => {
      cancelled = true;
    };
  }, [currentTrack, user]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        queue,
        currentTime,
        duration,
        volume,
        repeat,
        shuffle,
        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        seek,
        setVolume,
        toggleRepeat,
        toggleShuffle,
        addToQueue,
        isLiked,
        toggleLike,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
