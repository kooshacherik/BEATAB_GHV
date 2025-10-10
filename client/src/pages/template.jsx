// client/src/pages/template.jsx

import PropTypes from "prop-types";
import { motion } from "framer-motion";
import axios from "axios";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Global Axios Configuration (keep consistent with App.jsx)
axios.defaults.withCredentials = true;

// Eagerly import all beat files and expose their URLs (local assets)
const beatModules = import.meta.glob("../assets/beat_s/*/*.mp3", {
  eager: true,
  as: "url",
});

// Sort beats for consistent ordering (local file paths)
const localBeats = Object.values(beatModules).sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
);

// Utility: classNames helper
const cx = (...classes) => classes.filter(Boolean).join(" ");

// Styling helpers (kept close to your existing style)
const getButtonClass = (active) =>
  cx(
    "relative px-4 py-2 text-white font-medium transition-all duration-200 text-sm",
    "tracking-wide uppercase font-mono",
    "border-b-2",
    active
      ? "bg-cyan-700/50 border-cyan-400 text-cyan-300 shadow-cyan-500/30"
      : "bg-gray-800/50 border-gray-600 hover:border-cyan-500 hover:text-cyan-200",
    "rounded-tl-md rounded-tr-md"
  );

const getSubButtonClass = (active) =>
  cx(
    "relative px-3 py-1 text-xs font-medium transition-all duration-200 uppercase tracking-wider font-mono",
    "border",
    active
      ? "bg-cyan-600 text-black border-cyan-500 shadow-lg shadow-cyan-500/20"
      : "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 hover:border-cyan-400",
    "rounded-sm"
  );

