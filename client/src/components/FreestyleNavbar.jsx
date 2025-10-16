// client/src/components/FreestyleNavbar.jsx

import React, { useState, useEffect, useCallback, useRef } from "react"; // Import useRef
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import MainTrain from "../pages/template";
import SettingsPanel from "../pages/template2";
import axios from "axios";

// Global Axios Configuration (keep consistent with App.jsx)
axios.defaults.withCredentials = true;

const FreestyleNavbar = ({
  onAudioChange,
  isPlayingAudio,
  toggleAudioPlayback,
  onBeatsReady,
  selectedAudio,
  onSettingsChange,
  wordSettings,
  isFullscreen,
}) => {
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showMainTrainPanel, setShowMainTrainPanel] = useState(false);
  const [loadedSongs, setLoadedSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const navbarRef = useRef(null); // Ref for the navbar
  const [navbarBounds, setNavbarBounds] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const NAVBAR_WIDTH_TAILWIND = "w-30"; // Tailwind class for 80px

  // Function to fetch songs (can be moved to a utility file if needed)
  const fetchSongs = async (params = {}) => {
    const res = await axios.get("api/songs", { params });
    return res.data;
  };

  // One-time song loading on FreestyleNavbar mount
  useEffect(() => {
    const loadAllSongs = async () => {
      setLoadingSongs(true);
      try {
        const fetchedSongs = await fetchSongs();
        setLoadedSongs(fetchedSongs);
        onBeatsReady?.(fetchedSongs.map((song) => song.audio_file_link || song.link));
      } catch (error) {
        console.error("Error loading songs in FreestyleNavbar:", error);
      } finally {
        setLoadingSongs(false);
      }
    };
    loadAllSongs();
  }, [onBeatsReady]);

  // Effect to measure navbar bounds and update on resize
  useEffect(() => {
    const updateNavbarBounds = () => {
      if (navbarRef.current) {
        const rect = navbarRef.current.getBoundingClientRect();
        setNavbarBounds({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateNavbarBounds(); // Initial measurement
    window.addEventListener("resize", updateNavbarBounds); // Update on resize

    return () => {
      window.removeEventListener("resize", updateNavbarBounds);
    };
  }, []);

  // Function to toggle MainTrain panel visibility
  const toggleMainTrainPanel = useCallback(() => {
    setShowMainTrainPanel((prev) => !prev);
    if (!showMainTrainPanel) {
      setShowSettingsPanel(false); // Close settings if MainTrain is opened
    }
  }, [showMainTrainPanel]);

  // Function to toggle SettingsPanel visibility
  const toggleSettingsPanel = useCallback(() => {
    setShowSettingsPanel((prev) => !prev);
    if (!showSettingsPanel) {
      setShowMainTrainPanel(false); // Close MainTrain if settings is opened
    }
  }, [showSettingsPanel]);

  return (
    <motion.nav
      ref={navbarRef} // Attach ref here
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 10 }}
      className={`fixed top-0 left-0 h-full ${NAVBAR_WIDTH_TAILWIND} z-50 flex flex-col items-center py-6 bg-black/40 backdrop-blur-md shadow-lg shadow-cyan-500/10 border-r border-cyan-700/50`}
    >
      {!isFullscreen && (
        <Link to="/" className="text-xl font-bold text-cyan-400 font-mono glitch-text whitespace-nowrap overflow-hidden text-ellipsis px-2 mb-8">
          MyCampusHome
        </Link>
      )}
      <div className="flex flex-col items-center space-y-4 w-full">
        {/* Navigation Links */}
        {!isFullscreen && (
          <Link
            to="/about"
            className="w-full text-center py-3 text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors duration-200"
          >
            ABOUT
          </Link>
        )}
        <Link
          to="/freestyle"
          className="w-full text-center py-3 text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors duration-200"
        >
          FREESTYLE
        </Link>
        {/* Spacer or separator */}
        <div className="w-1/2 h-px bg-cyan-700 my-4" />
        
        {/* MainTrain Button */}
        <div className="relative w-full">
          <button
            onClick={toggleMainTrainPanel}
            className={`w-full text-center py-3 text-sm font-medium transition-colors duration-200 uppercase tracking-widest font-mono ${
              showMainTrainPanel ? "text-cyan-400 bg-gray-800/50" : "text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50"
            }`}
          >
            BEATS
          </button>
          <AnimatePresence>
            {showMainTrainPanel && (
              <MainTrain
                onAudioChange={onAudioChange}
                isPlayingAudio={isPlayingAudio}
                toggleAudioPlayback={toggleAudioPlayback}
                onBeatsReady={onBeatsReady}
                selectedAudio={selectedAudio}
                setShowPanel={setShowMainTrainPanel}
                initialSongs={loadedSongs}
                isSongsLoading={loadingSongs}
                navbarBounds={navbarBounds} // Pass navbar bounds
              />
            )}
          </AnimatePresence>
        </div>

        {/* Settings Panel Button */}
        <div className="relative w-full">
          <button
            onClick={toggleSettingsPanel}
            className={`w-full text-center py-3 text-sm font-medium transition-colors duration-200 uppercase tracking-widest font-mono ${
              showSettingsPanel ? "text-cyan-400 bg-gray-800/50" : "text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50"
            }`}
          >
            CONFIG
          </button>
          <AnimatePresence>
            {showSettingsPanel && (
              <SettingsPanel
                onSettingsChange={onSettingsChange}
                setShowPanel={setShowSettingsPanel}
                wordSettings={wordSettings}
                navbarBounds={navbarBounds} // Pass navbar bounds
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
};

export default FreestyleNavbar;