// client/src/pages/Freestyle.jsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import Renderer from "../components/Renderer";
import FreestyleNavbar from "../components/FreestyleNavbar";
import ParticlesBackground from "../components/ParticlesBackground";

const HudIcon = ({ size = 24, className = "" }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 8V6a2 2 0 1 2-2h2" />
    <path d="M2 16v2a2 2 0 0 1 2 2h2" />
    <path d="M22 8V6a2 2 0 0 0-2-2h-2" />
    <path d="M22 16v2a2 2 0 1 2-2 2h-2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const HudOffIcon = ({ size = 24, className = "" }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 8V6a2 2 0 1 2-2h2" />
    <path d="M2 16v2a2 2 0 0 1 2 2h2" />
    <path d="M22 8V6a2 2 0 0 0-2-2h-2" />
    <path d="M22 16v2a2 2 0 1 2-2 2h-2" />
    <path d="m2 2 20 20" />
  </svg>
);

const EnterFSIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9 3H3v6h2V5h4V3zm12 0h-6v2h4v4h2V3zM3 21h6v-2H5v-4H3v6zm18-6h-2v4h-4v2h6v-6z"
      fill="currentColor"
    />
  </svg>
);
const ExitFSIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9 7H5V5h6v6H9V7zm6 0v4h-2V5h6v2h-4zm-6 10h4v2H5v-6h2v4zm10-4h2v6h-6v-2h4v-4z"
      fill="currentColor"
    />
  </svg>
);
// Add new icons for loop modes at the icon section
const LoopNoneIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.5"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
const LoopPlaylistIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none"><path d="M4 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 19a9 9 0 1 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
const LoopSingleIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="monospace">1</text></svg>
);
const FreestylePage = () => {
  // --- STATES ---
  const [wordsHistory, setWordsHistory] = useState([]);
  const [audioState, setAudioState] = useState(null);
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  // Add loop mode state (0 = no loop, 1 = loop playlist, 2 = loop single)
  const [loopMode, setLoopMode] = useState(0);

  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null); // New state for user role
  const [allBeats, setAllBeats] = useState([]);
  const allBeatsMetaData = useRef({});
  const [userPlaylists, setUserPlaylists] = useState({});
  const [currentPlaylistName, setCurrentPlaylistName] = useState("All");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isNewPlaylistOpen, setIsNewPlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistSelection, setNewPlaylistSelection] = useState(new Set());
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const [showTracksHover, setShowTracksHover] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const freestylePageRef = useRef(null);

  const dropdownRef = useRef(null);
  const wordsHistoryRef = useRef(null);
  const progressBarRef = useRef(null);
  const navigate = useNavigate();

  const [showDataStream, setShowDataStream] = useState(true);
  const toggleDataStreamVisibility = useCallback(() => {
    setShowDataStream((prev) => !prev);
  }, []);

  const [showParticles, setShowParticles] = useState(true);
  const toggleParticles = useCallback(() => {
    setShowParticles((prev) => !prev);
  }, []);

  const [wordSettings, setWordSettings] = useState({
    wordChangeMode: null,
    manualWordChange: null,
    automaticWordChange: null,
    selectedLanguage: "EN",
    effectTriggerMode: "on_word_change",
    lightEffect: "none",
    cameraEffect: "none",
    textEffect: "punched",
    floorTexture: "none",
    floorEffect: "none",   // New default
  });

