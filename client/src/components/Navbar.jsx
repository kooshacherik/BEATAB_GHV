import React, { useState, useEffect } from "react";
import { Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar'; // Assuming SearchBar also needs styling adjustment or is already styled
import { useSelector } from 'react-redux';
import AccountDropdown from "./ProfileDropdown"; // Assuming ProfileDropdown also needs styling adjustment or is already styled
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { signOut } from "../redux/user/userSlice";
import axios from "axios";
import { motion } from 'framer-motion';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const userDataString = localStorage.getItem("persist:root");
      if (userDataString) {
        const persistedData = JSON.parse(userDataString);
        const userData = JSON.parse(persistedData.user);
        setUserId(userData.currentUser._id);
      }
    }
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await axios.get('/auth/signout', { withCredentials: true });
      dispatch(signOut());
      navigate("/sign-in");
      toast.info("Sign Out Successful");
    } catch (error) {
      toast.error("Something went wrong!");
      console.log(error);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="sticky top-0 z-50 w-full transition-all duration-300 bg-black/40 backdrop-blur-md shadow-lg shadow-cyan-500/10 border-b border-cyan-700/50"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center px-2 space-x-4">
            <Link to="/">
              <img
                src="/campus-home-logo.svg"
                alt="MyCampusHome Logo"
                className="h-10 filter brightness-200 saturate-150"
              />
            </Link>
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold text-cyan-400 font-mono glitch-text">
                MyCampusHome
              </Link>
            </div>
          </div>

          <SearchBar />

          <div className="hidden md:flex items-center space-x-4 max-h-1">
            <Link to="/list-property">
              <button
                className="sci-fi-button px-4 py-2 text-sm font-semibold"
              >
                List an Accommodation
              </button>
            </Link>
            <Link to="/about" className="text-sm font-medium text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
              About
            </Link>
            <Link to="/freestyle" className="text-sm font-medium text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
              Freestyle
            </Link>
            <Link to="/help" className="text-sm font-medium text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
              Help Center
            </Link>
            {!currentUser ? (
              <>
                <Link to="/sign-in" className="text-sm font-medium text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
                  Sign In
                </Link>
                <Link to="/sign-up" className="text-sm font-medium text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link to={`/newchat/${userId}`} className="text-sm font-medium text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
                  Messages
                </Link>
                <AccountDropdown />
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-cyan-400 rounded-md hover:bg-cyan-900/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black/50 backdrop-blur-sm shadow-lg md:hidden border-b border-cyan-700/50"
        >
          <div className="flex flex-col items-start px-4 py-6 space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Type in City, address, or ZIP code"
                className="sci-fi-input block w-full px-4 py-2 pl-10 text-sm text-gray-200 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="w-full">
              <button
                className="sci-fi-button w-full px-4 py-2 text-sm font-semibold"
              >
                List an Accommodation
              </button>
            </div>
            <Link to="/about" className="w-full text-sm font-medium text-center text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
              About
            </Link>
            <Link to="/freestyle" className="w-full text-sm font-medium text-center text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
              Freestyle
            </Link>
            <Link to="/help" className="w-full text-sm font-medium text-center text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
              Help Center
            </Link>

            {!currentUser ? (
              <>
                <Link to="/sign-in" className="w-full text-sm font-medium text-center text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
                  Log In
                </Link>
                <Link to="/sign-up" className="w-full text-sm font-medium text-center text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="w-full text-sm font-medium text-center text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
                  Dashboard
                </Link>
                <Link to="/settings" className="w-full text-sm font-medium text-center text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
                  Settings
                </Link>
                <Link to="/support" className="w-full text-sm font-medium text-center text-gray-300 cursor-pointer hover:text-cyan-400 transition-colors duration-200">
                  Support
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-sm font-medium text-center text-red-400 cursor-pointer hover:underline"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;