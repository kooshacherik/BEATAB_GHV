import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse';
import { Artist, Song } from '../models/PostgreSQL_AllModels.js'; // Adjust this path based on your actual project structure
import sequelize from '../config/PostgreSQL_db.js'; // Assuming you have a sequelize instance configured here

const BEATS_DIR = path.resolve(process.cwd(), '../client/public/beat_s');
const CSV_PATH = path.resolve(process.cwd(), 'youtube_video_info.csv');

/**
 * Converts a duration string (e.g., "MM:SS" or "HH:MM:SS") to total seconds.
 * @param {string} durationStr - The duration string.
 * @returns {number|null} Total seconds or null if invalid.
 */
const parseDurationToSeconds = (durationStr) => {
  if (!durationStr || typeof durationStr !== 'string') return null;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) { // MM:SS
    const [minutes, seconds] = parts;
    if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) return null;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) { // HH:MM:SS
    const [hours, minutes, seconds] = parts;
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || hours < 0 || minutes < 0 || seconds < 0 || minutes >= 60 || seconds >= 60) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return null;
};

/**
 * Reads and parses the youtube_video_info.csv file.
 * @returns {Promise<Array<Object>>} An array of objects representing CSV rows.
 */
const readCsvData = async () => {
  try {
    const fileContent = await fs.readFile(CSV_PATH, { encoding: 'utf8' });
    return new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true, // Treat the first row as headers
        skip_empty_lines: true,
        trim: true,
      }, (err, records) => {
        if (err) {
          console.error(`CSV parsing error: ${err.message}`);
          return reject(err);
        }
        resolve(records);
      });
    });
  } catch (error) {
    console.error(`Error reading or parsing CSV file at ${CSV_PATH}:`, error.message);
    return [];
  }
};

/**
 * Normalizes a string for consistent comparison (e.g., for artist/song names).
 * Converts to lowercase, replaces non-alphanumeric (except spaces) with spaces,
 * collapses multiple spaces to a single space, trims, and converts to Title Case.
 * This is designed to make "My Song" match "my   song" and "My_Song".
 * @param {string} str - The input string.
 * @returns {string} The normalized string.
 */
const normalizeName = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .replace(/[_-]+/g, ' ')             // Replace underscores/hyphens with spaces
        .replace(/[^a-zA-Z0-9\s]/g, '')     // Remove all non-alphanumeric characters except spaces
        .replace(/\s+/g, ' ')               // Collapse multiple spaces into a single space
        .trim()                             // Trim leading/trailing whitespace
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Synchronizes beat information from the filesystem and CSV to the database.
 * @returns {Promise<{success: boolean, message: string, summary?: object, error?: string}>} Synchronization result.
 */
