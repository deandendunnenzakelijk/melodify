import { Home, Search, Library, Plus, Heart, Music2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activePlaylistId?: string | null;
}

interface Playlist {
  id: string;
  name: string;
  cover_url: string;
}

export default function Sidebar({ currentView, onNavigate, activePlaylistId }: SidebarProps) {
  const { profile } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (profile) {
      loadPlaylists();
    }
  }, [profile]);

  const loadPlaylists = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('playlists')
      .select('id, name, cover_url')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPlaylists(data);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Home', view: 'home' },
    { icon: Search, label: 'Zoeken', view: 'search' },
    { icon: Library, label: 'Bibliotheek', view: 'library' },
  ];

  const libraryItems = [
    { icon: Plus, label: 'Playlist maken', view: 'create-playlist' },
    { icon: Heart, label: 'Liked Songs', view: 'liked' },
  ];

  return (
    <div className="w-64 bg-black dark:bg-black h-full flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Music2 className="w-8 h-8 text-green-500" />
          <span className="text-white text-2xl font-bold">Melodify</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.view
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="px-6 mt-2">
        <div className="border-t border-gray-800 pt-4">
          {libraryItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.view
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onNavigate(`playlist-${playlist.id}`)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-left ${
                activePlaylistId === playlist.id && currentView === 'playlist'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {playlist.cover_url ? (
                <img src={playlist.cover_url} alt={playlist.name} className="w-10 h-10 rounded" />
              ) : (
                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <span className="truncate">{playlist.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
