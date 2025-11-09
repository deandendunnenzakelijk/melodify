import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import LikedSongs from './pages/LikedSongs';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Artist from './pages/Artist';
import Playlist from './pages/Playlist';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [shouldOpenCreatePlaylist, setShouldOpenCreatePlaylist] = useState(false);

  const handleNavigate = (view: string) => {
    if (view === 'create-playlist') {
      setShouldOpenCreatePlaylist(true);
      setCurrentView('library');
      return;
    }

    if (view.startsWith('playlist-')) {
      const playlistId = view.replace('playlist-', '');
      setSelectedPlaylistId(playlistId);
      setCurrentView('playlist');
      return;
    }

    if (view !== 'artist') {
      setSelectedArtistId(null);
    }

    if (view !== 'playlist') {
      setSelectedPlaylistId(null);
    }

    setCurrentView(view);
  };

  const handleOpenArtist = (artistId: string) => {
    setSelectedArtistId(artistId);
    setCurrentView('artist');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onOpenArtist={handleOpenArtist} />;
      case 'search':
        return <Search onOpenArtist={handleOpenArtist} />;
      case 'library':
        return (
          <Library
            openCreatePlaylist={shouldOpenCreatePlaylist}
            onCreatePlaylistHandled={() => setShouldOpenCreatePlaylist(false)}
            onOpenPlaylist={(playlistId) => {
              setSelectedPlaylistId(playlistId);
              setCurrentView('playlist');
            }}
          />
        );
      case 'liked':
        return <LikedSongs onOpenArtist={handleOpenArtist} />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return <Admin />;
      case 'artist':
        return <Artist artistId={selectedArtistId} onOpenArtist={handleOpenArtist} />;
      case 'playlist':
        return <Playlist playlistId={selectedPlaylistId} onOpenArtist={handleOpenArtist} />;
      default:
        return <Home onOpenArtist={handleOpenArtist} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black dark:from-black dark:to-gray-950">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentView={currentView} activePlaylistId={selectedPlaylistId} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-y-auto pb-24">
          <Header onNavigate={handleNavigate} />
          {renderView()}
        </div>
      </div>
      <Player onOpenArtist={handleOpenArtist} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
