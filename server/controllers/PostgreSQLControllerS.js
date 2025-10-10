// controllers/PostgreSQLControllerS.js
import { syncBeatsToDatabase } from '../services/beatSyncService.js';
import { User, Artist, Song, UserSongPlay } from '../models/PostgreSQL_AllModels.js';
import { Op, Sequelize } from 'sequelize';
import sequelize from '../config/PostgreSQL_db.js';

// Helper to normalize URLs - consistent with frontend
const normalizeLink = (url) => {
  try {
    const u = new URL(url, 'http://local.test'); // Use a base URL for robust parsing
    return `${u.pathname}${u.search || ''}`;
  } catch (error) {
    console.warn('Invalid URL provided, returning trimmed string:', url, error);
    return String(url).trim();
  }
};

// -- User Controllers ---
export const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // Exclude passwords for security
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ message: 'Error listing users', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] } // Exclude password for security
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ message: 'Error getting user', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Exclude password from update if present in req.body for security reasons
    const { password, ...updateData } = req.body; 
    
    const [updated] = await User.update(updateData, { 
      where: { id },
      returning: true, // Return the updated object
    });
    
    if (updated === 0) { // Check if any row was updated
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    return res.status(200).json({ user: updatedUser });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id } });
    if (deleted) {
      return res.status(204).send(); // No content for successful deletion
    }
    return res.status(404).json({ message: 'User not found' }); // User not found to delete
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    // authMiddleware should have already set req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Exclude password from the response
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ message: 'Error verifying user', error: error.message });
  }
};

// -- User History ---
export const getUserHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const historySongIds = user.history || [];
    if (historySongIds.length === 0) {
      return res.status(200).json({ history: [] }); // Return empty array if no history
    }

    const historySongs = await Song.findAll({
      where: { id: { [Op.in]: historySongIds } },
      include: {
        model: Artist,
        as: 'artist',
        attributes: ['id', 'name'] // Include artist ID as well
      }
    });

    // Sort the songs to match the order in user.history
    const orderedHistory = historySongIds.map(songId =>
      historySongs.find(song => song.id === songId)
    ).filter(Boolean); // Filter out any songs not found

    res.status(200).json({ history: orderedHistory });
  } catch (error) {
    console.error('Error getting user history:', error);
    res.status(500).json({ message: 'Error getting user history', error: error.message });
  }
};

export const setUserHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { history } = req.body; // Expecting history as an array of song IDs
    
    if (!Array.isArray(history)) {
      return res.status(400).json({ message: 'History must be an array of song IDs' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.history = history;
    await user.save();
    res.status(200).json({ message: 'User history set successfully', history: user.history });
  } catch (error) {
    console.error('Error setting user history:', error);
    res.status(500).json({ message: 'Error setting user history', error: error.message });
  }
};

export const appendUserHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!songId) {
      return res.status(400).json({ message: 'songId is required' });
    }

    let currentHistory = user.history || [];
    // Ensure uniqueness and add to the beginning of the history
    currentHistory = [songId, ...currentHistory.filter(s => s !== songId)];
    
    // Limit history length, e.g., to the last 20 songs
    const MAX_HISTORY_LENGTH = 20; 
    if (currentHistory.length > MAX_HISTORY_LENGTH) {
      currentHistory = currentHistory.slice(0, MAX_HISTORY_LENGTH);
    }
    
    user.history = currentHistory;
    await user.save(); // Save the updated history
    res.status(200).json({ message: 'Song added to history', history: user.history });
  } catch (error) {
    console.error('Error appending song to user history:', error);
    res.status(500).json({ message: 'Error appending song to history', error: error.message });
  }
};

export const clearUserHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.history = [];
    await user.save();
    res.status(200).json({ message: 'User history cleared' });
  } catch (error) {
    console.error('Error clearing user history:', error);
    res.status(500).json({ message: 'Error clearing user history', error: error.message });
  }
};