// Get display label for local beat URL
const getBeatLabelFromUrl = (url, index) => {
  try {
    const parts = url.split("/");
    const filename = parts.pop();
    const artistFolder = parts.pop(); // artist folder
    const base = filename.replace(/\.[^/.]+$/, "");
    const formattedArtist = artistFolder
      ? artistFolder
          .replace(/[_-]+/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : `Artist ${index + 1}`;
    const formattedSong = base
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `${formattedArtist} - ${formattedSong}`;
  } catch (error) {
    console.warn(`Error parsing beat label from URL "${url}": ${error.message}`);
    return `Beat ${index + 1}`;
  }
};

function MainTrain({
  onAudioChange,
  isPlayingAudio,
  toggleAudioPlayback,
  onBeatsReady = () => {},
  selectedAudio = null,
  panelLabel = "Beats",
  initialTab = "music",
  showPanel,
  setShowPanel,
  panelOffsetLeft,
  initialSongs = [],
  isSongsLoading = true,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();

  const [hasLoadedSongs, setHasLoadedSongs] = useState(false);
  // State to track which song is currently being activated/loaded locally
  const [activatingSongUrl, setActivatingSongUrl] = useState(null);

  useEffect(() => {
    if (!isSongsLoading && initialSongs.length > 0) {
      onBeatsReady?.(initialSongs.map((song) => song.audio_file_link || song.link));
      if (!hasLoadedSongs) {
        setHasLoadedSongs(true);
      }
    }
  }, [initialSongs, isSongsLoading, onBeatsReady, hasLoadedSongs]);

  // Effect to reset activatingSongUrl once the selectedAudio prop changes
  useEffect(() => {
    // If the selectedAudio is now the one we were activating, or if it changed to something else,
    // clear the activating state.
    if (activatingSongUrl && (selectedAudio === activatingSongUrl || selectedAudio !== null)) {
      setActivatingSongUrl(null);
    }
  }, [selectedAudio, activatingSongUrl]);

  const handlePlayPause = useCallback(
    (url) => {
      // Immediately set the activating state
      setActivatingSongUrl(url);

      if (selectedAudio !== url) {
        onAudioChange?.(url);
        // If audio isn't already playing, toggle it on for the new selection
        if (!isPlayingAudio) {
          toggleAudioPlayback?.();
        }
      } else {
        // If it's the same audio, just toggle playback
        toggleAudioPlayback?.();
      }
    },
    [onAudioChange, toggleAudioPlayback, isPlayingAudio, selectedAudio]
  );

  const handleKeyActivate = (e, beat) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePlayPause(beat);
    }
  };

  const handleArtistClick = (event, artistId) => {
    event.stopPropagation();
    navigate(`/artists/${artistId}`);
  };

  const labels = useMemo(() => {
    if (initialSongs && initialSongs.length > 0) {
      return initialSongs.map((song) => ({
        url: song.audio_file_link || song.link,
        label: (
          <span className="flex items-baseline">
            {song.artist && song.artist.name && song.artist.id ? (
              <>
                <button
                  onClick={(event) => handleArtistClick(event, song.artist.id)}
                  className="text-green-300 hover:text-green-100 underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                  aria-label={`View profile for ${song.artist.name}`}
                >
                  {song.artist.name}
                </button>
                <span className="mx-1">-</span>
              </>
            ) : null}
            {song.name}
          </span>
        ),
      }));
    }
    return localBeats.map((url, index) => ({
      url,
      label: getBeatLabelFromUrl(url, index),
    }));
  }, [initialSongs, localBeats, handleArtistClick]);

  const renderRow = (beatInfo, index) => {
    const isActive = selectedAudio === beatInfo.url;
    const isCurrentlyActivating = activatingSongUrl === beatInfo.url; // Check local activating state

    const prefix = (
      <span className="mr-2 font-mono text-sm" aria-label="index">
        {index + 1}.
      </span>
    );

    return (
      <div
        key={beatInfo.url}
        className={cx(
          "flex items-center justify-between py-2 px-3 mb-1 rounded-md cursor-pointer",
          "transition-all duration-200 ease-in-out",
          isActive
            ? "bg-cyan-700/70 text-white shadow-md shadow-cyan-500/10 border border-cyan-500"
            : "bg-gray-800/40 text-gray-300 hover:bg-gray-700/60 hover:text-white border border-transparent hover:border-cyan-700"
        )}
        role="option"
        aria-selected={isActive}
        data-url={beatInfo.url}
      >
        <span className="flex items-center" style={{ minWidth: 0 }}>
          {prefix}
          <span
            className="text-sm pr-2 font-mono whitespace-nowrap overflow-hidden text-ellipsis min-w-0"
            title={typeof beatInfo.label === "string" ? beatInfo.label : ""}
          >
            {beatInfo.label}
          </span>
        </span>
        {isCurrentlyActivating && !isActive ? ( // Show LOADING if activating and not yet the active song
          <span className="text-gray-400 text-xs flex-shrink-0 ml-2">LOADING...</span>
        ) : (
          <button
            type="button"
            onClick={() => handlePlayPause(beatInfo.url)}
            onKeyDown={(e) => handleKeyActivate(e, beatInfo.url)}
            className={cx(getSubButtonClass(isActive), "flex-shrink-0 ml-2")}
            aria-label={`$
              isActive ? (isPlayingAudio ? "Pause" : "Play") : "Activate"
            } ${typeof beatInfo.label === "string" ? beatInfo.label : ""}`}
          >
            {isActive ? (isPlayingAudio ? "PLAYING" : "PAUSED") : "ACTIVATE"}
          </button>
        )}
      </div>
    );
  };

  return (
    <motion.div
      id="beats-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="dialog"
      aria-label="Beats panel"
      className={`absolute top-0 left-[${panelOffsetLeft}] mt-0 p-4
                 bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-sm rounded-lg shadow-2xl flex flex-col
                 min-w-[200px] max-w-[400px] max-h-screen overflow-y-auto border border-cyan-700 shadow-cyan-500/15
                 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent z-[500]`}
    >
      <div className="flex justify-around mb-4 border-b border-cyan-800 pb-2">
        <button
          type="button"
          className={getButtonClass(activeTab === "music")}
          onClick={() => setActiveTab("music")}
          aria-pressed={activeTab === "music"}
        >
          Music
        </button>
      </div>
      {activeTab === "music" && (
        <div>
          <h3 className="text-cyan-400 text-lg font-semibold mb-3 border-b border-cyan-900 pb-1 font-mono">
            AUDIO LOGS
          </h3>
          <div
            className="max-h-60 overflow-y-auto border border-gray-700 rounded-md p-2 bg-black/30
                       scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent"
            role="listbox"
            aria-label="Available beats"
          >
            {isSongsLoading && !hasLoadedSongs ? (
              <p className="text-gray-400 text-sm text-center">Loading songs...</p>
            ) : labels.length > 0 ? (
              labels.map((beatInfo, index) => renderRow(beatInfo, index))
            ) : (
              <p className="text-gray-400 text-sm text-center">No songs available.</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

MainTrain.propTypes = {
  onAudioChange: PropTypes.func,
  isPlayingAudio: PropTypes.bool,
  toggleAudioPlayback: PropTypes.func,
  onBeatsReady: PropTypes.func,
  selectedAudio: PropTypes.string,
  panelLabel: PropTypes.string,
  initialTab: PropTypes.string,
  showPanel: PropTypes.bool.isRequired,
  setShowPanel: PropTypes.func.isRequired,
  panelOffsetLeft: PropTypes.string.isRequired,
  initialSongs: PropTypes.array,
  isSongsLoading: PropTypes.bool,
};

export default MainTrain;