import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
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

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentTime: number;
  duration: number;
  volume: number;
  repeat: 'off' | 'all' | 'one';
  shuffle: boolean;
  isLiked: boolean;
}

interface PlayerControls {
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  toggleLike: () => Promise<void>;
}

interface NowPlayingState {
  currentTrack: Track | null;
  isPlaying: boolean;
}

const PlayerStateContext = createContext<PlayerState | undefined>(undefined);
const PlayerControlsContext = createContext<PlayerControls | undefined>(undefined);
const NowPlayingContext = createContext<NowPlayingState | undefined>(undefined);

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

  const addToHistory = useCallback(async (trackId: string) => {
    if (!user) return;

    await supabase.from('listening_history').insert({
      user_id: user.id,
      track_id: trackId,
    });
  }, [user]);

  const playTrack = useCallback((track: Track, playlist?: Track[]) => {
    setCurrentTrack(track);
    setQueue(playlist || [track]);
    if (playlist && playlist.length > 0) {
      const playlistIndex = playlist.findIndex((item) => item.id === track.id);
      setHistoryIndex(playlistIndex >= 0 ? playlistIndex : 0);
    } else {
      setHistoryIndex(0);
    }

    if (audioRef.current) {
      audioRef.current.src = track.audio_url;
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Fout bij het afspelen van audio:', error);
        });
      }
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(audioRef.current.duration || track.duration || 0);
      addToHistory(track.id);
    }
  }, [addToHistory]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Fout bij het hervatten van audio:', error);
        });
      }
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;

    const clampedTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, []);

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
    setRepeat((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prevShuffle) => {
      const nextShuffle = !prevShuffle;
      if (!prevShuffle && queue.length > 0) {
        const shuffled = [...queue].sort(() => Math.random() - 0.5);
        const currentIndex = shuffled.findIndex((t) => t.id === currentTrack?.id);
        if (currentIndex > 0) {
          [shuffled[0], shuffled[currentIndex]] = [shuffled[currentIndex], shuffled[0]];
        }
        setQueue(shuffled);
        setHistoryIndex(0);
      }
      return nextShuffle;
    });
  }, [currentTrack, queue]);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
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
      await supabase.from('liked_tracks').insert({
        user_id: user.id,
        track_id: currentTrack.id,
      });
      setIsLiked(true);
    }
  }, [currentTrack, isLiked, user]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Fout bij het herhalen van audio:', error);
          });
        }
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

  const stateValue = useMemo<PlayerState>(() => ({
    currentTrack,
    isPlaying,
    queue,
    currentTime,
    duration,
    volume,
    repeat,
    shuffle,
    isLiked,
  }), [currentTrack, currentTime, duration, isLiked, isPlaying, queue, repeat, shuffle, volume]);

  const controlsValue = useMemo<PlayerControls>(() => ({
    playTrack,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    addToQueue,
    toggleLike,
  }), [addToQueue, playNext, playPrevious, playTrack, seek, setVolume, toggleLike, toggleRepeat, toggleShuffle, togglePlay]);

  const nowPlayingValue = useMemo<NowPlayingState>(() => ({
    currentTrack,
    isPlaying,
  }), [currentTrack, isPlaying]);

  return (
    <PlayerStateContext.Provider value={stateValue}>
      <PlayerControlsContext.Provider value={controlsValue}>
        <NowPlayingContext.Provider value={nowPlayingValue}>
          {children}
        </NowPlayingContext.Provider>
      </PlayerControlsContext.Provider>
    </PlayerStateContext.Provider>
  );
}

export function usePlayerState() {
  const context = useContext(PlayerStateContext);
  if (context === undefined) {
    throw new Error('usePlayerState must be used within a PlayerProvider');
  }
  return context;
}

export function usePlayerControls() {
  const context = useContext(PlayerControlsContext);
  if (context === undefined) {
    throw new Error('usePlayerControls must be used within a PlayerProvider');
  }
  return context;
}

export function useNowPlaying() {
  const context = useContext(NowPlayingContext);
  if (context === undefined) {
    throw new Error('useNowPlaying must be used within a PlayerProvider');
  }
  return context;
}

export function usePlayer() {
  const state = usePlayerState();
  const controls = usePlayerControls();
  return { ...state, ...controls };
}