const cycleLoopMode = useCallback(() => {
    setLoopMode((prev) => (prev + 1) % 3);
  }, []);

  const handleSettingsChange = useCallback((newSettings) => {
    console.log("Received new settings from SettingsPanel in Freestyle:", newSettings);
    setWordSettings(newSettings);
  }, []);

  // --- LOGIC ---
  const currentPlaylist = useMemo(() => {
    if (currentPlaylistName === "All") {
      return allBeats;
    } else {
      const playlistUrls = userPlaylists[currentPlaylistName] || [];
      return playlistUrls
        .map((url) => allBeatsMetaData.current[url])
        .filter(Boolean);
    }
  }, [currentPlaylistName, allBeats, userPlaylists]);

  const normalizeLink = useCallback((url) => {
    try {
      const u = new URL(url, window.location.origin);
      return `${u.pathname}${u.search || ""}`;
    } catch {
      return String(url).trim();
    }
  }, []);

  const handleSignOut = useCallback(() => {
    setUserId(null);
    setUserRole(null); // Clear user role on sign out
    setUserPlaylists({});
    localStorage.removeItem("user");
    toast.info("You have been signed out.");
    navigate("/sign-in");
  }, [navigate]);

  const handleApiError = useCallback(
    (error, defaultMessage) => {
      console.error(defaultMessage, error);
      toast.error(error.response?.data?.message || defaultMessage);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleSignOut();
      }
    },
    [handleSignOut]
  );

  const fetchUserPlaylists = useCallback(async () => {
    if (!userId || Object.keys(allBeatsMetaData.current).length === 0) return;
    try {
      const res = await axios.get(`/api/users/${userId}/playlists`);
      const fetchedPlaylistsData = res.data.playlists;
      const formattedPlaylists = {};
      fetchedPlaylistsData.forEach((p) => {
        formattedPlaylists[p.name] = p.songIds
          .map(
            (songId) =>
              Object.values(allBeatsMetaData.current).find(
                (meta) => meta.id === songId
              )?.url
          )
          .filter(Boolean);
      });
      setUserPlaylists(formattedPlaylists);
    } catch (error) {
      handleApiError(error, "Failed to load user playlists.");
    }
  }, [userId, handleApiError]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/users/verify");
        setUserId(res.data.user.id);
        setUserRole(res.data.user.role); // Set user role
      } catch (error) {
        handleApiError(error, "Failed to authenticate user. Please log in.");
      }
    };
    fetchUser();
  }, [handleApiError]);

  useEffect(() => {
    if (userId && Object.keys(allBeatsMetaData.current).length > 0) {
      fetchUserPlaylists();
    }
  }, [userId, fetchUserPlaylists]);

  // New useEffect to call sync-beats endpoint for admin users
  useEffect(() => {
    const syncBeatsAdmin = async () => {
      if (userId && userRole === "admin") {
        try {
          console.log("Admin user detected. Attempting to sync beats...");
          await axios.post("/api/admin/sync-beats");
          toast.success("Beat data synchronized successfully!");
        } catch (error) {
          handleApiError(error, "Failed to synchronize beat data.");
        }
      }
    };
    syncBeatsAdmin();
  }, [userId, userRole, handleApiError]); // Dependencies: userId and userRole


  const getSafeDuration = useCallback(() => {
    if (!Renderer.audioManager) return 0;
    try {
      const duration =
        Number(Renderer.audioManager.getDurationSeconds?.()) ??
        Number(Renderer.audioManager.audio?.duration) ??
        0;
      return Number.isFinite(duration) && duration > 0 ? duration : 0;
    } catch {
      return 0;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!Renderer.audioManager) return;
    const current = Renderer.audioManager.getPlaybackSeconds?.();
    const duration = Renderer.audioManager.getDurationSeconds?.();
    if (Number.isFinite(current)) setAudioCurrentTime(current);
    if (Number.isFinite(duration) && duration > 0)
      setAudioDuration(duration);
  }, []);

  const appendWord = useCallback((word) => {
    setWordsHistory((prev) => [...prev, word]);
  }, []);

  const accumulatePlayTime = useCallback(
    async (songId, deltaMs) => {
      if (!userId || !songId || deltaMs <= 0) return;
      try {
        await axios.post("/api/plays/accumulate", { userId, songId, deltaMs });
      } catch (error) {
        handleApiError(error, "Failed to accumulate play time.");
      }
    },
    [userId, handleApiError]
  );

  useEffect(() => {
    let accumulatedMs = 0;
    let intervalId;
    if (
      isPlayingAudio &&
      audioState &&
      userId &&
      allBeatsMetaData.current[audioState]?.id
    ) {
      intervalId = setInterval(() => {
        accumulatedMs += 1000;
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (
        accumulatedMs > 0 &&
        userId &&
        audioState &&
        allBeatsMetaData.current[audioState]?.id
      ) {
        const songId = allBeatsMetaData.current[audioState].id;
        accumulatePlayTime(songId, accumulatedMs);
      }
    };
  }, [isPlayingAudio, audioState, userId, accumulatePlayTime]);

  const recordSongPlay = useCallback(
    async (songUrl) => {
      if (!userId || !allBeatsMetaData.current[songUrl]?.id) return;
      const songId = allBeatsMetaData.current[songUrl].id;
      try {
        await axios.post("/api/plays", { userId, songId });
        await axios.post(`/api/users/${userId}/history/append`, { songId });
      } catch (error) {
        handleApiError(error, "Failed to record play session or update history.");
      }
    },
    [userId, handleApiError]
  );

  const handleAudioChangeFromTemplate = useCallback(
    async (audioUrl) => {
      setCurrentPlaylistName("All");
      const idx = allBeats.findIndex((beat) => beat.url === audioUrl);
      setCurrentTrackIndex(idx >= 0 ? idx : 0);

      setAudioState(audioUrl);

      if (Renderer.audioManager) {
        await Renderer.audioManager.changeAudio(audioUrl, { autoplay: true });
        setIsPlayingAudio(true);
        recordSongPlay(audioUrl);
        // Start BPM tracking after audio changes and starts playing
        if (Renderer.bpmManager && Renderer.audioManager.isPlaying) {
          Renderer.bpmManager.startBeatTracking(Renderer.audioManager.audio.source, Renderer.audioManager.audioContext);
        }
      } else {
        // If audioManager is not initialized, initialize it and autoplay
        await Renderer.instance.init(audioUrl, true);
        setIsPlayingAudio(true);
        recordSongPlay(audioUrl);
      }

      if (wordSettings.effectTriggerMode === "on_song_change") {
        Renderer.triggerVisualEffects(wordSettings);
      }
    },
    [allBeats, recordSongPlay, wordSettings]
  );

  const playTrackAt = useCallback(
    async (index) => {
      if (currentPlaylist.length === 0) return;

      const safeIndex =
        ((index % currentPlaylist.length) + currentPlaylist.length) %
        currentPlaylist.length;
      const trackToPlay = currentPlaylist[safeIndex];

      if (!trackToPlay || !trackToPlay.url) {
        console.error("Attempted to play an invalid track:", trackToPlay);
        return;
      }

      setCurrentTrackIndex(safeIndex);
      setAudioState(trackToPlay.url);

      if (Renderer.audioManager) {
        await Renderer.audioManager.changeAudio(trackToPlay.url, { autoplay: true });
        setIsPlayingAudio(true);
        recordSongPlay(trackToPlay.url);
        // Start BPM tracking after track change
        if (Renderer.bpmManager && Renderer.audioManager.isPlaying) {
          Renderer.bpmManager.startBeatTracking(Renderer.audioManager.audio.source, Renderer.audioManager.audioContext);
        }
      } else {
        // If audioManager is not initialized, initialize it and autoplay
        await Renderer.instance.init(trackToPlay.url, true);
        setIsPlayingAudio(true);
        recordSongPlay(trackToPlay.url);
      }
    },
    [currentPlaylist, recordSongPlay]
  );

  const toggleAudioPlayback = useCallback(async () => {
    if (!Renderer.audioManager) {
      if (currentPlaylist.length === 0) return;
      const urlToPlay =
        currentPlaylist[currentTrackIndex]?.url || currentPlaylist[0]?.url;
      if (!urlToPlay) return;

      setAudioState(urlToPlay);
      // Initialize Renderer and start playing
      await Renderer.instance.init(urlToPlay, true); 
      setIsPlayingAudio(true);
      recordSongPlay(urlToPlay);
      // BPM tracking will be started within Renderer.init if autoplay is true
      return;
    }

    if (isPlayingAudio) {
      Renderer.audioManager.pause();
      setIsPlayingAudio(false);
      // Stop BPM tracking on pause
      if (Renderer.bpmManager) {
        Renderer.bpmManager.stopBeatTracking();
      }
    } else {
      Renderer.audioManager.play();
      setIsPlayingAudio(true);
      recordSongPlay(audioState);
      // Start BPM tracking on play
      if (Renderer.bpmManager && Renderer.audioManager.isPlaying) {
        Renderer.bpmManager.startBeatTracking(Renderer.audioManager.audio.source, Renderer.audioManager.audioContext);
      }
    }
    if (wordSettings.effectTriggerMode === "on_play_pause") {
      Renderer.triggerVisualEffects(wordSettings);
    }
  }, [audioState, currentPlaylist, currentTrackIndex, isPlayingAudio, recordSongPlay, wordSettings]);

  const playNextTrack = useCallback(async () => {
    if (currentPlaylist.length === 0) return;
    if (loopMode === 2) {
      // "Loop Single": just restart current
      await playTrackAt(currentTrackIndex);
      return;
    }
    let nextIndex;
    if (isShuffling) {
      // Shuffle ignores looping if not "loop single"
      nextIndex = Math.floor(Math.random() * currentPlaylist.length);
      if (nextIndex === currentTrackIndex && currentPlaylist.length > 1)
        nextIndex = (nextIndex + 1) % currentPlaylist.length;
    } else {
      nextIndex = currentTrackIndex + 1;
    }
    if (nextIndex >= currentPlaylist.length) {
      if (loopMode === 1) {
        // "Loop Playlist"
        await playTrackAt(0);
      } else {
        // "No Loop" - stop playback
        setIsPlayingAudio(false);
        Renderer.audioManager?.pause?.();
      }
    } else {
      await playTrackAt(nextIndex);
    }
  }, [currentPlaylist, currentTrackIndex, playTrackAt, isShuffling, loopMode]);
  const playPreviousTrack = useCallback(async () => {
    if (currentPlaylist.length === 0) return;
    if (loopMode === 2) {
      // "Loop Single": just restart current
      await playTrackAt(currentTrackIndex);
      return;
    }
    let prevIndex;
    if (isShuffling) {
      prevIndex = Math.floor(Math.random() * currentPlaylist.length);
      if (prevIndex === currentTrackIndex && currentPlaylist.length > 1)
        prevIndex = (prevIndex + 1) % currentPlaylist.length;
    } else {
      prevIndex = currentTrackIndex - 1;
    }
    if (prevIndex < 0) {
      if (loopMode === 1) {
        await playTrackAt(currentPlaylist.length - 1);
      } else {
        setIsPlayingAudio(false);
        Renderer.audioManager?.pause?.();
      }
    } else {
      await playTrackAt(prevIndex);
    }
  }, [currentPlaylist, currentTrackIndex, playTrackAt, isShuffling, loopMode]);

  const handleAudioEnded = useCallback(async () => {
    console.log("Audio ended event received.");
    if (Renderer.bpmManager) {
      Renderer.bpmManager.stopBeatTracking(); // Stop BPM tracking when audio ends
    }
    await playNextTrack();
  }, [playNextTrack]);

  useEffect(() => {
    let cleanup = () => {};
    const attach = () => {
      if (!Renderer.audioManager) return;
      // The event listener is now added in createManagers, and removed in destroyManagers
      // The `handleAudioEnded` from props will be used by Renderer.
      // No direct event listener setup here, rely on Renderer to manage it.
      // This ensures a single source of truth for event management.
      cleanup = () => { /* no-op, Renderer cleans up */ };
    };
    if (Renderer.audioManager) attach();
    else {
      const id = setInterval(() => {
        if (Renderer.audioManager) {
          clearInterval(id);
          attach();
        }
      }, 200);
      cleanup = () => clearInterval(id);
    }
    return cleanup;
  }, []); // Removed handleAudioEnded from dependencies as it's passed as prop

  useEffect(() => {
    let timer;
    if (Renderer.audioManager && isPlayingAudio) {
      handleTimeUpdate();
      timer = setInterval(handleTimeUpdate, 500);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio, handleTimeUpdate]);

  useEffect(() => {
    wordsHistoryRef.current?.lastElementChild?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [wordsHistory]);

  const formatTime = useCallback((seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }, []);

  const updateHoverFromMouse = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const rel = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const duration = getSafeDuration();
      setHoverPercent(rel);
      setHoverTime(duration * rel);
    },
    [getSafeDuration]
  );

  const handleProgressClick = useCallback(
    (e) => {
      if (!Renderer.audioManager) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const rel = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const duration = getSafeDuration();
      if (!(duration > 0)) return;
      const target = Math.min(duration - 0.01, Math.max(0, duration * rel));
      Renderer.audioManager.seek(target, { autoplay: isPlayingAudio });
      setAudioCurrentTime(target);
    },
    [getSafeDuration, isPlayingAudio]
  );

  const progressPercent =
    audioDuration > 0 && Number.isFinite(audioCurrentTime)
      ? Math.min(100, Math.max(0, (audioCurrentTime / audioDuration) * 100))
      : 0;

  const selectPlaylist = useCallback(
    async (name) => {
      setIsPlaylistMenuOpen(false);
      let list;
      if (name === "All") {
        list = allBeats;
      } else {
        list = (userPlaylists[name] || [])
          .map((url) => allBeatsMetaData.current[url])
          .filter(Boolean);
      }
      setCurrentPlaylistName(name);

      if (list.length > 0) {
        setCurrentTrackIndex(0);
        const firstTrackUrl = list[0].url;
        setAudioState(firstTrackUrl);

        if (Renderer.audioManager) {
          // Do not autoplay when simply selecting a playlist. User will click play.
          await Renderer.audioManager.changeAudio(firstTrackUrl, { autoplay: false });
          setIsPlayingAudio(false);
          // Stop BPM tracking on playlist selection if not autoplaying
          if (Renderer.bpmManager) {
            Renderer.bpmManager.stopBeatTracking();
          }
        } else {
            // If audioManager is not initialized, initialize it without autoplay
            await Renderer.instance.init(firstTrackUrl, false);
            setIsPlayingAudio(false);
        }
      } else {
        setAudioState(null);
        Renderer.audioManager?.stop?.();
        setIsPlayingAudio(false);
        // Stop BPM tracking if no audio
        if (Renderer.bpmManager) {
          Renderer.bpmManager.stopBeatTracking();
        }
      }
    },
    [allBeats, userPlaylists]
  );

  const toggleShuffle = useCallback(() => {
    setIsShuffling((prev) => !prev);
  }, []);

  const commitNewPlaylist = useCallback(
    async () => {
      const name = newPlaylistName.trim();
      if (!name) {
        toast.error("Playlist name cannot be empty!");
        return;
      }
      if (!userId) return;

      const songIds = Array.from(newPlaylistSelection)
        .map((url) => allBeatsMetaData.current[url]?.id)
        .filter(Boolean);

      try {
        const response = await axios.post(`/api/users/${userId}/playlists`, {
          name,
          songIds,
        });
        if (response.status === 201) {
          toast.success(`Playlist \\"${name}\\" created!`);
          await fetchUserPlaylists();
          setIsNewPlaylistOpen(false);
          setNewPlaylistName("");
          setNewPlaylistSelection(new Set());
        }
      } catch (error) {
        handleApiError(error, "Failed to create playlist.");
      }
    },
    [newPlaylistName, newPlaylistSelection, userId, fetchUserPlaylists, handleApiError]
  );

  const cancelNewPlaylist = useCallback(() => {
    setIsNewPlaylistOpen(false);
    setNewPlaylistName("");
    setNewPlaylistSelection(new Set());
  }, []);

  const getBeatLabelFromUrl = useCallback(
    (url) => {
      const meta = allBeatsMetaData.current[url];
      if (meta && meta.name) {
        return `${meta.artist?.name || "Unknown Artist"} - ${meta.name}`;
      }
      try {
        const parts = url.split("/");
        const filename = parts.pop();
        const artistFolder = parts.pop();
        const base = filename.replace(/\.[^/.]+$/, "");

        const formattedArtist = artistFolder
          ? artistFolder
              .replace(/[_-]+/g, " ")
              .trim()
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : `Unknown Artist`;
        const formattedSong = base
          .replace(/[_-]+/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());

        return `${formattedArtist} - ${formattedSong}`;
      } catch {
        return "Unknown Track";
      }
    },
    []
  );

  const handleBeatsReady = useCallback(
    async (urls) => {
      try {
        const response = await axios.get("/api/songs");
        const fetchedSongs = response.data;
        const metaData = {};
        const updatedAllBeats = [];

        urls.forEach((url) => {
          const normalized = normalizeLink(url);
          const matchingSong = fetchedSongs.find(
            (song) => normalizeLink(song.audio_file_link || song.link) === normalized
          );

          let songMetadata;
          if (matchingSong) {
            songMetadata = {
              id: matchingSong.id,
              name: matchingSong.name,
              artist: matchingSong.artist,
              link: matchingSong.link,
              audio_file_link: matchingSong.audio_file_link,
              type: matchingSong.type,
              url: url,
            };
          } else {
            songMetadata = {
              id: `local-${url}`,
              name: getBeatLabelFromUrl(url),
              link: url,
              audio_file_link: url,
              type: "mp3",
              artist: { name: "Local Beats" },
              url: url,
            };
          }
          metaData[url] = songMetadata;
          updatedAllBeats.push(songMetadata);
        });

        allBeatsMetaData.current = metaData;
        setAllBeats(updatedAllBeats);

        if (userId) {
          fetchUserPlaylists();
        }
        
        // If audioState is already set (e.g., from a deep link or previous session),
        // ensure the audio manager is initialized with it, but don't autoplay here.
        // Playback will be handled by explicit user action or component lifecycle if already playing.
        if (audioState && !Renderer.audioManager && allBeatsMetaData.current[audioState]) {
            await Renderer.instance.init(audioState, false); // Initialize without autoplay
            setIsPlayingAudio(false);
        }
      } catch (error) {
        handleApiError(error, "Failed to load song data.");
      }
    },
    [fetchUserPlaylists, normalizeLink, userId, handleApiError, audioState, getBeatLabelFromUrl]
  );

  useEffect(() => {
    if (!isPlaylistMenuOpen) return;
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsPlaylistMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isPlaylistMenuOpen]);

  const addSongToExistingPlaylist = useCallback(
    async (playlistName, songUrl) => {
      if (!userId) {
        toast.error("User not authenticated.");
        return;
      }
      const songId = allBeatsMetaData.current[songUrl]?.id;
      if (!songId) {
        toast.error("Selected song not found in database.");
        return;
      }
      try {
        await axios.post(`/api/users/${userId}/playlists/${playlistName}/add`, {
          songId,
        });
        toast.success("Song added to playlist!");
        await fetchUserPlaylists();
      } catch (error) {
        handleApiError(error, "Failed to add song to playlist.");
      }
    },
    [userId, fetchUserPlaylists, handleApiError]
  );

  const removeSongFromExistingPlaylist = useCallback(
    async (playlistName, songUrl) => {
      if (!userId) {
        toast.error("User not authenticated.");
        return;
      }
      const songId = allBeatsMetaData.current[songUrl]?.id;
      if (!songId) {
        toast.error("Selected song not found in database.");
        return;
      }
      try {
        await axios.post(`/api/users/${userId}/playlists/${playlistName}/remove`, {
          songId,
        });
        toast.success("Song removed from playlist!");
        await fetchUserPlaylists();
      } catch (error) {
        handleApiError(error, "Failed to remove song from playlist.");
      }
    },
    [userId, fetchUserPlaylists, handleApiError]
  );

  const deleteUserPlaylist = useCallback(
    async (playlistName) => {
      if (!userId) {
        toast.error("User not authenticated.");
        return;
      }
      try {
        await axios.delete(`/api/users/${userId}/playlists/${playlistName}`);
        toast.success(`Playlist '${playlistName}' deleted!`);
        await fetchUserPlaylists();
        setCurrentPlaylistName("All");
      } catch (error) {
        handleApiError(error, "Failed to delete playlist.");
      }
    },
    [userId, fetchUserPlaylists, handleApiError]
  );

  const toggleFullscreen = useCallback(() => {
    const el = freestylePageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const handleFullscreenChange = useCallback(() => {
    const isFS = !!document.fullscreenElement;
    setIsFullscreen(isFS);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [handleFullscreenChange]);

  // --- JSX ---
  return (
    <>
      <div
        ref={freestylePageRef}
        className={`bg-[#0A0F1A] text-[#E0E0E0] min-h-screen font-sans pl-20 ${
          isFullscreen ? "fixed inset-0 w-screen h-screen z-50" : ""
        }`}
      >
        {showParticles && <ParticlesBackground />}
        <FreestyleNavbar
          onAudioChange={handleAudioChangeFromTemplate}
          isPlayingAudio={isPlayingAudio}
          toggleAudioPlayback={toggleAudioPlayback}
          onBeatsReady={handleBeatsReady}
          selectedAudio={audioState}
          onSettingsChange={handleSettingsChange}
          wordSettings={wordSettings}
          isFullscreen={isFullscreen}
        />

        <section className="text-center py-16 px-4 relative overflow-hidden">
          <h2
            data-text="Freestyle Flow"
            className="glitch-text relative text-6xl font-bold text-cyan-500 mb-8 tracking-widest uppercase font-mono"
          >
            Freestyle Flow
          </h2>

          {showDataStream && (
            <div
              className="absolute top-28 right-8 w-40 max-h-[70vh] bg-cyan-900/10 backdrop-blur-md border border-cyan-500/50 rounded-lg p-6 shadow-lg shadow-cyan-500/10 flex flex-col overflow-y-auto overflow-x-hidden z-30 transform transition-all duration-500 ease-in-out hover:shadow-cyan-500/30 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent animate-fadeInUp"
              ref={wordsHistoryRef}
            >
              <div className="flex justify-between items-center mb-4 border-b-2 border-cyan-500/50 pb-2">
                <h3 className="text-2xl font-bold text-cyan-400 font-mono">
                  DATA STREAM
                </h3>
              </div>

              {wordsHistory.length === 0 ? (
                <p className="text-cyan-300/70 text-lg italic">
                  Awaiting audio input...
                </p>
              ) : (
                wordsHistory.map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center mb-2 animate-fadeInUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="px-4 py-2 rounded-md text-lg font-semibold cursor-pointer transition-all duration-300 ease-in-out shadow-md bg-black/20 text-cyan-300 hover:bg-cyan-500/20 hover:text-white hover:scale-105 transform">
                      {word}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
          <button
            onClick={toggleDataStreamVisibility}
            className="sci-fi-button px-3 py-1 text-sm fixed top-6 right-6 z-40"
          >
            {showDataStream ? "HIDE DATA STREAM" : "SHOW DATA STREAM"}
          </button>

          <button
            onClick={toggleParticles}
            className="sci-fi-button px-3 py-1 text-sm fixed top-6 right-52 z-40"
          >
            {showParticles ? "DISABLE PARTICLES" : "ENABLE PARTICLES"}
          </button>

          <div className="flex justify-center items-center mt-12">
            <div
              className={`relative ${
                isFullscreen ? "w-full h-full" : "w-full h-[90vh] max-w-6xl"
              } bg-black/20 rounded-lg border border-cyan-500/30 overflow-hidden`}
            >
              <Renderer
                wordsHistory={wordsHistory}
                appendWord={appendWord}
                currentAudio={audioState}
                setIsPlayingAudio={setIsPlayingAudio}
                isPlayingAudio={isPlayingAudio} // Pass isPlayingAudio to Renderer
                isFullscreen={isFullscreen}
                wordSettings={wordSettings}
                handleAudioEnded={handleAudioEnded} // Pass handleAudioEnded as a prop
              />
            </div>
          </div>
        </section>

        {isAudioPlayerVisible && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl bg-black/40 backdrop-blur-xl border border-cyan-400/50 p-6 rounded-lg shadow-2xl z-50 animate-pulse-glow [--tw-shadow-color:theme(colors.cyan.500)]">
            <div className="flex justify-between items-center mb-4 border-b border-cyan-400/30 pb-3">
              <div className="text-left">
                <div className="text-xl font-bold text-white">
                  {audioState ? getBeatLabelFromUrl(audioState) : "No Audio Loaded"}
                </div>
                <div className="text-sm text-cyan-300 mt-1 font-mono">
                  PLAYLIST:{" "}
                  <span className="font-semibold text-white">
                    {currentPlaylistName === "All" ? "All Beats" : currentPlaylistName}
                  </span>
                </div>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  className="sci-fi-button"
                  onClick={() => setIsPlaylistMenuOpen((o) => !o)}
                  aria-label="Choose playlist"
                >
                  <span>
                    {currentPlaylistName === "All" ? "All Beats" : currentPlaylistName}
                  </span>
                  <span
                    className={`ml-2 transition-transform duration-300 ${
                      isPlaylistMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isPlaylistMenuOpen && (
                  <div className="absolute top-full right-0 mt-3 bg-black/70 backdrop-blur-xl border border-cyan-500/50 rounded-lg p-3 w-56 shadow-2xl z-50 animate-fadeInUp">
                    <div
                      className={`px-4 py-2 rounded-lg mb-2 text-lg cursor-pointer ${
                        currentPlaylistName === "All"
                          ? "bg-cyan-600 text-black font-bold"
                          : "text-white hover:bg-cyan-900"
                      }`}
                      onClick={() => selectPlaylist("All")}
                    >
                      All Beats
                    </div>
                    {Object.keys(userPlaylists).map((name) => (
                      <div
                        key={name}
                        className={`px-4 py-2 rounded-lg mb-2 text-lg cursor-pointer flex justify-between items-center ${
                          currentPlaylistName === name
                            ? "bg-cyan-600 text-black font-bold"
                            : "text-white hover:bg-cyan-900"
                        }`}
                        onClick={() => selectPlaylist(name)}
                      >
                        {name}
                        <button
                          className="ml-2 text-red-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUserPlaylist(name);
                          }}
                        >
                          {" "}
                          (x)
                        </button>
                      </div>
                    ))}
                    <div className="h-px bg-cyan-500 my-2" />
                    <div
                      className="px-4 py-2 rounded-lg text-green-400 cursor-pointer flex items-center gap-2 border border-green-700 border-dashed hover:bg-green-900"
                      onClick={() => {
                        setIsPlaylistMenuOpen(false);
                        setIsNewPlaylistOpen(true);
                      }}
                    >
                      <span className="font-extrabold text-xl">＋</span> New Playlist
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              ref={progressBarRef}
              className="w-full h-2.5 bg-cyan-900/50 rounded-full mt-4 cursor-pointer group relative"
              onMouseEnter={() => setIsHoveringProgress(true)}
              onMouseMove={updateHoverFromMouse}
              onMouseLeave={() => setIsHoveringProgress(false)}
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-100 linear shadow-[0_0_8px_theme(colors.cyan.500)]"
                style={{ width: `${progressPercent}%` }}
              />
              {isHoveringProgress && getSafeDuration() > 0 && (
                <>
                  <div
                    className="absolute -top-8 transform -translate-x-1/2 bg-black border border-cyan-400/50 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none font-mono"
                    style={{ left: `${hoverPercent * 100}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                  <div
                    className="absolute top-0 h-full w-0.5 bg-white pointer-events-none"
                    style={{ left: `${hoverPercent * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between w-full text-sm text-cyan-300 mt-2 font-mono">
              <span>{formatTime(audioCurrentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                className="sci-fi-button-round"
                onClick={playPreviousTrack}
                aria-label="Previous"
              >
                {" "}
                ⏮{" "}
              </button>
              <button
                className={`rounded-full p-4 text-3xl cursor-pointer shadow-xl transition-all duration-300 ${
                  isPlayingAudio ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"
                } text-white`}
                onClick={toggleAudioPlayback}
                aria-label="Play/Pause"
              >
                {isPlayingAudio ? "❚❚" : "▶"}
              </button>
              <button
                className="sci-fi-button-round"
                onClick={playNextTrack}
                aria-label="Next"
              >
                {" "}
                ⏭{" "}
              </button>
              <button
                className={`sci-fi-button ${
                  isShuffling ? "bg-yellow-500 text-black hover:bg-yellow-400" : ""
                }`}
                onClick={toggleShuffle}
                aria-label="Shuffle"
              >
                🔀 {isShuffling ? "ON" : "OFF"}
              </button>
              <button
                className={`sci-fi-button`}
                onClick={cycleLoopMode}
                aria-label={
                  loopMode === 0
                    ? "No loop"
                    : loopMode === 1
                    ? "Loop playlist"
                    : "Loop single track"
                }
                title={
                  loopMode === 0
                    ? "No loop"
                    : loopMode === 1
                    ? "Loop playlist"
                    : "Loop single"
                }
              >
                {loopMode === 0 ? <LoopNoneIcon /> : loopMode === 1 ? <LoopPlaylistIcon /> : <LoopSingleIcon />}
              </button>
              {/* Shuffle toggle as before */}
              <button
                className={`sci-fi-button ${isShuffling ? "bg-yellow-500 text-black hover:bg-yellow-400" : ""}`}
                onClick={() => setIsShuffling((prev) => !prev)}
                aria-label="Shuffle"
              >
                🔀 {isShuffling ? "ON" : "OFF"}
              </button>
            </div>

            <div
              className="mt-8 bg-black/30 border border-cyan-700 rounded-xl p-4 group"
              onMouseEnter={() => setShowTracksHover(true)}
              onMouseLeave={() => setShowTracksHover(false)}
            >
              {!showTracksHover ? (
                <div className="flex items-center text-cyan-300 text-sm">
                  <span>
                    Tracks in{" "}
                    {currentPlaylistName === "All" ? "All Beats" : currentPlaylistName}:
                  </span>
                  <span className="ml-2 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {currentPlaylist.length}
                  </span>
                  <span className="ml-auto text-cyan-400">Hover to view ▸</span>
                </div>
              ) : currentPlaylist.length === 0 ? (
                <div className="text-cyan-300 text-center py-4">
                  No tracks in this playlist.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                  {currentPlaylist.map((track, i) => {
                    const active = i === currentTrackIndex && audioState === track.url;
                    const displayName = track.name || "Unknown Track";
                    return (
                      <div
                        key={`${track.url}-${i}`}
                        className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer ${
                          active
                            ? "bg-cyan-600 text-black"
                            : "bg-black/40 text-white hover:bg-cyan-900"
                        }`}
                        onClick={() => playTrackAt(i)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-xs ${
                              active ? "bg-black text-cyan-400" : "bg-gray-700"
                            }`}
                          >
                            {i + 1}
                          </div>
                            <div className="font-semibold flex items-baseline">
                              {track.artist && track.artist.name && track.artist.id ? (
                                <>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      navigate(`/artists/${track.artist.id}`);
                                    }}
                                    className="text-green-300 hover:text-green-100 underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 mr-1"
                                    aria-label={`View profile for ${track.artist.name}`}
                                  >
                                    {track.artist.name}
                                  </button>
                                  <span className="mx-1">-</span>
                                </>
                              ) : null}
                              {track.name}
                            </div>
                        </div>
                        <div className={`text-xs ${active ? "text-red-500" : "text-gray-400"}`}>
                            {active ? (isPlayingAudio ? "Playing" : "Paused") : "Tap to play"}
                          </div>
                          {currentPlaylistName !== "All" && (
                            <button
                              className="text-red-400 hover:text-red-600 text-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSongFromExistingPlaylist(currentPlaylistName, track.url);
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsAudioPlayerVisible((v) => !v)}
          className="fixed bottom-6 left-6 w-12 h-12 bg-black/30 text-cyan-400 border border-cyan-400/50 rounded-full shadow-xl flex items-center justify-center vibrate z-[60]"
        >
          {isAudioPlayerVisible ? <HudOffIcon size={22} /> : <HudIcon size={22} />}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="fixed right-6 bottom-6 w-12 h-12 bg-black/30 text-white border border-cyan-400/50 rounded-full shadow-xl flex items-center justify-center z-[60]"
        >
          {isFullscreen ? ExitFSIcon : EnterFSIcon}
        </button>

        {isNewPlaylistOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-[#0D121C] border border-cyan-500/50 rounded-lg p-8 w-11/12 max-w-2xl shadow-2xl">
              <h2 className="text-3xl font-bold text-cyan-400 mb-6 border-b pb-4 font-mono">
                CREATE DATAPACK
              </h2>
              <input
                type="text"
                placeholder="Enter Datapack Name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="sci-fi-input w-full mb-6"
              />
              <div className="max-h-80 overflow-y-auto border border-cyan-800/50 rounded-lg p-4 bg-black/30 scrollbar-thin">
                {allBeats.length === 0 ? (
                  <div className="text-cyan-300/70 text-center py-4 text-lg">
                    No beats available.
                  </div>
                ) : (
                  allBeats.map((track, idx) => {
                    const checked = newPlaylistSelection.has(track.url);
                    const displayName = track.name || "Unknown Track";
                    return (
                      <label
                        key={`${track.url}-${idx}`}
                        className="flex items-center justify-between p-3 mb-2 rounded-md bg-black/20 border hover:border-cyan-500/50 cursor-pointer text-white"
                      >
                        <span className="text-lg">{displayName}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setNewPlaylistSelection((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(track.url);
                              else next.delete(track.url);
                              return next;
                            });
                          }}
                          className="form-checkbox h-5 w-5 text-cyan-400 bg-gray-800 border-gray-600 rounded"
                        />
                      </label>
                    );
                  })
                )}
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={cancelNewPlaylist}
                  className="sci-fi-button bg-gray-700/50"
                >
                  Cancel
                </button>
                <button
                  onClick={commitNewPlaylist}
                  className="sci-fi-button bg-green-600/80"
                >
                  Create Playlist
                </button>
              </div>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </>
  );
};

export default FreestylePage;