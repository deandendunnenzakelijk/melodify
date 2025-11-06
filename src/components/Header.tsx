import { ChevronLeft, ChevronRight, User, Moon, Sun, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

interface HeaderProps {
  onNavigate: (view: string) => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="bg-gradient-to-b from-gray-900 to-transparent dark:from-gray-950 dark:to-transparent h-16 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {profile?.is_premium && (
          <span className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-sm font-bold rounded-full">
            Premium
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-black/40 hover:bg-black/60 rounded-full px-4 py-2 transition-colors"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-6 h-6 rounded-full" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
            <span className="text-white font-semibold">{profile?.display_name}</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 dark:bg-gray-900 rounded-lg shadow-xl py-2">
              <button
                onClick={() => {
                  onNavigate('profile');
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profiel
              </button>
              {profile?.is_admin && (
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  signOut();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
