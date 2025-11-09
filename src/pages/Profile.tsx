import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { User, Edit2, Upload, Sparkles, Music2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadFileToR2 } from '../lib/r2';

interface ArtistProfile {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  verified: boolean;
  profile_id: string | null;
  created_at: string;
}

interface ArtistTrack {
  id: string;
  title: string;
  artist_id: string;
  duration: number;
  audio_url: string;
  cover_url: string;
  explicit: boolean;
  created_at: string;
}

const getAudioDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(isNaN(audio.duration) ? 0 : audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Kon de duur van het audiobestand niet bepalen.'));
    };
  });

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarFileName, setAvatarFileName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [stats, setStats] = useState({
    likedTracks: 0,
    playlists: 0,
    following: 0,
  });
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [artistTracks, setArtistTracks] = useState<ArtistTrack[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistError, setArtistError] = useState<string | null>(null);
  const [artistSuccess, setArtistSuccess] = useState<string | null>(null);
  const [isArtistEditing, setIsArtistEditing] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistAvatar, setArtistAvatar] = useState('');
  const [artistSaving, setArtistSaving] = useState(false);
  const [artistModeUpdating, setArtistModeUpdating] = useState(false);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackExplicit, setTrackExplicit] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverFileName, setCoverFileName] = useState('');
  const [trackUploading, setTrackUploading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackSuccess, setTrackSuccess] = useState<string | null>(null);

  const activeArtistId = profile?.artist_id ?? artistProfile?.id ?? null;
  const isArtistModeActive = Boolean(profile?.is_artist || profile?.artist_id || artistProfile);
  const isActivatingArtistMode = !profile?.is_artist && !!artistProfile;

  const loadStats = useCallback(async () => {
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
  }, [profile]);

  useEffect(() => {
    if (artistProfile && !isArtistEditing) {
      setArtistName(artistProfile.name);
      setArtistBio(artistProfile.bio || '');
      setArtistAvatar(artistProfile.avatar_url || '');
    }
  }, [artistProfile, isArtistEditing]);

  interface LoadArtistDataOptions {
    artistId?: string;
    profileId?: string;
    skipArtistCheck?: boolean;
  }

  const loadArtistData = useCallback(async (options: LoadArtistDataOptions = {}) => {
    const activeProfileId = options.profileId ?? profile?.id;
    if (!activeProfileId) return;

    if (!profile?.is_artist && !options.skipArtistCheck && !options.artistId) {
      return;
    }

    setArtistLoading(true);
    setArtistError(null);

    try {
      const targetArtistId = options.artistId ?? profile?.artist_id ?? null;

      const artistQuery = targetArtistId
        ? supabase.from('artists').select('*').eq('id', targetArtistId)
        : supabase.from('artists').select('*').eq('profile_id', activeProfileId);

      const { data: artistData, error: artistError } = await artistQuery.maybeSingle();

      if (artistError) throw artistError;

      setArtistProfile(artistData);

      if (artistData) {
        if (
          profile &&
          artistData.profile_id === profile.id &&
          (!profile.artist_id || !profile.is_artist) &&
          !options.artistId
        ) {
          const updates: { artist_id?: string; is_artist?: boolean } = {};
          if (!profile.artist_id) {
            updates.artist_id = artistData.id;
          }
          if (!profile.is_artist) {
            updates.is_artist = true;
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from('profiles').update(updates).eq('id', profile.id);
          }
          await refreshProfile();
        }
        const { data: trackData, error: trackError } = await supabase
          .from('tracks')
          .select('*')
          .eq('artist_id', artistData.id)
          .order('created_at', { ascending: false });

        if (trackError) throw trackError;
        setArtistTracks(trackData || []);
      } else {
        setArtistTracks([]);
      }
    } catch (error) {
      console.error(error);
      setArtistError(error instanceof Error ? error.message : 'Kon artiestgegevens niet laden.');
    } finally {
      setArtistLoading(false);
    }
  }, [profile, refreshProfile]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio);
      setAvatarUrl(profile.avatar_url);
      loadStats();
      if (profile.is_artist || profile.artist_id) {
        loadArtistData({
          artistId: profile.artist_id ?? undefined,
          profileId: profile.id,
          skipArtistCheck: true,
        });
      } else {
        setArtistProfile(null);
        setArtistTracks([]);
        setIsArtistEditing(false);
        setArtistError(null);
        setArtistSuccess(null);
      }
    }
  }, [profile, loadStats, loadArtistData]);

  const startArtistEditing = () => {
    setArtistError(null);
    setArtistSuccess(null);
    setIsArtistEditing(true);
    setArtistName(artistProfile?.name || profile?.display_name || '');
    setArtistBio(artistProfile?.bio || '');
    setArtistAvatar(artistProfile?.avatar_url || profile?.avatar_url || '');
  };

  const resetTrackForm = () => {
    setTrackTitle('');
    setTrackExplicit(false);
    setAudioFile(null);
    setAudioFileName('');
    setCoverFile(null);
    setCoverFileName('');
  };

  const handleAudioFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setAudioFile(file);
    setAudioFileName(file ? file.name : '');
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
    setAvatarFileName(file ? file.name : '');
  };

  const handleUploadAvatar = async () => {
    if (!profile || !avatarFile) return;

    setAvatarUploading(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const upload = await uploadFileToR2(avatarFile, {
        folder: `profiles/${profile.id}/avatars`,
      });
      setAvatarUrl(upload.publicUrl);
      setProfileMessage('Profielfoto geüpload. Vergeet niet op te slaan.');
      setAvatarFile(null);
      setAvatarFileName('');
    } catch (error) {
      console.error(error);
      setProfileError(
        error instanceof Error ? error.message : 'Het uploaden van de profielfoto is mislukt.'
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setCoverFile(file);
    setCoverFileName(file ? file.name : '');
  };

  const handleSaveArtistProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setArtistSaving(true);
    setArtistError(null);
    setArtistSuccess(null);

    try {
      let resolvedArtistId: string | null = profile.artist_id ?? artistProfile?.id ?? null;
      let shouldSkipArtistCheck = false;

      if (profile.artist_id || artistProfile) {
        const artistId = profile.artist_id || artistProfile?.id;
        if (!artistId) throw new Error('Geen artiestprofiel gevonden.');

        const { error } = await supabase
          .from('artists')
          .update({
            name: artistName,
            bio: artistBio,
            avatar_url: artistAvatar,
          })
          .eq('id', artistId)
          .eq('profile_id', profile.id);

        if (error) throw error;
        setArtistSuccess('Artistprofiel bijgewerkt.');
        resolvedArtistId = artistId;
      } else {
        const { data, error } = await supabase
          .from('artists')
          .insert({
            name: artistName,
            bio: artistBio,
            avatar_url: artistAvatar,
            profile_id: profile.id,
            verified: false,
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Kon artiestprofiel niet opslaan.');

        setArtistProfile(data);
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_artist: true,
            artist_id: data.id,
          })
          .eq('id', profile.id);

        if (profileError) throw profileError;
        setArtistSuccess('Artiestmodus is geactiveerd!');
        resolvedArtistId = data.id;
        shouldSkipArtistCheck = true;
        await refreshProfile();
      }

      if (resolvedArtistId) {
        await loadArtistData({
          artistId: resolvedArtistId,
          profileId: profile.id,
          skipArtistCheck: shouldSkipArtistCheck,
        });
      } else {
        await loadArtistData({ profileId: profile.id });
      }
      setIsArtistEditing(false);
    } catch (error) {
      console.error(error);
      setArtistError(error instanceof Error ? error.message : 'Opslaan van artiestgegevens is mislukt.');
    } finally {
      setArtistSaving(false);
    }
  };

  const handleDisableArtistMode = async () => {
    if (!profile) return;

    setArtistModeUpdating(true);
    setArtistError(null);
    setArtistSuccess(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_artist: false, artist_id: null })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setArtistProfile(null);
      setArtistTracks([]);
      setArtistSuccess('Artiestmodus is uitgeschakeld.');
    } catch (error) {
      console.error(error);
      setArtistError(error instanceof Error ? error.message : 'Kon artiestmodus niet uitschakelen.');
    } finally {
      setArtistModeUpdating(false);
    }
  };

  const handleUploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeArtistId) {
      setTrackError('Activeer eerst artiestmodus.');
      return;
    }

    if (!audioFile) {
      setTrackError('Selecteer een audiobestand om te uploaden.');
      return;
    }

    setTrackUploading(true);
    setTrackError(null);
    setTrackSuccess(null);

    try {
      const duration = Math.round(await getAudioDuration(audioFile));
      const audioUpload = await uploadFileToR2(audioFile, {
        folder: `artists/${activeArtistId}/tracks`,
      });

      let coverUrl = '';
      if (coverFile) {
        const coverUpload = await uploadFileToR2(coverFile, {
          folder: `artists/${activeArtistId}/covers`,
        });
        coverUrl = coverUpload.publicUrl;
      }

      const { data, error } = await supabase
        .from('tracks')
        .insert({
          title: trackTitle,
          artist_id: activeArtistId,
          duration: duration || 0,
          audio_url: audioUpload.publicUrl,
          cover_url: coverUrl,
          explicit: trackExplicit,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setArtistTracks((prev) => [data, ...prev]);
      }

      setTrackSuccess('Je track is geüpload!');
      resetTrackForm();
    } catch (error) {
      console.error(error);
      setTrackError(error instanceof Error ? error.message : 'Het uploaden van de track is mislukt.');
    } finally {
      setTrackUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileError(null);
    setProfileMessage(null);

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
      setProfileMessage('Profiel bijgewerkt.');
    } else {
      setProfileError('Het bijwerken van je profiel is mislukt.');
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
              onClick={() => {
                setProfileError(null);
                setProfileMessage(null);
                setAvatarFile(null);
                setAvatarFileName('');
                setAvatarUploading(false);
                setIsEditing((prev) => !prev);
              }}
              className="bg-white hover:bg-gray-200 text-black rounded-full px-6 py-2 font-semibold flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Bewerken
            </button>
          </div>
        </div>

        {profileError && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-lg mt-4">
            {profileError}
          </div>
        )}
        {profileMessage && (
          <div className="bg-green-500/10 border border-green-500/40 text-green-200 px-4 py-3 rounded-lg mt-4">
            {profileMessage}
          </div>
        )}

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

              <div>
                <label className="block text-white text-sm font-semibold mb-2">Profielfoto uploaden</label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-lg cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>{avatarFileName || 'Kies een afbeelding'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleUploadAvatar}
                    disabled={!avatarFile || avatarUploading}
                    className="sm:w-auto bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 disabled:cursor-not-allowed text-black font-semibold px-4 py-3 rounded-lg transition"
                  >
                    {avatarUploading ? 'Uploaden...' : 'Uploaden'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Ondersteunt JPG, PNG en GIF. Maximaal 10 MB.</p>
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
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) {
                      setDisplayName(profile.display_name);
                      setBio(profile.bio);
                      setAvatarUrl(profile.avatar_url);
                    }
                    setAvatarFile(null);
                    setAvatarFileName('');
                    setAvatarUploading(false);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 dark:bg-gray-900 rounded-2xl p-8 mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-green-500/20 text-green-300 p-3 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Artiestmodus</h2>
                <p className="text-gray-300">
                  Upload je eigen nummers naar Cloudflare R2 en beheer je artiestprofiel.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {profile.is_artist ? (
                <button
                  onClick={handleDisableArtistMode}
                  disabled={artistModeUpdating}
                  className="flex items-center gap-2 bg-red-500/20 text-red-200 hover:bg-red-500/30 px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {artistModeUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music2 className="w-4 h-4" />}
                  Uitschakelen
                </button>
              ) : isActivatingArtistMode ? (
                <button
                  disabled
                  className="flex items-center gap-2 bg-green-500/20 text-green-200 px-4 py-2 rounded-lg transition"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Artiestmodus wordt geactiveerd...
                </button>
              ) : (
                <button
                  onClick={startArtistEditing}
                  className="flex items-center gap-2 bg-green-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Activeer artiestmodus
                </button>
              )}
              {isArtistModeActive && (
                <button
                  onClick={startArtistEditing}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Artistprofiel
                </button>
              )}
            </div>
          </div>

          {artistError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-lg">
              {artistError}
            </div>
          )}

          {artistSuccess && (
            <div className="mt-4 bg-green-500/10 border border-green-500/40 text-green-200 px-4 py-3 rounded-lg">
              {artistSuccess}
            </div>
          )}

          {isArtistEditing && (
            <form onSubmit={handleSaveArtistProfile} className="mt-6 space-y-4">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Artiestnaam</label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Artiest bio</label>
                <textarea
                  value={artistBio}
                  onChange={(e) => setArtistBio(e.target.value)}
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Vertel meer over jezelf als artiest..."
                />
              </div>
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Artiest avatar URL</label>
                <input
                  type="url"
                  value={artistAvatar}
                  onChange={(e) => setArtistAvatar(e.target.value)}
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={artistSaving}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {artistSaving ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsArtistEditing(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                >
                  Annuleren
                </button>
              </div>
            </form>
          )}

          {isArtistModeActive && (
            <div className="mt-6 space-y-6">
              {!isArtistEditing && artistProfile && (
                <div className="flex items-start gap-4">
                  <img
                    src={artistProfile.avatar_url || avatarUrl || 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&cs=tinysrgb&w=200'}
                    alt={artistProfile.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-white">{artistProfile.name}</h3>
                    {artistProfile.bio && <p className="text-gray-300 mt-1 whitespace-pre-line">{artistProfile.bio}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      Laatste update:{' '}
                      {artistProfile.created_at
                        ? new Date(artistProfile.created_at).toLocaleDateString('nl-NL')
                        : 'Onbekend'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-gray-900 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload een nieuw nummer
                  </h3>
                  {trackError && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-2 rounded-lg">
                      {trackError}
                    </div>
                  )}
                  {trackSuccess && (
                    <div className="mb-4 bg-green-500/10 border border-green-500/40 text-green-200 px-4 py-2 rounded-lg">
                      {trackSuccess}
                    </div>
                  )}
                  <form onSubmit={handleUploadTrack} className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Titel</label>
                      <input
                        type="text"
                        value={trackTitle}
                        onChange={(e) => setTrackTitle(e.target.value)}
                        className="w-full bg-gray-950 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Naam van je track"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Audiobestand</label>
                      <label className="flex items-center justify-between gap-3 bg-gray-950 border border-dashed border-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:border-green-500">
                        <div>
                          <p className="text-white font-medium">{audioFileName || 'Kies een audiobestand (MP3, WAV)'}</p>
                          <p className="text-xs text-gray-400">Bestanden worden naar Cloudflare R2 geüpload</p>
                        </div>
                        <input type="file" accept="audio/*" onChange={handleAudioFileChange} className="hidden" />
                        <Upload className="w-5 h-5 text-gray-300" />
                      </label>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Coverafbeelding (optioneel)</label>
                      <label className="flex items-center justify-between gap-3 bg-gray-950 border border-dashed border-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:border-green-500">
                        <div>
                          <p className="text-white font-medium">{coverFileName || 'Kies een afbeelding (JPG, PNG)'}</p>
                          <p className="text-xs text-gray-400">Wordt weergegeven als albumcover</p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                        <Upload className="w-5 h-5 text-gray-300" />
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-white text-sm">
                      <input
                        type="checkbox"
                        checked={trackExplicit}
                        onChange={(e) => setTrackExplicit(e.target.checked)}
                        className="w-4 h-4"
                      />
                      Bevat expliciete inhoud
                    </label>
                    <button
                      type="submit"
                      disabled={trackUploading}
                      className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50"
                    >
                      {trackUploading ? 'Uploaden...' : 'Upload track'}
                    </button>
                  </form>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Music2 className="w-5 h-5" />
                    Recente uploads
                  </h3>
                  {artistLoading ? (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Tracks laden...
                    </div>
                  ) : artistTracks.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nog geen nummers geüpload. Deel je eerste track!</p>
                  ) : (
                    <div className="space-y-3">
                      {artistTracks.map((track) => (
                        <div key={track.id} className="flex items-center gap-3 bg-gray-950/60 px-4 py-3 rounded-xl">
                          <img
                            src={
                              track.cover_url ||
                              'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=200'
                            }
                            alt={track.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{track.title}</p>
                            <p className="text-xs text-gray-400">
                              {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')} ·{' '}
                              {new Date(track.created_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>
                          {track.explicit && (
                            <span className="text-xs uppercase bg-red-500/20 text-red-200 px-2 py-1 rounded">Explicit</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isArtistModeActive && !isArtistEditing && (
            <p className="mt-4 text-sm text-gray-300">
              Wil je je eigen muziek uitbrengen? Activeer artiestmodus en upload direct vanuit je profiel.
            </p>
          )}
        </div>

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
