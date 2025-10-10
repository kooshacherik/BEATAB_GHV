import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { signInFailure, signInStart, signInSuccess } from "../redux/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import OAuth from "../components/OAuth";
import axios from 'axios';
import { motion } from 'framer-motion';

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  // Original script's error state management - uses the Redux state directly.
  const { loading, error } = useSelector(state => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Original script did not clear error on change, but this is a good UX practice.
    // However, for strict functional preservation, we'll keep it closer to original if it didn't do this.
    // If original cleared error, it would be here. As it didn't, keeping it minimal.
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Start by clearing any previous Redux errors on new submission attempt
    dispatch(signInFailure(null)); // Clear previous API-related error

    // Client-side validation: basic check for empty fields (or specific formats if original had it)
    // The original script's validation was implicit in handleSubmit, not a separate validateForm function.
    if (!formData.email.trim() || !formData.password.trim()) {
      dispatch(signInFailure("Please enter both email and password."));
      toast.error("Please enter both email and password.");
      return;
    }

    // Indicate that the sign-in process has started
    dispatch(signInStart());

    try {
      // The core API call, exactly as in the original
      const res = await axios.post('/api/auth/signin', formData, {
        withCredentials: true
      });
      const data = res.data;

      if (data.success === false) {
        // Handle backend-reported errors
        dispatch(signInFailure(data.message));
        toast.error(data.message);
        return;
      }

      // On successful sign-in
      dispatch(signInSuccess(data));
      navigate('/');
      toast.success('Sign in successful!');
    } catch (err) {
      // Handle network errors or other exceptions during the API call
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage);
      dispatch(signInFailure(errorMessage));
    }
  };

  return (
    <section className="bg-[#0A0F1A] text-[#E0E0E0] min-h-screen font-sans">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        {/* Decorative section */}
        <section className="relative flex items-end h-32 bg-gray-900 lg:col-span-5 lg:h-full xl:col-span-6">
          <img
            alt="Students"
            src="https://images.unsplash.com/photo-1519070994522-88c6b756330e?q=80&w=1897&auto=format&fit=crop"
            className="absolute inset-0 object-cover w-full h-full opacity-80"
          />
          <div className="hidden lg:relative lg:block lg:p-12">
            <Link className="block text-white" to="/">
              <span className="sr-only">Home</span>
              <svg className="h-8 sm:h-10" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" fill="currentColor" />
              </svg>
            </Link>
            <h2 className="glitch-text mt-6 text-2xl font-bold text-cyan-500 sm:text-3xl md:text-4xl tracking-widest uppercase font-mono">
              Welcome back to MyCampusHome.LK
            </h2>
            <p className="mt-4 leading-relaxed text-white/90">
              Sign in to continue your journey in finding the perfect student accommodation.
            </p>
          </div>
        </section>

        {/* Main Sign-In Form */}
        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl lg:max-w-3xl bg-black/30 backdrop-blur-md border border-cyan-500/50 rounded-lg p-8 shadow-lg shadow-cyan-500/10 animate-fadeInUp"
          >
            {/* Mobile Header */}
            <div className="relative block -mt-16 lg:hidden">
              <Link className="inline-flex items-center justify-center text-indigo-600 bg-white rounded-full size-16 sm:size-20" to="/">
                <span className="sr-only">Home</span>
                <svg className="h-8 sm:h-10" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" fill="currentColor" />
                </svg>
              </Link>
              <h1 className="glitch-text mt-2 text-2xl font-bold text-cyan-500 sm:text-3xl md:text-4xl tracking-widest uppercase font-mono">
                Welcome Back
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-10 gap-6 mt-8">
              {/* Email Input */}
              <div className="col-span-10">
                <div className="relative">
                  <input
                    type="email"
                    id="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="sci-fi-input w-full px-5 py-4 text-base placeholder-transparent bg-white border-2 border-gray-200 rounded-lg peer focus:border-cyan-600 focus:outline-none text-gray-900"
                    placeholder="Email"
                  />
                  <label
                    htmlFor="Email"
                    className="absolute px-2 text-base text-gray-400 transition-all bg-[#0A0F1A] -top-3 left-3 peer-placeholder-shown:top-4 peer-placeholder-shown:text-lg peer-placeholder-shown:text-gray-400 peer-focus:-top-3 peer-focus:text-base peer-focus:text-cyan-400"
                  >
                    Email
                  </label>
                </div>
              </div>

              {/* Password Input */}
              <div className="col-span-10">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="sci-fi-input w-full px-4 py-3 text-base placeholder-transparent bg-white border-2 border-gray-200 rounded-lg peer focus:border-cyan-600 focus:outline-none text-gray-900"
                    placeholder="Password"
                  />
                  <label
                    htmlFor="Password"
                    className="absolute -top-2.5 left-3 bg-[#0A0F1A] px-1 text-base text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-base peer-focus:text-cyan-400"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 hover:text-cyan-400"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between col-span-10">
                <label className="flex items-center gap-4 hover:cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="transition-colors border-2 border-gray-200 rounded size-5 peer-checked:border-cyan-600 peer-checked:bg-cyan-600 group-hover:border-gray-300"></div>
                    <div className="absolute inset-0 hidden text-white peer-checked:block">
                      <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>

                <Link to="/forgot-password-otp" className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button & OAuth */}
              <div className="col-span-10 space-y-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="sci-fi-button relative inline-block w-full px-8 py-3 overflow-hidden text-white bg-cyan-600 rounded-lg group focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2"
                >
                  <span className="relative inline-block font-semibold text-md">
                    {loading ? "Signing in..." : "Sign in"}
                  </span>
                </button>

                <OAuth />
              </div>

              {/* Sign Up Link */}
              <div className="items-center justify-center col-span-10">
                <p className="text-sm text-center text-gray-400">
                  Don't have an account? {'  '}
                  <Link to="/sign-up" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="col-span-10 p-3 text-sm text-red-400 rounded-lg bg-red-900/20">
                  {error}
                </div>
              )}
            </form>
          </motion.div>
        </main>
      </div>
    </section>
  );
};

export default SignIn;