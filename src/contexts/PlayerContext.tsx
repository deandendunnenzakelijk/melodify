import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  album_id: string | null;
  duration: number;
  audio_url: string;
  cover_url: string;
  explicit: boolean;
  artist?: {
    name: string;
  };
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentTime: number;
  duration: number;
  volume: number;
  repeat: 'off' | 'all' | 'one';
  shuffle: boolean;
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  isLiked: boolean;
  toggleLike: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [shuffle, setShuffle] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });

      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });

      audioRef.current.addEventListener('ended', () => {
        if (repeat === 'one') {
          audioRef.current?.play();
        } else {
          playNext();
        }
      });
    }
  }, [repeat]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user || !currentTrack) {
        setIsLiked(false);
        return;
      }

      const { data } = await supabase
        .from('liked_tracks')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', currentTrack.id)
        .maybeSingle();

      setIsLiked(!!data);
    };

    checkIfLiked();
  }, [currentTrack, user]);

  const addToHistory = async (trackId: string) => {
    if (!user) return;

    await supabase.from('listening_history').insert({
      user_id: user.id,
      track_id: trackId,
    });

    await supabase
      .from('tracks')
      .update({ play_count: (currentTrack?.play_count || 0) + 1 })
      .eq('id', trackId);
  };

  const playTrack = (track: Track, playlist?: Track[]) => {
    setCurrentTrack(track);
    setQueue(playlist || [track]);
    setHistoryIndex(playlist?.findIndex(t => t.id === track.id) || 0);

    if (audioRef.current) {
      audioRef.current.src = track.audio_url;
      audioRef.current.play();
      setIsPlaying(true);
      addToHistory(track.id);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
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
  };

  const playPrevious = () => {
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
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
  };

  const toggleRepeat = () => {
    setRepeat(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleShuffle = () => {
    setShuffle(prev => !prev);
    if (!shuffle && queue.length > 0) {
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      const currentIndex = shuffled.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex > 0) {
        [shuffled[0], shuffled[currentIndex]] = [shuffled[currentIndex], shuffled[0]];
      }
      setQueue(shuffled);
      setHistoryIndex(0);
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const toggleLike = async () => {
    if (!user || !currentTrack) return;

    if (isLiked) {
      await supabase
        .from('liked_tracks')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', currentTrack.id);
      setIsLiked(false);
    } else {
      await supabase.from('liked_tracks').insert({
        user_id: user.id,
        track_id: currentTrack.id,
      });
      setIsLiked(true);
    }
  };

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

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
