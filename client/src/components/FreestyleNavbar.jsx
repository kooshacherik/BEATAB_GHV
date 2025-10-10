// client/src/components/FreestyleNavbar.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import MainTrain from "../pages/template"; // Assuming template.jsx is now MainTrain.jsx
import SettingsPanel from "../pages/template2"; // Assuming template2.jsx is now SettingsPanel.jsx
import axios from "axios"; // Import axios

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
        // Optionally handle fallback to local beats here if necessary,
        // but MainTrain should handle the display of whatever it receives.
      } finally {
        setLoadingSongs(false);
      }
    };

    loadAllSongs();
  }, [onBeatsReady]); // Ensure onBeatsReady is stable or memoized if it changes

  return (

    <motion.nav
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 11, damping: 14 }}
      className={`fixed top-0 left-0 h-full ${NAVBAR_WIDTH_TAILWIND} z-50 flex flex-col items-center py-6 bg-black/40 backdrop-blur-md shadow-lg shadow-cyan-500/10 border-r border-cyan-700/50`}
    >
          {!isFullscreen && 
      <Link to="/" className="text-xl font-bold text-cyan-400 font-mono glitch-text whitespace-nowrap overflow-hidden text-ellipsis px-2 mb-8">
        MyCampusHome
      </Link>
}
      <div className="flex flex-col items-center space-y-4 w-full">
        {/* Navigation Links */}
                  {!isFullscreen && 
        <Link
          to="/about"
          className="w-full text-center py-3 text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors duration-200"
        >
          ABOUT
        </Link>
      }
        <Link
          to="/freestyle"
          className="w-full text-center py-3 text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors duration-200"
        >
          FREESTYLE
        </Link>
        {/* Add more general links here */}

        {/* Spacer or separator */}
        <div className="w-1/2 h-px bg-cyan-700 my-4" />

        {/* MainTrain Button/Hover Area */}
        <div
          className="relative w-full"
          onMouseEnter={() => setShowMainTrainPanel(true)}
          onMouseLeave={() => setShowMainTrainPanel(false)}
        >
          <button
            className="w-full text-center py-3 text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors duration-200 uppercase tracking-widest font-mono"
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
                showPanel={showMainTrainPanel}
                setShowPanel={setShowMainTrainPanel}
                panelOffsetLeft="80px"
                // Pass the pre-loaded songs and loading status to MainTrain
                initialSongs={loadedSongs}
                isSongsLoading={loadingSongs}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Settings Panel Button/Hover Area */}
        <div
          className="relative w-full"
          onMouseEnter={() => setShowSettingsPanel(true)}
          onMouseLeave={() => setShowSettingsPanel(false)}
        >
          <button
            className="w-full text-center py-3 text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors duration-200 uppercase tracking-widest font-mono"
          >
            CONFIG
          </button>
          <AnimatePresence>
            {showSettingsPanel && (
              <SettingsPanel
                onSettingsChange={onSettingsChange}
                showPanel={showSettingsPanel}
                setShowPanel={setShowSettingsPanel}
                panelOffsetLeft="80px"
                wordSettings={wordSettings}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
    
  );
};

export default FreestyleNavbar;






// // client/src/components/FreestyleNavbar_v0.jsx
// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import { Link } from "react-router-dom";
// import MainTrain from "../pages/template"; // Assuming template.jsx is now MainTrain.jsx
// import SettingsPanel from "../pages/template2"; // Assuming template2.jsx is now SettingsPanel.jsx

// const FreestyleNavbar = ({
//   onAudioChange,
//   isPlayingAudio,
//   toggleAudioPlayback,
//   onBeatsReady,
//   selectedAudio,
//   onSettingsChange,
//   wordSettings,
// }) => {
//   const [showSettingsPanel, setShowSettingsPanel] = useState(false);
//   const [showMainTrainPanel, setShowMainTrainPanel] = useState(false);

//   return (
//     <motion.nav
//       initial={{ y: -100 }}
//       animate={{ y: 0 }}
//       transition={{ type: "spring", stiffness: 120, damping: 14 }}
//       className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 bg-black/40 backdrop-blur-md shadow-lg shadow-cyan-500/10 border-b border-cyan-700/50 flex justify-between items-center px-4 py-2"
//     >
//       <div className="flex items-center space-x-4">
//         <Link to="/" className="text-2xl font-bold text-cyan-400 font-mono glitch-text">
//           MyCampusHome
//         </Link>
//       </div>

//       <div className="flex items-center space-x-4">
//         {/* MainTrain Panel */}
//         <MainTrain
//           onAudioChange={onAudioChange}
//           isPlayingAudio={isPlayingAudio}
//           toggleAudioPlayback={toggleAudioPlayback}
//           onBeatsReady={onBeatsReady}
//           selectedAudio={selectedAudio}
//           showPanel={showMainTrainPanel}
//           setShowPanel={setShowMainTrainPanel}
//           panelLeft={"left-auto"} // Adjust positioning as needed
//           panelRight={"right-48"} // Position to the right of SettingsPanel for example
//         />

//         {/* Settings Panel */}
//         <SettingsPanel
//           onSettingsChange={onSettingsChange}
//           showPanel={showSettingsPanel}
//           setShowPanel={setShowSettingsPanel}
//           panelLeft={"left-auto"} // Adjust positioning as needed
//           panelRight={"right-5"} // Closer to the edge
//           wordSettings={wordSettings} // Pass wordSettings here
//         />
//       </div>
//     </motion.nav>
//   );
// };

// export default FreestyleNavbar;