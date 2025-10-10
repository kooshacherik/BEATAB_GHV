// client/src/pages/ArtistProfile.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatTime = (ms) => {
    const value = parseInt(ms, 10);
    if (isNaN(value) || value <= 0) return '00:00';

    const totalSeconds = Math.floor(value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleApiError = useCallback((err, defaultMessage) => {
    console.error(defaultMessage, err);
    setError(err);
    toast.error(err.response?.data?.message || defaultMessage);
    if (err.response?.status === 404) {
      navigate('/not-found');
    }
  }, [navigate]);

  const fetchArtistData = useCallback(async () => {
    if (!id) {
      console.error("ArtistProfile: No artist ID found in URL parameters. Redirecting.");
      toast.error("Artist ID missing from the URL. Please navigate from a valid artist link.");
      navigate('/');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const artistRes = await axios.get(`/api/artists/${id}`, { withCredentials: true });
      setArtist(artistRes.data);

      const songsRes = await axios.get(`/api/artists/${id}/songs/playcounts`, { withCredentials: true });
      setSongs(songsRes.data || []);
    } catch (err) {
      handleApiError(err, 'Failed to fetch artist data.');
    } finally {
      setLoading(false);
    }
  }, [id, handleApiError, navigate]);

  useEffect(() => {
    fetchArtistData();
  }, [fetchArtistData]);

  if (loading) {
    return (
      <div className="bg-[#0A0F1A] min-h-screen flex items-center justify-center">
        <p className="text-cyan-400 text-xl glitch-text">LOADING ARTIST DATA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0A0F1A] min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-xl">Error loading artist profile: {error.message || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="bg-[#0A0F1A] min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-xl">Artist not found.</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#0A0F1A] text-[#E0E0E0] min-h-screen font-sans p-8">
        <section className="container mx-auto py-12 px-4">
          <h2 className="glitch-text text-5xl font-bold text-cyan-500 mb-12 text-center uppercase font-mono">
            ARTIST PROFILE
          </h2>
          <div className="bg-black/30 backdrop-blur-md border border-cyan-500/50 rounded-lg p-8 shadow-lg shadow-cyan-500/10 max-w-4xl mx-auto animate-fadeInUp">
            <div className="flex flex-col items-center mb-8">
              <img
                src={artist.image || 'https://via.placeholder.com/150/00FFFF/000000?text=Artist'}
                alt={artist.name}
                className="w-48 h-48 rounded-full object-cover border-4 border-cyan-400 shadow-md mb-4"
              />
              <h3 className="text-4xl font-bold text-white mb-2">{artist.name}</h3>
              {artist.link && (
                <a
                  href={artist.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-100 transition-colors duration-300"
                >
                  Visit Artist Page
                </a>
              )}
            </div>
            <div className="mt-12 pt-8 border-t border-cyan-800/50">
              <h3 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">SONGS BY {artist.name.toUpperCase()}</h3>
              {songs.length === 0 ? (
                <p className="text-cyan-300/70 text-lg">No songs available for this artist.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto scrollbar-thin pr-2">
                  <table className="min-w-full table-auto text-left text-cyan-200">
                    <thead>
                      <tr className="border-b border-cyan-700">
                        <th className="py-2 px-4">Song Title</th>
                        <th className="py-2 px-4">Total Listened Time</th>
                        <th className="py-2 px-4">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {songs.map((song) => (
                        <tr key={song.id} className="border-b border-cyan-900 last:border-b-0 hover:bg-black/10">
                          <td className="py-2 px-4">{song.name}</td>
                          <td className="py-2 px-4">{formatTime(song.totalListenedMs)}</td>
                          <td className="py-2 px-4">
                            {song.link ? (
                              <a
                                href={song.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-200 transition-colors duration-300"
                              >
                                Listen/Watch
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

export default ArtistProfile;