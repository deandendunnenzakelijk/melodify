import { useState, useEffect } from 'react';
import { User, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    likedTracks: 0,
    playlists: 0,
    following: 0,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio);
      setAvatarUrl(profile.avatar_url);
      loadStats();
    }
  }, [profile]);

  const loadStats = async () => {
    if (!profile) return;

    const [likedTracksRes, playlistsRes, followingRes] = await Promise.all([
      supabase.from('liked_tracks').select('id', { count: 'exact' }).eq('user_id', profile.id),
      supabase.from('playlists').select('id', { count: 'exact' }).eq('user_id', profile.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', profile.id),
    ]);

    setStats({
      likedTracks: likedTracksRes.count || 0,
      playlists: playlistsRes.count || 0,
      following: followingRes.count || 0,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio: bio,
        avatar_url: avatarUrl,
      })
      .eq('id', profile!.id);

    if (!error) {
      await refreshProfile();
      setIsEditing(false);
    }

    setLoading(false);
  };

  if (!profile) {
    return <div className="p-8 text-white">Laden...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-b from-green-900 to-gray-900 dark:from-green-950 dark:to-black rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-8">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-40 h-40 rounded-full shadow-2xl"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-800 rounded-full flex items-center justify-center shadow-2xl">
                <User className="w-20 h-20 text-gray-600" />
              </div>
            )}

            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-2">PROFIEL</p>
              <h1 className="text-6xl font-bold text-white mb-4">{profile.display_name}</h1>
              {profile.bio && <p className="text-white text-lg mb-4">{profile.bio}</p>}
              <div className="flex items-center gap-6 text-white">
                <span className="font-semibold">{stats.playlists} playlists</span>
                <span>•</span>
                <span className="font-semibold">{stats.likedTracks} liked songs</span>
                <span>•</span>
                <span className="font-semibold">{stats.following} following</span>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white hover:bg-gray-200 text-black rounded-full px-6 py-2 font-semibold flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Bewerken
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="bg-gray-800 dark:bg-gray-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Profiel bewerken</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Weergavenaam
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Vertel iets over jezelf..."
                />
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {profile.is_premium && (
          <div className="bg-gradient-to-r from-yellow-900 to-orange-900 dark:from-yellow-950 dark:to-orange-950 rounded-2xl p-8 mt-6">
            <h2 className="text-2xl font-bold text-white mb-2">Premium Lid</h2>
            <p className="text-white">
              Je hebt toegang tot alle premium features, inclusief advertentievrij luisteren
              en offline downloads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
