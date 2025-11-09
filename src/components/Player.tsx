import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Heart, Maximize2 } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { formatTime } from '../lib/utils';

interface PlayerProps {
  onOpenArtist?: (artistId: string) => void;
}

export default function Player({ onOpenArtist }: PlayerProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeat,
    shuffle,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    isLiked,
    toggleLike,
  } = usePlayer();
  const [isSeeking, setIsSeeking] = useState(false);
  const [pendingSeek, setPendingSeek] = useState(0);

  if (!currentTrack) {
    return null;
  }

  useEffect(() => {
    if (!isSeeking) {
      setPendingSeek(currentTime);
    }
  }, [currentTime, isSeeking]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(parseFloat(e.target.value), duration || 0));
    setPendingSeek(value);
    seek(value);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
  };

  const handleArtistClick = () => {
    if (onOpenArtist && currentTrack.artist_id) {
      onOpenArtist(currentTrack.artist_id);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black dark:bg-gray-950 border-t border-gray-800 dark:border-gray-700 h-24 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4 w-1/4">
        <img
          src={currentTrack.cover_url || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300'}
          alt={currentTrack.title}
          className="w-14 h-14 rounded shadow-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold truncate">{currentTrack.title}</div>
          <button
            type="button"
            onClick={handleArtistClick}
            className="text-gray-400 text-sm truncate hover:text-white transition-colors"
          >
            {currentTrack.artist?.name || 'Unknown Artist'}
          </button>
        </div>
        <button
          onClick={toggleLike}
          className={`p-2 rounded-full transition-colors ${
            isLiked ? 'text-green-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 w-2/4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              shuffle ? 'text-green-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={playPrevious}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlay}
            className="bg-white hover:bg-gray-200 text-black rounded-full p-3 transition-all hover:scale-105"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>

          <button
            onClick={playNext}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-full transition-colors ${
              repeat !== 'off' ? 'text-green-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Repeat className="w-5 h-5" />
            {repeat === 'one' && (
              <span className="absolute text-xs font-bold">1</span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-2xl">
          <span className="text-xs text-gray-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Number.isFinite(duration) && duration > 0 ? pendingSeek : 0}
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            className="flex-1 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                     hover:[&::-webkit-slider-thumb]:bg-green-500"
          />
          <span className="text-xs text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-1/4 justify-end">
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Maximize2 className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                     hover:[&::-webkit-slider-thumb]:bg-green-500"
          />
        </div>
      </div>
    </div>
  );
}