// -- User Playlists ---
export const getUserPlaylists = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const rawPlaylists = user.splaylists || [];
    const playlistsWithSongs = [];

    for (const playlist of rawPlaylists) {
      if (playlist.songIds && playlist.songIds.length > 0) {
        const playlistSongs = await Song.findAll({
          where: { id: { [Op.in]: playlist.songIds } },
          include: {
            model: Artist,
            as: 'artist',
            attributes: ['id', 'name'] // Include artist ID
          }
        });

        // Sort songs in the playlist to maintain the original order
        const orderedPlaylistSongs = playlist.songIds.map(songId =>
          playlistSongs.find(song => song.id === songId)
        ).filter(Boolean);

        playlistsWithSongs.push({
          ...playlist,
          songs: orderedPlaylistSongs
        });
      } else {
        playlistsWithSongs.push({
          ...playlist,
          songs: []
        });
      }
    }
    res.status(200).json({ playlists: playlistsWithSongs });
  } catch (error) {
    console.error('Error getting user playlists:', error);
    res.status(500).json({ message: 'Error getting user playlists', error: error.message });
  }
};

export const setUserPlaylists = async (req, res) => {
  try {
    const { id } = req.params;
    const { playlists } = req.body; // Expecting an array of playlist objects { name, songIds }

    if (!Array.isArray(playlists)) {
      return res.status(400).json({ message: 'Playlists must be an array' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.splaylists = playlists; // Directly assign the new array
    user.changed('splaylists', true); // Explicitly mark splaylists as changed for Sequelize JSONB update
    await user.save();
    res.status(200).json({ message: 'User playlists updated successfully', playlists: user.splaylists });
  } catch (error) {
    console.error('Error setting user playlists:', error);
    res.status(500).json({ message: 'Error setting user playlists', error: error.message });
  }
};

export const createPlaylist = async (req, res) => {
  try {
    const { id } = req.params; // User ID
    const { name, songIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Playlist name is required' });
    }
    if (songIds && !Array.isArray(songIds)) {
      return res.status(400).json({ message: 'songIds must be an array' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentPlaylists = user.splaylists || [];
    if (currentPlaylists.some(p => p.name === name)) {
      return res.status(409).json({ message: `Playlist with name '${name}' already exists.` });
    }

    const newPlaylist = { name, songIds: songIds || [] };
    const updatedPlaylists = [...currentPlaylists, newPlaylist];
    user.splaylists = updatedPlaylists;
    user.changed('splaylists', true);
    await user.save();
    res.status(201).json({ message: 'Playlist created successfully', playlist: newPlaylist, playlists: updatedPlaylists });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Error creating playlist', error: error.message });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const { id, name } = req.params; // user ID and playlist name
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentPlaylists = user.splaylists || [];
    const updatedPlaylists = currentPlaylists.filter(p => p.name !== name);

    if (updatedPlaylists.length === currentPlaylists.length) {
      return res.status(404).json({ message: `Playlist '${name}' not found.` });
    }

    user.splaylists = updatedPlaylists;
    user.changed('splaylists', true);
    await user.save();
    res.status(200).json({ message: `Playlist '${name}' deleted successfully`, playlists: updatedPlaylists });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ message: 'Error deleting playlist', error: error.message });
  }
};

export const addSongToPlaylist = async (req, res) => {
  try {
    const { id, name } = req.params; // user ID and playlist name
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ message: 'songId is required' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentPlaylists = user.splaylists || [];
    const playlistIndex = currentPlaylists.findIndex(p => p.name === name);

    if (playlistIndex === -1) {
      return res.status(404).json({ message: `Playlist '${name}' not found.` });
    }

    const playlist = currentPlaylists[playlistIndex];
    if (playlist.songIds.includes(songId)) {
      return res.status(409).json({ message: 'Song already in playlist.' });
    }

    playlist.songIds.push(songId);
    // currentPlaylists[playlistIndex] = playlist; // This line is not strictly needed as playlist is a reference
    user.splaylists = currentPlaylists; // Reassign to trigger change detection
    user.changed('splaylists', true);
    await user.save();
    res.status(200).json({ message: 'Song added to playlist', playlist: playlist });
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({ message: 'Error adding song to playlist', error: error.message });
  }
};

export const removeSongFromPlaylist = async (req, res) => {
  try {
    const { id, name } = req.params; // user ID and playlist name
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ message: 'songId is required' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentPlaylists = user.splaylists || [];
    const playlistIndex = currentPlaylists.findIndex(p => p.name === name);

    if (playlistIndex === -1) {
      return res.status(404).json({ message: `Playlist '${name}' not found.` });
    }

    const playlist = currentPlaylists[playlistIndex];
    const initialSongCount = playlist.songIds.length;
    playlist.songIds = playlist.songIds.filter(s => s !== songId);

    if (playlist.songIds.length === initialSongCount) {
      return res.status(404).json({ message: 'Song not found in playlist.' });
    }

    // currentPlaylists[playlistIndex] = playlist; // Not strictly needed
    user.splaylists = currentPlaylists; // Reassign
    user.changed('splaylists', true);
    await user.save();
    res.status(200).json({ message: 'Song removed from playlist', playlist: playlist });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    res.status(500).json({ message: 'Error removing song from playlist', error: error.message });
  }
};

export const reorderPlaylist = async (req, res) => {
  try {
    const { id, name } = req.params; // user ID and playlist name
    const { newSongIds } = req.body; // Expecting an array of song IDs in the new order

    if (!Array.isArray(newSongIds)) {
      return res.status(400).json({ message: 'newSongIds must be an array' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentPlaylists = user.splaylists || [];
    const playlistIndex = currentPlaylists.findIndex(p => p.name === name);

    if (playlistIndex === -1) {
      return res.status(404).json({ message: `Playlist '${name}' not found.` });
    }

    const playlist = currentPlaylists[playlistIndex];
    // Optional: Validate if all newSongIds actually exist as songs in the database
    // This can prevent issues with non-existent song references
    // For brevity, skipping this validation here but recommended for production.

    playlist.songIds = newSongIds; // Assign the new ordered array
    // currentPlaylists[playlistIndex] = playlist; // Not strictly needed
    user.splaylists = currentPlaylists; // Reassign
    user.changed('splaylists', true);
    await user.save();
    res.status(200).json({ message: 'Playlist reordered successfully', playlist: playlist });
  } catch (error) {
    console.error('Error reordering playlist:', error);
    res.status(500).json({ message: 'Error reordering playlist', error: error.message });
  }
};

// -- Artist Controllers ---
export const createArtist = async (req, res) => {
  try {
    const { name, link, image } = req.body;
    // Optional: Check for existing artist by name to prevent duplicates
    const existingArtist = await Artist.findOne({ where: { name } });
    if (existingArtist) {
      return res.status(409).json({ message: 'Artist with this name already exists' });
    }
    const artist = await Artist.create({ name, link, image });
    res.status(201).json(artist);
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ message: 'Error creating artist', error: error.message });
  }
};

export const listArtists = async (req, res) => {
  try {
    const artists = await Artist.findAll();
    res.status(200).json(artists);
  } catch (error) {
    console.error('Error listing artists:', error);
    res.status(500).json({ message: 'Error listing artists', error: error.message });
  }
};

export const getArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findByPk(id, { include: { model: Song, as: 'songs' } });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(200).json(artist);
  } catch (error) {
    console.error('Error getting artist by ID:', error);
    res.status(500).json({ message: 'Error getting artist', error: error.message });
  }
};

export const updateArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Artist.update(req.body, { 
      where: { id },
      returning: true, // Return the updated object
    });
    
    if (updated === 0) {
      return res.status(404).json({ message: 'Artist not found or no changes made' });
    }
    
    const updatedArtist = await Artist.findByPk(id);
    return res.status(200).json(updatedArtist);
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ message: 'Error updating artist', error: error.message });
  }
};

