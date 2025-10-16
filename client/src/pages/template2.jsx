// client/src/pages/SettingsPanel.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

// Utility function for consistent class names
const cx = (...classes) => classes.filter(Boolean).join(" ");

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

// Consolidated sciFiInputClass
const sciFiInputClass =
  "sci-fi-input w-full text-center appearance-none bg-black/50 border border-cyan-700 focus:border-cyan-400 rounded-md py-2 pl-4 pr-8 text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400";
const sciFiRadioClass =
  "form-radio h-4 w-4 text-cyan-500 bg-gray-800 border-gray-600 focus:ring-cyan-500 transition-colors duration-200 cursor-pointer";
const sciFiLabelClass = "ml-2 text-gray-200 text-sm font-mono tracking-wide";

function SettingsPanel({
  onSettingsChange,
  setShowPanel,
  wordSettings,
  navbarBounds, // Receive navbar bounds
}) {
  const [activeTab, setActiveTab] = useState("communication");
  const [localWordSettings, setLocalWordSettings] = useState(wordSettings);
  const panelRef = useRef(null);

  useEffect(() => {
    setLocalWordSettings(wordSettings);
  }, [wordSettings]);

  useEffect(() => {
    onSettingsChange(localWordSettings);
  }, [localWordSettings, onSettingsChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowPanel]);

  const handleSettingChange = useCallback((key, value) => {
    setLocalWordSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleLanguageChange = useCallback((e) => {
    handleSettingChange("selectedLanguage", e.target.value);
  }, [handleSettingChange]);

  const handleWordChangeModeChange = useCallback((mode) => {
    handleSettingChange("wordChangeMode", mode);
    if (mode !== "manual") handleSettingChange("manualWordChange", null);
    if (mode !== "automatic") handleSettingChange("automaticWordChange", null);
  }, [handleSettingChange]);

  const handleManualWordChange = useCallback((mode) => {
    handleSettingChange("manualWordChange", mode);
  }, [handleSettingChange]);

  const handleAutomaticWordChange = useCallback((e) => {
    handleSettingChange("automaticWordChange", Number(e.target.value));
  }, [handleSettingChange]);

  const handleEffectTriggerModeChange = useCallback((mode) => {
    handleSettingChange("effectTriggerMode", mode);
  }, [handleSettingChange]);

  const handleLightEffectChange = useCallback((e) => {
    handleSettingChange("lightEffect", e.target.value);
  }, [handleSettingChange]);

  const handleCameraEffectChange = useCallback((e) => {
    handleSettingChange("cameraEffect", e.target.value);
  }, [handleSettingChange]);

  const handleTextEffectChange = useCallback((e) => {
    handleSettingChange("textEffect", e.target.value);
  }, [handleSettingChange]);

  const handleFloorTextureChange = useCallback((e) => {
    handleSettingChange("floorTexture", e.target.value);
  }, [handleSettingChange]);

  const handleFloorEffectChange = useCallback((e) => {
    handleSettingChange("floorEffect", e.target.value);
  }, [handleSettingChange]);

  const [panelStyle, setPanelStyle] = useState({});

  useEffect(() => {
    if (navbarBounds.width > 0 && panelRef.current) {
      const panelRect = panelRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const contentAreaLeft = navbarBounds.width;
      const contentAreaWidth = viewportWidth - contentAreaLeft;

      const centerLeft = contentAreaLeft + (contentAreaWidth / 2);
      const centerTop = viewportHeight / 2;

      setPanelStyle({
        position: 'fixed', // Keep fixed to easily position relative to viewport
        left: `${centerLeft - (panelRect.width / 2)}px`,
        top: `${centerTop - (panelRect.height / 2)}px`,
      });
    }
  }, [navbarBounds, activeTab]); // Recalculate if navbarBounds change or activeTab changes

  return (
    <motion.div
      ref={panelRef}
      id="settings-panel"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, ...panelStyle }} // Apply dynamic style here
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      role="dialog"
      aria-label="Settings panel"
      className={`p-4
                 bg-gradient-to-bl from-black/80 to-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl flex flex-col
                 border border-cyan-700 shadow-cyan-500/15
                 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent z-[500]
                 overflow-y-auto max-h-[90vh]`}
      style={{ ...panelStyle }} // Also apply for initial render positioning
    >
      <div className="flex justify-around mb-4 border-b border-cyan-800 pb-2">
        <button
          type="button"
          className={getButtonClass(activeTab === "communication")}
          onClick={() => setActiveTab("communication")}
          aria-pressed={activeTab === "communication"}
        >
          Communication Protocol
        </button>
        <button
          type="button"
          className={getButtonClass(activeTab === "pulseMode")}
          onClick={() => setActiveTab("pulseMode")}
          aria-pressed={activeTab === "pulseMode"}
        >
          Pulse Mode Settings
        </button>
        <button
          type="button"
          className={getButtonClass(activeTab === "visualEffects")}
          onClick={() => setActiveTab("visualEffects")}
          aria-pressed={activeTab === "visualEffects"}
        >
          Visual Effects
        </button>
      </div>

      {activeTab === "communication" && (
        <div>
          <h3 className="text-cyan-400 text-lg font-semibold mb-3 border-b border-cyan-900 pb-1 font-mono">
            INTERFACE LANGUAGE
          </h3>
          <div className="mb-6">
            <label
              htmlFor="language-select"
              className="block text-gray-300 text-sm font-mono mb-2 uppercase"
            >
              Select Language
            </label>
            <div className="relative">
              <select
                id="language-select"
                value={localWordSettings.selectedLanguage}
                onChange={handleLanguageChange}
                className={sciFiInputClass}
              >
                <option value="EN">English (EN)</option>
                <option value="FA">Farsi (FA)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-400">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pulseMode" && (
        <div>
          <h3 className="text-cyan-400 text-lg font-semibold mb-3 border-b border-cyan-900 pb-1 font-mono">
            DATA PULSE MODE
          </h3>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleWordChangeModeChange("automatic")}
              className={getSubButtonClass(localWordSettings.wordChangeMode === "automatic")}
            >
              AUTO-SYNC
            </button>
            <button
              onClick={() => handleWordChangeModeChange("manual")}
              className={getSubButtonClass(localWordSettings.wordChangeMode === "manual")}
            >
              MANUAL INITIATE
            </button>
          </div>

          {localWordSettings.wordChangeMode === "manual" && (
            <div className="pl-2 mt-4 space-y-3 border-l border-cyan-700">
              <h5 className="text-md text-cyan-200 font-medium mb-2 font-mono">
                TRIGGER TYPE
              </h5>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className={sciFiRadioClass}
                  name="manualWordChange"
                  value="click"
                  checked={localWordSettings.manualWordChange === "click"}
                  onChange={() => handleManualWordChange("click")}
                />
                <span className={sciFiLabelClass}>CLICK INTERCEPT</span>
              </label>
              <label className="inline-flex items-center ml-4">
                <input
                  type="radio"
                  className={sciFiRadioClass}
                  name="manualWordChange"
                  value="space"
                  checked={localWordSettings.manualWordChange === "space"}
                  onChange={() => handleManualWordChange("space")}
                />
                <span className={sciFiLabelClass}>KEYBOARD INPUT (SPACE)</span>
              </label>
            </div>
          )}

          {localWordSettings.wordChangeMode === "automatic" && (
            <div className="pl-2 mt-4 border-l border-cyan-700">
              <label
                htmlFor="automatic-speed"
                className="block text-cyan-200 text-sm font-mono mb-2 uppercase"
              >
                PULSE RATE (BPM)
              </label>
              <input
                type="range"
                id="automatic-speed"
                min="1"
                max="20"
                value={localWordSettings.automaticWordChange || 1}
                onChange={handleAutomaticWordChange}
                className="w-full h-2 bg-cyan-700 rounded-lg appearance-none cursor-pointer range-thumb-cyan-400"
              />
              <div className="flex justify-between text-xs text-cyan-400 font-mono mt-1">
                <span>SLOW</span>
                <span>FAST ({localWordSettings.automaticWordChange})</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "visualEffects" && (
        <div>
          <h3 className="text-cyan-400 text-lg font-semibold mb-3 border-b border-cyan-900 pb-1 font-mono">
            VISUAL EFFECT CONTROLS
          </h3>

          <div className="mb-4">
            <label
              htmlFor="effect-trigger"
              className="block text-gray-300 text-sm font-mono mb-2 uppercase"
            >
              Effect Trigger
            </label>
            <select
              id="effect-trigger"
              value={localWordSettings.effectTriggerMode}
              onChange={handleEffectTriggerModeChange}
              className={sciFiInputClass}
            >
              <option value="on_word_change">On Word Change</option>
              <option value="on_beat">On Beat</option>
              <option value="every_10_beats">Every 10 Beats</option>
              <option value="on_song_change">On Song Change</option>
              <option value="on_play_pause">On Play/Pause</option>
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="text-effect"
              className="block text-gray-300 text-sm font-mono mb-2 uppercase"
            >
              Text Animation
            </label>
            <select
              id="text-effect"
              value={localWordSettings.textEffect}
              onChange={handleTextEffectChange}
              className={sciFiInputClass}
            >
              <option value="none">None</option>
              <option value="fade">Fade</option>
              <option value="scale">Scale</option>
              <option value="slide">Slide</option>
              <option value="flip">Flip</option>
              <option value="cardFlip">Card Flip</option>
              <option value="color">Color Pulse</option>
              <option value="bounce">Bounce</option>
              <option value="slideFade">Slide Fade</option>
              <option value="liquidify">Liquidify</option>
              <option value="shatter">Shatter</option>
              <option value="ripInHalfBlood">Rip In Half (Blood)</option>
              <option value="punched">Punched</option>
              <option value="supernova">Supernova</option>
              <option value="clothRip">Cloth Rip</option>
              <option value="chewed">Chewed</option>
              <option value="bigCrunch">Big Crunch</option>
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="light-effect"
              className="block text-gray-300 text-sm font-mono mb-2 uppercase"
            >
              Spotlight Effect
            </label>
            <select
              id="light-effect"
              value={localWordSettings.lightEffect}
              onChange={handleLightEffectChange}
              className={sciFiInputClass}
            >
              <option value="none">None</option>
              <option value="pulse">Pulse</option>
              <option value="colorShift">Color Shift</option>
              <option value="orbit">Orbit</option>
              <option value="strobe">Strobe</option>
              <option value="cone">Cone Angle</option>
              <option value="penumbra">Penumbra</option>
              <option value="colorCycle">Color Cycle (HSL)</option>
              <option value="sweep">Sweep Motion</option>
              <option value="heightBounce">Height Bounce</option>
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="camera-effect"
              className="block text-gray-300 text-sm font-mono mb-2 uppercase"
            >
              Camera Animation
            </label>
            <select
              id="camera-effect"
              value={localWordSettings.cameraEffect}
              onChange={handleCameraEffectChange}
              className={sciFiInputClass}
            >
              <option value="none">None</option>
              <option value="home">Home View</option>
              <option value="top">Top View</option>
              <option value="path">Path Around Scene</option>
              <option value="shake">Shake</option>
              <option value="dolly">Dolly In/Out</option>
              <option value="focusShift">Focus Shift</option>
              <option value="spiral">Spiral Around</option>
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="floor-texture"
              className="block text-gray-300 text-sm font-mono mb-2 uppercase"
            >
              Floor Texture
            </label>
            <select
              id="floor-texture"
              value={localWordSettings.floorTexture}
              onChange={handleFloorTextureChange}
              className={sciFiInputClass}
            >
              <option value="none">None</option>
              <option value="transition2.png">Transition 2</option>
              <option value="spotlight_7.jpg">Spotlight 7</option>
              <option value="colors.png">Colors</option>
              <option value="uv_grid_opengl.jpg">UV Grid</option>
            </select>
          </div>
          <div className="mb-4">
            <label
              htmlFor="floor-effect"
              className="block text-gray-300 text-sm font-mono mb-2 uppercase"
            >
              Floor Effect
            </label>
            <select
              id="floor-effect"
              value={localWordSettings.floorEffect}
              onChange={handleFloorEffectChange}
              className={sciFiInputClass}
            >
              <option value="none">None</option>
              <option value="ripple">Beat Ripple (Default)</option>
              <option value="wave">Wave</option>
              <option value="colorCycle">Color Cycle</option>
              <option value="displace">Displace (Random)</option>
            </select>
          </div>
        </div>
      )}
    </motion.div>
  );
}

SettingsPanel.propTypes = {
  onSettingsChange: PropTypes.func.isRequired,
  setShowPanel: PropTypes.func.isRequired,
  wordSettings: PropTypes.shape({
    wordChangeMode: PropTypes.string,
    manualWordChange: PropTypes.string,
    automaticWordChange: PropTypes.number,
    selectedLanguage: PropTypes.string,
    effectTriggerMode: PropTypes.string,
    lightEffect: PropTypes.string,
    cameraEffect: PropTypes.string,
    textEffect: PropTypes.string,
    floorTexture: PropTypes.string,
    floorEffect: PropTypes.string,
  }).isRequired,
  navbarBounds: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
};

export default SettingsPanel;