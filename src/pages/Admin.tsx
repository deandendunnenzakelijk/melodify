import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Artist {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  verified: boolean;
}

interface Track {
  id: string;
  title: string;
  artist_id: string;
  duration: number;
  audio_url: string;
  cover_url: string;
  explicit: boolean;
}

export default function Admin() {
  const { profile } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);

  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistAvatar, setArtistAvatar] = useState('');

  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtistId, setTrackArtistId] = useState('');
  const [trackDuration, setTrackDuration] = useState('');
  const [trackAudioUrl, setTrackAudioUrl] = useState('');
  const [trackCoverUrl, setTrackCoverUrl] = useState('');
  const [trackExplicit, setTrackExplicit] = useState(false);

  useEffect(() => {
    if (profile?.is_admin) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    const { data: artistsData } = await supabase
      .from('artists')
      .select('*')
      .order('name');

    const { data: tracksData } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (artistsData) setArtists(artistsData);
    if (tracksData) setTracks(tracksData);
  };

  const addArtist = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('artists').insert({
      name: artistName,
      bio: artistBio,
      avatar_url: artistAvatar,
      verified: false,
    });

    if (!error) {
      setArtistName('');
      setArtistBio('');
      setArtistAvatar('');
      setShowAddArtist(false);
      loadData();
    }
  };

  const addTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('tracks').insert({
      title: trackTitle,
      artist_id: trackArtistId,
      duration: parseInt(trackDuration),
      audio_url: trackAudioUrl,
      cover_url: trackCoverUrl,
      explicit: trackExplicit,
    });

    if (!error) {
      setTrackTitle('');
      setTrackArtistId('');
      setTrackDuration('');
      setTrackAudioUrl('');
      setTrackCoverUrl('');
      setTrackExplicit(false);
      setShowAddTrack(false);
      loadData();
    }
  };

  const deleteArtist = async (id: string) => {
    if (confirm('Weet je zeker dat je deze artiest wilt verwijderen?')) {
      await supabase.from('artists').delete().eq('id', id);
      loadData();
    }
  };

  const deleteTrack = async (id: string) => {
    if (confirm('Weet je zeker dat je dit nummer wilt verwijderen?')) {
      await supabase.from('tracks').delete().eq('id', id);
      loadData();
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="p-8">
        <div className="text-white text-xl">Je hebt geen toegang tot deze pagina</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Artiesten</h2>
            <button
              onClick={() => setShowAddArtist(!showAddArtist)}
              className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Toevoegen
            </button>
          </div>

          {showAddArtist && (
            <form onSubmit={addArtist} className="bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Artiest naam"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded"
                required
              />
              <textarea
                value={artistBio}
                onChange={(e) => setArtistBio(e.target.value)}
                placeholder="Bio"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded"
                rows={3}
              />
              <input
                type="url"
                value={artistAvatar}
                onChange={(e) => setArtistAvatar(e.target.value)}
                placeholder="Avatar URL"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded"
              />
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-400 text-black py-2 rounded"
              >
                Opslaan
              </button>
            </form>
          )}

          <div className="space-y-2">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={artist.avatar_url || 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&cs=tinysrgb&w=300'}
                    alt={artist.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="text-white font-semibold">{artist.name}</div>
                    <div className="text-gray-400 text-sm">{artist.verified ? '✓ Verified' : 'Not verified'}</div>
                  </div>
                </div>
                <button
                  onClick={() => deleteArtist(artist.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Tracks</h2>
            <button
              onClick={() => setShowAddTrack(!showAddTrack)}
              className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Toevoegen
            </button>
          </div>

          {showAddTrack && (
            <form onSubmit={addTrack} className="bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
              <input
                type="text"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="Track titel"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded"
                required
              />
              <select
                value={trackArtistId}
                onChange={(e) => setTrackArtistId(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded"
                required
              >
                <option value="">Selecteer artiest</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={trackDuration}
                onChange={(e) => setTrackDuration(e.target.value)}
                placeholder="Duur (seconden)"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded"
                required
              />
              <input
                type="url"
                value={trackAudioUrl}
                onChange={(e) => setTrackAudioUrl(e.target.value)}
                placeholder="Audio URL (MP3)"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded"
                required
              />
              <input
                type="url"
                value={trackCoverUrl}
                onChange={(e) => setTrackCoverUrl(e.target.value)}
                placeholder="Cover URL"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded"
              />
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={trackExplicit}
                  onChange={(e) => setTrackExplicit(e.target.checked)}
                  className="w-4 h-4"
                />
                Explicit content
              </label>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-400 text-black py-2 rounded"
              >
                Opslaan
              </button>
            </form>
          )}

          <div className="space-y-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={track.cover_url || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300'}
                    alt={track.title}
                    className="w-12 h-12 rounded"
                  />
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">{track.title}</div>
                    <div className="text-gray-400 text-sm">
                      {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteTrack(track.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