export const deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Artist.destroy({ where: { id } });
    if (deleted) {
      return res.status(204).send();
    }
    return res.status(404).json({ message: 'Artist not found' });
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({ message: 'Error deleting artist', error: error.message });
  }
};

// -- Song Controllers ---
export const createSong = async (req, res) => {
  try {
    const { name, artistId, duration, link, audio_file_link, type } = req.body;
    
    // Validate required fields
    if (!name || !artistId || (!link && !audio_file_link)) {
      return res.status(400).json({ message: 'Missing required song fields: name, artistId, and either link or audio_file_link' });
    }

    const normalizedLink = link ? normalizeLink(link) : audio_file_link;

    // Check if song with the same link already exists
    const existingSong = await Song.findOne({ where: { link: normalizedLink } });
    if (existingSong) {
      return res.status(409).json({ message: 'Song with this link already exists' });
    }

    const song = await Song.create({ 
      name, 
      artistId, 
      duration, 
      link: normalizedLink, 
      audio_file_link, // Store audio_file_link if provided
      type 
    });
    res.status(201).json(song);
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({ message: 'Error creating song', error: error.message });
  }
};

export const listSongs = async (req, res) => {
  try {
    const songs = await Song.findAll({ include: { model: Artist, as: 'artist', attributes: ['id', 'name'] } }); // Include artist ID
    res.status(200).json(songs);
  } catch (error) {
    console.error('Error listing songs:', error);
    res.status(500).json({ message: 'Error listing songs', error: error.message });
  }
};