export const syncBeatsToDatabase = async () => {
  console.log('Starting beat synchronization...');
  let transaction;
  let artistsCreated = 0;
  let artistsUpdated = 0;
  let songsCreated = 0;
  let songsUpdated = 0;
  const syncErrors = [];

  try {
    // 1. Read and pre-process CSV Data
    const csvRecords = await readCsvData();
    const artistCsvMap = new Map(); // Map: { normalizedArtistName -> { artistLink, songs: { normalizedSongName -> record } } }
    const artistLinkMap = new Map(); // Map: { artistLink -> normalizedArtistName } for quick reverse lookup

    csvRecords.forEach(record => {
      const artistNameFromCsv = record['Artist Name'];
      const videoTitleFromCsv = record['Video Title'];
      const artistLinkFromCsv = record['Artist Link'];

      if (!artistNameFromCsv || !videoTitleFromCsv) {
        console.warn(`Skipping CSV record due to missing data: Artist Name "${artistNameFromCsv}", Video Title "${videoTitleFromCsv}"`);
        return;
      }

      const normalizedArtistNameFromCsv = normalizeName(artistNameFromCsv);
      const normalizedVideoTitleFromCsv = normalizeName(videoTitleFromCsv);

      if (artistLinkFromCsv) {
        artistLinkMap.set(artistLinkFromCsv, normalizedArtistNameFromCsv);
      }

      if (!artistCsvMap.has(normalizedArtistNameFromCsv)) {
        artistCsvMap.set(normalizedArtistNameFromCsv, {
          artistLink: artistLinkFromCsv, // Store the first link found for this normalized name
          songs: new Map()
        });
      }
      // If a link is found later for the same normalized artist name, update it if the current one is null
      if (!artistCsvMap.get(normalizedArtistNameFromCsv).artistLink && artistLinkFromCsv) {
        artistCsvMap.get(normalizedArtistNameFromCsv).artistLink = artistLinkFromCsv;
      }
      artistCsvMap.get(normalizedArtistNameFromCsv).songs.set(normalizedVideoTitleFromCsv, record);
    });

    transaction = await sequelize.transaction();

    // 2. Process Filesystem Data
    const artistFolders = await fs.readdir(BEATS_DIR, { withFileTypes: true });

    for (const artistDirent of artistFolders) {
      if (artistDirent.isDirectory()) {
        const rawArtistName = artistDirent.name;
        const normalizedArtistName = normalizeName(rawArtistName);
        const artistFolderPath = path.join(BEATS_DIR, rawArtistName);
        const artistImagePath = `/assets/beat_s/${rawArtistName}/${rawArtistName}.jpg`; // Client-relative path

        // Get artist details from CSV (using normalized name for lookup)
        const artistCsvData = artistCsvMap.get(normalizedArtistName);
        const artistLink = artistCsvData ? artistCsvData.artistLink : null;

        let artist = null;
        let created = false;

        // Try to find by link first for robust duplication prevention
        if (artistLink) {
          artist = await Artist.findOne({ where: { link: artistLink }, transaction });
        }

        // If not found by link, or no link was available, try to find by name
        if (!artist) {
          artist = await Artist.findOne({ where: { name: normalizedArtistName }, transaction });
        }

        // If still not found, create a new artist
        if (!artist) {
          artist = await Artist.create({
            name: normalizedArtistName,
            link: artistLink,
            image: artistImagePath
          }, { transaction });
          created = true;
          artistsCreated++;
          console.log(`Created new artist: ${normalizedArtistName} (Link: ${artistLink || 'N/A'})`);
        } else {
          // If artist found, update if necessary
          let updated = false;

          // Always ensure the name is consistent with the normalized name from filesystem/CSV
          if (artist.name !== normalizedArtistName) {
            artist.name = normalizedArtistName;
            updated = true;
          }

          // If a link is now available from CSV and the artist doesn't have one, update it
          if (artistLink && !artist.link) {
            artist.link = artistLink;
            updated = true;
          } else if (artistLink && artist.link !== artistLink) {
             // If there's a link in CSV and it's different, decide which one to trust. 
             // For now, let's prioritize the link from CSV if it exists.
             artist.link = artistLink;
             updated = true;
          }

          if (artistImagePath && artist.image !== artistImagePath) {
            artist.image = artistImagePath;
            updated = true;
          }

          if (updated) {
            await artist.save({ transaction });
            artistsUpdated++;
            console.log(`Updated existing artist: ${normalizedArtistName}`);
          }
        }

        const songFiles = await fs.readdir(artistFolderPath, { withFileTypes: true });

        for (const fileDirent of songFiles) {
          if (fileDirent.isFile() && fileDirent.name.endsWith('.mp3')) {
            const songFilename = fileDirent.name;
            const rawSongNameFromFile = songFilename.replace(/\.[^/.]+$/, ''); // Remove file extension
            const normalizedSongNameFromFile = normalizeName(rawSongNameFromFile);
            const songLinkRelative = `/beat_s/${rawArtistName}/${songFilename}`; // Link for player

            // Find song details from CSV records
            const songCsvRecord = artistCsvData ? artistCsvData.songs.get(normalizedSongNameFromFile) : null;

            if (songCsvRecord) {
              const videoURL = songCsvRecord['Video URL'];
              const durationStr = songCsvRecord['Duration'];
              const parsedDuration = parseDurationToSeconds(durationStr);

              // Create or update song
              const [song, songCreated] = await Song.findOrCreate({
                where: { link: videoURL }, // videoURL is a strong unique identifier for songs
                defaults: {
                  name: normalizedSongNameFromFile, // Store normalized name in DB
                  artistId: artist.id,
                  duration: parsedDuration,
                  link: videoURL, // This is the YouTube link
                  audio_file_link: songLinkRelative, // This is the local audio file link
                  type: 'mp3'
                },
                transaction
              });

              if (songCreated) {
                songsCreated++;
                console.log(`Created new song: ${normalizedSongNameFromFile} by ${normalizedArtistName}`);
              } else {
                let updated = false;
                if (song.name !== normalizedSongNameFromFile) {
                  song.name = normalizedSongNameFromFile;
                  updated = true;
                }
                if (parsedDuration !== null && song.duration !== parsedDuration) {
                  song.duration = parsedDuration;
                  updated = true;
                }
                 if (song.audio_file_link !== songLinkRelative) {
                  song.audio_file_link = songLinkRelative;
                  updated = true;
                }

                if (updated) {
                  await song.save({ transaction });
                  songsUpdated++;
                  console.log(`Updated existing song: ${normalizedSongNameFromFile} by ${normalizedArtistName}`);
                }
              }
            } else {
              console.warn(`Song "${rawSongNameFromFile}" by "${rawArtistName}" not found in youtube_video_info.csv. Skipping.`);
              syncErrors.push(`Song "${rawSongNameFromFile}" by "${rawArtistName}" not found in CSV.`);
            }
          }
        }
      }
    }

    await transaction.commit();
    console.log('Beat synchronization completed successfully.');
    return {
      success: true,
      message: 'Beats synchronization complete',
      summary: {
        artistsCreated,
        artistsUpdated,
        songsCreated,
        songsUpdated,
        errors: syncErrors.length,
        warnings: syncErrors,
      },
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Error during beat synchronization:', error.message, error.stack);
    return {
      success: false,
      message: 'Failed to synchronize beats.',
      error: error.message,
      detailedError: error.stack,
    };
  }
};