//routes/PostgreSQLRoutes.js
import express from 'express';
import {
  // User Controllers
  listUsers, getUserById, updateUser, deleteUser, verifyUser,
  // User History
  getUserHistory, setUserHistory, appendUserHistory, clearUserHistory,
  // User Playlists
  getUserPlaylists, setUserPlaylists, createPlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist, reorderPlaylist,
  // Artist Controllers
  createArtist, listArtists, getArtistById, updateArtist, deleteArtist,
  // Song Controllers
  createSong, listSongs, getSongById, updateSong, deleteSong, getSongListeners,
  // Play Controllers
  recordPlay, accumulatePlayTime, getUserPlayedSongs, getSongPlays,
  // Admin Sync Beats
  syncBeats, syncBeatsController, getArtistSongsWithPlayCounts,  getTopSongsByListeningTime, // Add this
  getTopUsersByListeningTime, // Add this
} from '../controllers/PostgreSQLControllerS.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (if any) - no authMiddleware
// Example: router.get('/songs', listSongs);

// Apply authMiddleware to all routes that require authentication
// For example, all POST, PUT, PATCH, DELETE operations, and specific GET operations

// For /api/artists: All artist management routes likely need authentication
router.post('/artists', authMiddleware, createArtist);
router.get('/artists', authMiddleware, listArtists); // If listing artists requires authentication
router.get('/artists/:id', authMiddleware, getArtistById);
router.patch('/artists/:id', authMiddleware, updateArtist);
router.delete('/artists/:id', authMiddleware, deleteArtist);
// Artist-specific songs with play counts
router.get('/artists/:id/songs/playcounts', authMiddleware, getArtistSongsWithPlayCounts);

// For /api/songs: All song management routes likely need authentication
router.post('/songs', authMiddleware, createSong);
router.get('/songs', authMiddleware, listSongs); // If listing songs requires authentication
router.get('/songs/:id', authMiddleware, getSongById);
router.patch('/songs/:id', authMiddleware, updateSong);
router.delete('/songs/:id', authMiddleware, deleteSong);
router.get('/songs/:id/listeners', authMiddleware, getSongListeners);

// For /api/songs/sync-beats: This endpoint specifically requires admin role, handled within syncBeats
// The authMiddleware will verify the token first, then syncBeats will check for admin role
router.post('/songs/sync-beats', authMiddleware, syncBeats);

router.post('/admin/sync-beats', authMiddleware, syncBeatsController);

// User management routes (example, adjust as needed)
router.get('/users', authMiddleware, listUsers);
router.get('/users/verify', authMiddleware, verifyUser);
router.get('/users/:id', authMiddleware, getUserById);
router.patch('/users/:id', authMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, deleteUser);

// User history routes
router.get('/users/:id/history', authMiddleware, getUserHistory);
router.post('/users/:id/history', authMiddleware, setUserHistory);
router.post('/users/:id/history/append', authMiddleware, appendUserHistory); // This will be used for listenedMs and history
router.delete('/users/:id/history', authMiddleware, clearUserHistory);

// User playlist routes - UPDATED TO USE NAME INSTEAD OF INDEX
router.get('/users/:id/playlists', authMiddleware, getUserPlaylists);
router.put('/users/:id/playlists', authMiddleware, setUserPlaylists); // For updating entire playlist array
router.post('/users/:id/playlists', authMiddleware, createPlaylist);
router.delete('/users/:id/playlists/:name', authMiddleware, deletePlaylist); // Use playlist name
router.post('/users/:id/playlists/:name/add', authMiddleware, addSongToPlaylist); // Use playlist name
router.post('/users/:id/playlists/:name/remove', authMiddleware, removeSongFromPlaylist); // Use playlist name
router.post('/users/:id/playlists/:name/reorder', authMiddleware, reorderPlaylist); // Use playlist name

// User Song Play routes
router.post('/plays', authMiddleware, recordPlay);
router.post('/plays/accumulate', authMiddleware, accumulatePlayTime);
router.get('/plays/users/:userId', authMiddleware, getUserPlayedSongs);
router.get('/plays/songs/:songId', authMiddleware, getSongPlays);
// Leaderboard routes
// Leaderboard routes
router.get('/plays/leaderboard/songs', authMiddleware, getTopSongsByListeningTime);
router.get('/plays/leaderboard/users', authMiddleware, getTopUsersByListeningTime);


export default router;