export const getSongById = async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findByPk(id, { include: { model: Artist, as: 'artist', attributes: ['id', 'name'] } }); // Include artist ID
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.status(200).json(song);
  } catch (error) {
    console.error('Error getting song by ID:', error);
    res.status(500).json({ message: 'Error getting song', error: error.message });
  }
};

export const updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const { link, ...updateData } = req.body;
    if (link) {
      updateData.link = normalizeLink(link);
    }
    const [updated] = await Song.update(updateData, { 
      where: { id },
      returning: true, // Return the updated object
    });
    
    if (updated === 0) {
      return res.status(404).json({ message: 'Song not found or no changes made' });
    }
    
    const updatedSong = await Song.findByPk(id);
    return res.status(200).json(updatedSong);
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ message: 'Error updating song', error: error.message });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Song.destroy({ where: { id } });
    if (deleted) {
      return res.status(204).send();
    }
    return res.status(404).json({ message: 'Song not found' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ message: 'Error deleting song', error: error.message });
  }
};

export const getSongListeners = async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findByPk(id, {
      include: {
        model: UserSongPlay,
        as: 'SongPlays', // Use the correct alias as defined in PostgreSQL_AllModels.js
        attributes: ['userId', 'listenedMs', 'playedAt'],
        include: { model: User, as: 'User', attributes: ['id', 'firstname', 'lastname', 'email'] }
      }
    });
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    // Return only the UserSongPlay entries, not the full song object
    res.status(200).json(song.SongPlays); 
  } catch (error) {
    console.error('Error getting song listeners:', error);
    res.status(500).json({ message: 'Error getting song listeners', error: error.message });
  }
};

// -- Play Controllers ---
export const recordPlay = async (req, res) => {
  try {
    const { userId, songId } = req.body;
    
    if (!userId || !songId) {
      return res.status(400).json({ message: 'userId and songId are required' });
    }

    const [play, created] = await UserSongPlay.findOrCreate({
      where: { userId, songId },
      defaults: { listenedMs: 0, playedAt: new Date() }
    });

    if (!created) {
      await play.update({ playedAt: new Date() }); // Update playedAt for existing entries
    }
    res.status(200).json({ message: 'Play recorded/updated', play });
  } catch (error) {
    console.error('Error recording play:', error);
    res.status(500).json({ message: 'Error recording play', error: error.message });
  }
};

