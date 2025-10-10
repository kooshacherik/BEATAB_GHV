import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phoneNumber: '',
    profilePicture: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [listeningHistory, setListeningHistory] = useState([]);

  const [authenticatedUserId, setAuthenticatedUserId] = useState(null);

  const handleApiError = useCallback((error, defaultMessage) => {
    console.error(defaultMessage, error);
    const errorMessage = error?.response?.data?.message || defaultMessage;
    toast.error(errorMessage);

    if (error?.response?.status === 401 || error?.response?.status === 403) {
      localStorage.removeItem('user');
      navigate('/signin');
    }
  }, [navigate]);

  const verifyAndSetUser = useCallback(async () => {
    try {
      const res = await axios.get("/api/users/verify");
      if (res.data && res.data.user && res.data.user.id) {
        setAuthenticatedUserId(res.data.user.id);
      } else {
        throw new Error('User ID not found in verification response.');
      }
    } catch (error) {
      handleApiError(error, "Failed to authenticate user. Please log in.");
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      console.warn("UserProfile: No authenticatedUserId to fetch profile. Skipping fetch.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`/api/users/${userId}`);
      setUser(res.data);
      setFormData({
        firstname: res.data.firstname,
        lastname: res.data.lastname,
        email: res.data.email,
        phoneNumber: res.data.phoneNumber || '',
        profilePicture: res.data.profilePicture || '',
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch user profile.');
    }
  }, [handleApiError]);

  const fetchUserPlaylistsAndHistory = useCallback(async (userId) => {
    if (!userId) {
      console.warn("UserProfile: No authenticatedUserId to fetch playlists and history. Skipping fetch.");
      setLoading(false);
      return;
    }
    try {
      // Fetch user playlists
      const playlistsRes = await axios.get(`/api/users/${userId}/playlists`);
      const playlistsWithSongs = await Promise.all(
        (playlistsRes.data.playlists || []).map(async (playlist) => {
          if (playlist.songIds && playlist.songIds.length > 0) {
            const songDetailsPromises = playlist.songIds.map(async (songId) => {
              try {
                const songRes = await axios.get(`/api/songs/${songId}`);
                return songRes.data;
              } catch (songError) {
                console.error(`Failed to fetch song with ID ${songId}:`, songError);
                return null;
              }
            });
            const songs = (await Promise.all(songDetailsPromises)).filter(Boolean);
            return { ...playlist, songs };
          }
          return { ...playlist, songs: [] };
        })
      );
      setUserPlaylists(playlistsWithSongs);

      // Fetch user listening history (already includes full song objects)
      const historyRes = await axios.get(`/api/plays/users/${userId}`);
      setListeningHistory(historyRes.data || []);
    } catch (error) {
      handleApiError(error, 'Failed to fetch user playlists or history.');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    verifyAndSetUser();
  }, [verifyAndSetUser]);

  useEffect(() => {
    if (authenticatedUserId) {
      fetchUserProfile(authenticatedUserId);
      fetchUserPlaylistsAndHistory(authenticatedUserId);
    }
  }, [authenticatedUserId, fetchUserProfile, fetchUserPlaylistsAndHistory]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!authenticatedUserId) {
      toast.error('User not authenticated for profile update.');
      return;
    }
    try {
      const res = await axios.patch(`/api/users/${authenticatedUserId}`, formData);
      setUser(res.data.user);
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      handleApiError(error, 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }
    toast.info('Password change functionality is pending backend implementation.');
  };

  const handleDeleteAccount = async () => {
    if (!authenticatedUserId) {
      toast.error('User not authenticated for account deletion.');
      return;
    }
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/users/${authenticatedUserId}`);
        toast.success('Account deleted successfully.');
        localStorage.removeItem('user');
        navigate('/signup');
      } catch (error) {
        handleApiError(error, 'Failed to delete account.');
      }
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-black text-cyan-400">
          <p className="text-xl font-mono">LOADING USER DATA...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-black text-red-400">
          <p className="text-xl font-mono">FAILED TO LOAD USER PROFILE.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-cyan-200 p-8 pt-20">
        <section className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-cyan-700/50 p-8 space-y-8">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-extrabold text-cyan-400 font-mono tracking-wide">USER PROFILE: <span className="text-white">{user.firstname} {user.lastname}</span></h1>
            <p className="text-cyan-300 text-lg mt-2">{user.email}</p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">PERSONAL DATA</h3>
            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-cyan-300 text-sm font-bold mb-2">First Name:</label>
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    className="sci-fi-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm font-bold mb-2">Last Name:</label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    className="sci-fi-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm font-bold mb-2">Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="sci-fi-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm font-bold mb-2">Phone Number:</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="sci-fi-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm font-bold mb-2">Profile Picture URL:</label>
                  <input
                    type="text"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleChange}
                    className="sci-fi-input w-full"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={() => setEditMode(false)} className="sci-fi-button bg-gray-600/80">
                    CANCEL
                  </button>
                  <button type="submit" className="sci-fi-button bg-green-600/80">
                    SAVE CHANGES
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setEditMode(true)} className="sci-fi-button bg-blue-600/80">
                    EDIT PROFILE
                  </button>
                </div>
                <div className="bg-black/20 border border-cyan-700/50 rounded-lg p-4">
                  {user.profilePicture && (
                    <img src={user.profilePicture} alt="Profile" className="w-32 h-32 rounded-full mx-auto mb-4 border-2 border-cyan-500 shadow-lg" />
                  )}
                  <p className="text-lg"><strong className="text-cyan-300">Name:</strong> {user.firstname} {user.lastname}</p>
                  <p className="text-lg"><strong className="text-cyan-300">Email:</strong> {user.email}</p>
                  <p className="text-lg"><strong className="text-cyan-300">Phone:</strong> {user.phoneNumber || 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-cyan-800/50">
              <h3 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">CHANGE PASSWORD</h3>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <p className="text-yellow-400">
                  **Backend update required for password change functionality.**
                </p>
                <div>
                  <label className="block text-cyan-300 text-sm font-bold mb-2">Current Password:</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="sci-fi-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm font-bold mb-2">New Password:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="sci-fi-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm font-bold mb-2">Confirm New Password:</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="sci-fi-input w-full"
                    required
                  />
                </div>
                <button type="submit" className="sci-fi-button bg-cyan-600/80 w-full" disabled>
                  CHANGE PASSWORD (Backend Pending)
                </button>
              </form>
            </div>

            <div className="mt-12 pt-8 border-t border-cyan-800/50">
              <h3 className="2xl font-bold text-cyan-400 mb-6 font-mono">YOUR DATAPACKS (PLAYLISTS)</h3>
              {userPlaylists.length === 0 ? (
                <p className="text-cyan-300/70 text-lg">No playlists created yet.</p>
              ) : (
                <div className="space-y-4">
                  {userPlaylists.map((playlist, index) => (
                    <div key={playlist.name || index} className="bg-black/20 border border-cyan-700/50 rounded-lg p-4">
                      <h4 className="text-xl font-bold text-white mb-2">{playlist.name || `Playlist ${index + 1}`}</h4>
                      {playlist.songs && playlist.songs.length > 0 ? (
                        <ul className="list-disc list-inside text-cyan-200">
                          {playlist.songs.map((song) => (
                            <li key={song.id} className="mb-1">
                              {song.name || `Song ID: ${song.id}`} {song.artist ? `by ${song.artist.name}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-cyan-300/70">No songs in this playlist.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-cyan-800/50">
              <h3 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">LISTENING HISTORY</h3>
              {listeningHistory.length === 0 ? (
                <p className="text-cyan-300/70 text-lg">No listening history yet.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto scrollbar-thin pr-2">
                  <table className="min-w-full table-auto text-left text-cyan-200">
                    <thead>
                      <tr className="border-b border-cyan-700">
                        <th className="py-2 px-4">Song</th>
                        <th className="py-2 px-4">Artist</th>
                        <th className="py-2 px-4">Listened Time</th>
                        <th className="py-2 px-4">Played At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listeningHistory.map((entry, index) => (
                        <tr key={index} className="border-b border-cyan-900 last:border-b-0 hover:bg-black/10">
                          <td className="py-2 px-4">{entry.Song?.name || 'Unknown Song'}</td>
                          <td className="py-2 px-4">{entry.Song?.artist?.name || 'Unknown Artist'}</td>
                          <td className="py-2 px-4">{formatTime(entry.listenedMs)}</td>
                          <td className="py-2 px-4">{new Date(entry.playedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-red-800/50 text-center">
              <h3 className="text-2xl font-bold text-red-400 mb-6 font-mono">DANGER ZONE</h3>
              <button
                onClick={handleDeleteAccount}
                className="sci-fi-button bg-red-600/80 hover:bg-red-500 w-full md:w-auto"
              >
                DELETE ACCOUNT
              </button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default UserProfile;