// models/PostgreSQL_AllModels.js

import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../config/PostgreSQL_db.js';

/**
 * USER
 * - Keeps your existing fields
 * - Adds:
 *    - history: array of Song IDs a user has played (simple array)
 *    - playlists: array of arrays of Song IDs (stored as JSON for nested arrays)
 */
class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    firstname: { type: DataTypes.STRING, allowNull: false },
    lastname: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, defaultValue: '+94722526652' },
    profilePicture: {
      type: DataTypes.STRING,
      defaultValue: 'https://ipac.svkkl.cz/arl-kl/en/csg/?repo=klrepo&key=52084842018',
    },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' },
    // Array of song IDs representing the user play history
    history: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: [],
      comment: 'Array of song IDs representing the user play history',
    },
    // Array of playlists; each playlist is an object { name: String, songIds: Array<Integer> }
    splaylists: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      // The comment now reflects the new structure:
      comment: 'Array of playlists; each playlist is an object { name: String, songIds: Array<Integer> }',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);

/**
 * ARTIST
 * - Fields: id, name, link, image
 * - Association: Artist hasMany Songs
 */
class Artist extends Model {}

Artist.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }, // (optional) add unique: true if you want strict uniqueness at DB level
    link: { type: DataTypes.STRING, allowNull: true },
    image: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Artist',
    tableName: 'artists',
    timestamps: true,
  }
);

/**
 * SONG
 * - Fields: id, name, artistId (FK), duration, link, type
 * - Association:
 *    - Song belongsTo Artist (via artistId)
 *    - Song belongsToMany User via UserSongPlay
 */
class Song extends Model {}

Song.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds',
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // enforce uniqueness by link
    },
    audio_file_link: {
      type: DataTypes.STRING,
      allowNull: true,

    },
    type: { type: DataTypes.STRING, allowNull: true },
    artistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Artist, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
  },
  {
    sequelize,
    modelName: 'Song',
    tableName: 'songs',
    timestamps: true,
    indexes: [
      { fields: ['artistId'] },
      { fields: ['name'] },
      { unique: true, fields: ['link'] },
    ],
  }
);

/**
 * JOIN TABLE: UserSongPlay
 * - Captures plays (many-to-many)
 * - playedAt gives ordering/history semantics.
 */
const UserSongPlay = sequelize.define(
  'UserSongPlay',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    songId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Song, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    playedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    },
    listenedMs: {
      type: DataTypes.BIGINT, // Using BIGINT for milliseconds
      allowNull: false,
      defaultValue: 0,
      comment: 'Total milliseconds listened during this play session across all plays',
    },
  },
  {
    tableName: 'user_song_plays',
    timestamps: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['songId'] },
      { fields: ['playedAt'] },
      { unique: true, fields: ['userId', 'songId'] }, // Ensure uniqueness for userId and songId to make accumulation easier
    ],
  }
);

// ASSOCIATIONS
Artist.hasMany(Song, {
  foreignKey: 'artistId',
  as: 'songs',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

Song.belongsTo(Artist, {
  foreignKey: 'artistId',
  as: 'artist',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

// User <-> Song via plays
User.belongsToMany(Song, {
  through: UserSongPlay,
  as: 'playedSongs',
  foreignKey: 'userId',
  otherKey: 'songId',
});

Song.belongsToMany(User, {
  through: UserSongPlay,
  as: 'listeners',
  foreignKey: 'songId',
  otherKey: 'userId',
});
Song.hasMany(UserSongPlay, { foreignKey: 'songId', as: 'SongPlays' });

// Bind for includes on play queries
if (!UserSongPlay.associations.User) {
  UserSongPlay.belongsTo(User, { foreignKey: 'userId', as: 'User' });
}

if (!UserSongPlay.associations.Song) {
  UserSongPlay.belongsTo(Song, { foreignKey: 'songId', as: 'Song' });
}

export { User, Artist, Song, UserSongPlay };