export const accumulatePlayTime = async (req, res) => {
  try {
    const { userId, songId, deltaMs } = req.body;
    if (!userId || !songId || typeof deltaMs !== 'number' || deltaMs <= 0) {
      return res.status(400).json({ message: 'userId, songId, and a positive deltaMs are required' });
    }

    const [userSongPlay, created] = await UserSongPlay.findOrCreate({
      where: { userId, songId },
      defaults: {
        listenedMs: deltaMs,
        playedAt: new Date()
      }
    });

    if (!created) {
      userSongPlay.listenedMs = Number(userSongPlay.listenedMs) + Number(deltaMs);
      await userSongPlay.save();
    }
    res.status(200).json({ message: 'Play time accumulated', userSongPlay });
  } catch (error) {
    console.error('Error accumulating play time:', error);
    res.status(500).json({ message: 'Error accumulating play time', error: error.message });
  }
};

export const getUserPlayedSongs = async (req, res) => {
  try {
    const { userId } = req.params;
    const userPlays = await UserSongPlay.findAll({
      where: { userId },
      include: [{
        model: Song,
        as: 'Song', // Correct alias
        include: { model: Artist, as: 'artist', attributes: ['id', 'name'] } // Include artist ID
      }],
      order: [['playedAt', 'DESC']]
    });
    res.status(200).json(userPlays);
  } catch (error) {
    console.error('Error getting user played songs:', error);
    res.status(500).json({ message: 'Error getting user played songs', error: error.message });
  }
};

export const getSongPlays = async (req, res) => {
  try {
    const { songId } = req.params;
    const songPlays = await UserSongPlay.findAll({
      where: { songId },
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'firstname', 'lastname', 'email'] // Include email
      }],
      order: [['playedAt', 'DESC']]
    });
    res.status(200).json(songPlays);
  } catch (error) {
    console.error('Error getting song plays:', error);
    res.status(500).json({ message: 'Error getting song plays', error: error.message });
  }
};

// -- Admin Sync Beats ---
export const syncBeats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    const { externalBeatData } = req.body;
    if (!Array.isArray(externalBeatData) || externalBeatData.length === 0) {
      return res.status(400).json({ message: 'externalBeatData must be a non-empty array' });
    }

    const transaction = await sequelize.transaction(); // Use sequelize.transaction() directly
    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];

    try {
      for (const beat of externalBeatData) {
        if (!beat.name || !beat.artistName || (!beat.link && !beat.audio_file_link)) {
          errors.push({ beat, error: 'Missing required fields for beat' });
          continue; // Skip to the next beat
        }

        const normalizedLink = beat.link ? normalizeLink(beat.link) : beat.audio_file_link;

        let artist = await Artist.findOne({ where: { name: beat.artistName }, transaction });
        if (!artist) {
          artist = await Artist.create({ name: beat.artistName }, { transaction });
        }

        const [song, created] = await Song.findOrCreate({
          where: { link: normalizedLink },
          defaults: {
            name: beat.name,
            artistId: artist.id,
            duration: beat.duration || 0, // Default duration to 0 if not provided
            type: beat.type || 'unknown', // Default type if not provided
            link: normalizedLink,
            audio_file_link: beat.audio_file_link || normalizedLink, // Ensure audio_file_link is set
          },
          transaction
        });

        if (!created) {
          await song.update({
            name: beat.name,
            artistId: artist.id,
            duration: beat.duration || song.duration,
            type: beat.type || song.type,
            audio_file_link: beat.audio_file_link || song.audio_file_link,
          }, { transaction });
          updatedCount++;
        } else {
          createdCount++;
        }
      }
      await transaction.commit();
      res.status(200).json({
        message: 'Beats synchronization complete',
        summary: { created: createdCount, updated: updatedCount, errors: errors.length, details: errors },
      });
    } catch (transactionError) {
      await transaction.rollback();
      console.error('Transaction failed during beats sync:', transactionError);
      res.status(500).json({ message: 'Beats synchronization failed due to transaction error', error: transactionError.message });
    }
  } catch (error) {
    console.error('Error syncing beats:', error);
    res.status(500).json({ message: 'Error syncing beats', error: error.message });
  }
};

