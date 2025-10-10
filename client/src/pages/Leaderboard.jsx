// client/src/pages/Leaderboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Leaderboard = () => {
  const [topSongs, setTopSongs] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleApiError = useCallback((error, defaultMessage) => {
    console.error(defaultMessage, error);
    toast.error(error.response?.data?.message || defaultMessage);
  }, []);

  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [songsRes, usersRes] = await Promise.all([
        axios.get('/api/plays/leaderboard/songs', { withCredentials: true }),
        axios.get('/api/plays/leaderboard/users', { withCredentials: true }),
      ]);
      setTopSongs(songsRes.data.topSongs || []);
      setTopUsers(usersRes.data.topUsers || []);
    } catch (error) {
      handleApiError(error, 'Failed to fetch leaderboard data.');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const formatTime = (ms) => {
    const value = parseInt(ms, 10);
    if (isNaN(value) || value <= 0) return '0s';

    const totalSeconds = Math.floor(value / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let timeString = '';
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    if (seconds > 0 || timeString === '') timeString += `${seconds}s`;


    return timeString.trim();
  };

  if (loading) {
    return (
      <div className="bg-[#0A0F1A] min-h-screen flex items-center justify-center">
        <p className="text-cyan-400 text-xl glitch-text">LOADING LEADERBOARD DATA...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#0A0F1A] text-[#E0E0E0] min-h-screen font-sans p-8">
        <section className="container mx-auto py-12 px-4">
          <h2 className="glitch-text text-5xl font-bold text-cyan-500 mb-12 text-center uppercase font-mono">
            GLOBAL LEADERBOARDS
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Top Songs */}
            <div className="bg-black/30 backdrop-blur-md border border-cyan-500/50 rounded-lg p-8 shadow-lg shadow-cyan-500/10 animate-fadeInUp">
              <h3 className="text-3xl font-bold text-white mb-6 text-center font-mono">
                TOP 20 SONGS BY LISTENING TIME
              </h3>
              {topSongs.length === 0 ? (
                <p className="text-cyan-300/70 text-lg text-center">
                  No songs data available.
                </p>
              ) : (
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
                  <ol className="list-decimal list-inside space-y-4">
                    {topSongs.map((song, index) => (
                      <li key={song.songId} className="bg-black/20 border border-cyan-700/50 rounded-lg p-4 flex justify-between items-center animate-slideDown" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex flex-col">
                          <p className="text-xl font-bold text-white">{song.Song?.name || 'Unknown Song'}</p>
                          <p className="text-cyan-300 text-md">by {song.Song?.artist?.name || 'Unknown Artist'}</p>
                        </div>
                        <p className="text-lg font-mono text-cyan-400">{formatTime(song.totalListenedMs)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Top Users */}
            <div className="bg-black/30 backdrop-blur-md border border-cyan-500/50 rounded-lg p-8 shadow-lg shadow-cyan-500/10 animate-fadeInUp">
              <h3 className="text-3xl font-bold text-white mb-6 text-center font-mono">
                TOP 20 USERS BY TOTAL LISTENING TIME
              </h3>
              {topUsers.length === 0 ? (
                <p className="text-cyan-300/70 text-lg text-center">
                  No user data available.
                </p>
              ) : (
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
                  <ol className="list-decimal list-inside space-y-4">
                    {topUsers.map((user, index) => (
                      <li key={user.userId} className="bg-black/20 border border-cyan-700/50 rounded-lg p-4 flex justify-between items-center animate-slideDown" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex items-center gap-4">
                          <img
                            src={user.User?.profilePicture || 'https://ipac.svkkl.cz/arl-kl/en/csg/?repo=klrepo&key=52084842018'}
                            alt="User Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400"
                          />
                          <div className="flex flex-col">
                            <p className="text-xl font-bold text-white">{user.User?.firstname} {user.User?.lastname}</p>
                            <p className="text-cyan-300 text-md">{user.User?.email}</p>
                          </div>
                        </div>
                        <p className="text-lg font-mono text-cyan-400">{formatTime(user.totalListenedMs)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Leaderboard;