export const syncBeatsController = async (req, res) => {
  // IMPORTANT: Implement authentication and authorization here.
  // For example, only allow authenticated admin users to trigger this sync.
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
  console.log('Admin requested beat synchronization.');
  try {
    const result = await syncBeatsToDatabase();
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(500).json({ message: result.message, error: result.error });
    }
  } catch (error) {
    console.error('Error in syncBeatsController:', error);
    res.status(500).json({ message: 'Internal server error during beat synchronization.', error: error.message });
  }
};

export const getArtistSongsWithPlayCounts = async (req, res) => {
  console.log('here_controllerS_getArtistSongsWithPlayCounts');

  try {
    const { id: artistId } = req.params;

    const artistSongs = await Song.findAll({
      where: { artistId: artistId },
      attributes: [
        'id',
        'name',
        'link',
        'audio_file_link',
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('SongPlays.listenedMs')), 0), 'totalListenedMs'],
      ],
      include: [
        {
          model: Artist,
          as: 'artist',
          attributes: ['id', 'name'],
        },
        {
          model: UserSongPlay,
          as: 'SongPlays', // Corrected alias to match model definition
          attributes: [],
          duplicating: false,
          required: false, // Use left join to include songs even if they have no plays
        },
      ],
      group: [
        'Song.id',
        'Song.name',
        'Song.link',
        'Song.audio_file_link',
        'artist.id',
        'artist.name'
      ], // Include all non-aggregated columns in GROUP BY
      order: [[Sequelize.literal('"totalListenedMs"'), 'DESC']],
    });
    res.status(200).json(artistSongs); // Changed 'songs' to 'artistSongs' for consistency
  } catch (error) {
    console.error('Error fetching artist songs with play counts:', error);
    res.status(500).json({ message: 'Error fetching artist songs with play counts', error: error.message });
  }
};

// --- Leaderboard Controllers ---
export const getTopSongsByListeningTime = async (req, res) => {
  try {
    const topSongs = await UserSongPlay.findAll({
      attributes: [
        'songId',
        [Sequelize.fn('SUM', Sequelize.col('listenedMs')), 'totalListenedMs'],
      ],
      group: ['songId', 'Song.id', 'Song.artist.id'], // Ensure all included model primary keys are in group
      order: [[Sequelize.literal('"totalListenedMs"'), 'DESC']],
      limit: 20,
      include: [{
        model: Song,
        as: 'Song',
        attributes: ['id', 'name', 'link', 'audio_file_link'], // Include audio_file_link
        include: { model: Artist, as: 'artist', attributes: ['id', 'name'] },
      }],
    });
    res.status(200).json({ topSongs });
  } catch (error) {
    console.error('Error fetching top songs by listening time:', error);
    res.status(500).json({ message: 'Error fetching top songs', error: error.message });
  }
};

export const getTopUsersByListeningTime = async (req, res) => {
  try {
    const topUsers = await UserSongPlay.findAll({
      attributes: [
        'userId',
        [Sequelize.fn('SUM', Sequelize.col('listenedMs')), 'totalListenedMs'],
      ],
      group: ['userId', 'User.id'], // Ensure all included model primary keys are in group
      order: [[Sequelize.literal('"totalListenedMs"'), 'DESC']],
      limit: 20,
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'firstname', 'lastname', 'profilePicture', 'email'],
      }],
    });
    res.status(200).json({ topUsers });
  } catch (error) {
    console.error('Error fetching top users by listening time:', error);
    res.status(500).json({ message: 'Error fetching top users', error: error.message });
  }
};