import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth";
import { toast } from "react-toastify";
import axios from "axios";
import { motion } from 'framer-motion';

const SignUp = () => {
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        acceptTerms: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const validateForm = () => {
        setError(null);
        if (!formData.firstname.trim()) {
            setError("First name is required.");
            return false;
        }
        if (!formData.lastname.trim()) {
            setError("Last name is required.");
            return false;
        }
        // Corrected email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address.");
            return false;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return false;
        }
        if (formData.password !== formData.passwordConfirmation) {
            setError("Passwords do not match.");
            return false;
        }
        if (!formData.acceptTerms) {
            setError("You must accept the terms and conditions to register.");
            return false;
        }
        return true;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(null); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); 
        if (!validateForm()) {
            toast.error(error); 
            return;
        }
        setLoading(true);
        try {
            await axios.post("/api/auth/signup", formData);
            navigate("/sign-in"); 
            toast.success("Registration successful! Please sign in."); 
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Registration failed. An unexpected error occurred.";
            setError(errorMessage); 
            toast.error(errorMessage); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-[#0A0F1A] text-[#E0E0E0] min-h-screen font-sans">
            <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
                <section className="relative flex items-end h-32 bg-gray-900 lg:col-span-5 lg:h-full xl:col-span-6">
                    <img
                        alt=""
                        src="https://images.unsplash.com/photo-1570570665905-346e1b6be193?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        className="absolute inset-0 object-cover w-full h-full opacity-80"
                    />
                    <div className="hidden lg:relative lg:block lg:p-12">
                        <Link className="block text-white" to="/">
                            <span className="sr-only">Home</span>
                            <svg
                                className="h-8 sm:h-10"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"
                                    fill="currentColor"
                                />
                            </svg>
                        </Link>
                        <h2 className="glitch-text mt-6 text-2xl font-bold text-cyan-500 sm:text-3xl md:text-4xl tracking-widest uppercase font-mono">
                            Welcome to MyCampusHome.LK
                        </h2>
                        <h5 className="mt-4 leading-relaxed text-white/90">
                            Sign up to MyCampusHome.LK and unlock a world of convenience in finding your ideal rental or boarding place. Create your account to explore tailored listings, connect with property owners, and simplify your housing journey.
                        </h5>
                    </div>
                </section>
                <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-xl lg:max-w-3xl bg-black/30 backdrop-blur-md border border-cyan-500/50 rounded-lg p-8 shadow-lg shadow-cyan-500/10 animate-fadeInUp"
                    >
                        <div className="relative block -mt-16 lg:hidden">
                            <a
                                className="inline-flex size-16 items-center justify-center rounded-full bg-white text-indigo-600 sm:size-20"
                                href="/"
                            >
                                <span className="sr-only">Home</span>
                                <svg
                                    className="h-8 sm:h-10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </a>
                            <h1 className="glitch-text mt-2 text-2xl font-bold text-cyan-500 sm:text-3xl md:text-4xl tracking-widest uppercase font-mono">
                                Welcome to MyCampusHome.LK
                            </h1>
                            <p className="mt-4 leading-relaxed text-gray-400">
                                Sign up to MyCampusHome.LK and unlock a world of convenience in finding your ideal rental or boarding place. Create your account to explore tailored listings, connect with property owners, and simplify your housing journey.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-6 gap-6 mt-8">
                            <div className="col-span-6 sm:col-span-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="FirstName"
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleChange}
                                        className="sci-fi-input w-full px-4 py-3 text-sm placeholder-transparent bg-white border-2 border-gray-200 rounded-lg peer focus:border-cyan-600 focus:outline-none text-gray-900"
                                        placeholder="First Name"
                                    />
                                    <label
                                        htmlFor="FirstName"
                                        className="absolute -top-2.5 left-3 bg-[#0A0F1A] px-1 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-cyan-400"
                                    >
                                        First Name
                                    </label>
                                </div>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="LastName"
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleChange}
                                        className="sci-fi-input w-full px-4 py-3 text-sm placeholder-transparent bg-white border-2 border-gray-200 rounded-lg peer focus:border-cyan-600 focus:outline-none text-gray-900"
                                        placeholder="Last Name"
                                    />
                                    <label
                                        htmlFor="LastName"
                                        className="absolute -top-2.5 left-3 bg-[#0A0F1A] px-1 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-cyan-400"
                                    >
                                        Last Name
                                    </label>
                                </div>
                            </div>
                            <div className="col-span-6">
                                <div className="relative">
                                    <input
                                        type="email"
                                        id="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="sci-fi-input w-full px-4 py-3 text-sm placeholder-transparent bg-white border-2 border-gray-200 rounded-lg peer focus:border-cyan-600 focus:outline-none text-gray-900"
                                        placeholder="Email"
                                    />
                                    <label
                                        htmlFor="Email"
                                        className="absolute -top-2.5 left-3 bg-[#0A0F1A] px-1 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-cyan-400"
                                    >
                                        Email
                                    </label>
                                </div>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <div className="relative">
                                    <input
                                        type="password"
                                        id="Password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="sci-fi-input w-full px-4 py-3 text-sm placeholder-transparent bg-white border-2 border-gray-200 rounded-lg peer focus:border-cyan-600 focus:outline-none text-gray-900"
                                        placeholder="Password"
                                    />
                                    <label
                                        htmlFor="Password"
                                        className="absolute -top-2.5 left-3 bg-[#0A0F1A] px-1 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-cyan-400"
                                    >
                                        Password
                                    </label>
                                </div>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <div className="relative">
                                    <input
                                        type="password"
                                        id="PasswordConfirmation"
                                        name="passwordConfirmation"
                                        value={formData.passwordConfirmation}
                                        onChange={handleChange}
                                        className="sci-fi-input w-full px-4 py-3 text-sm placeholder-transparent bg-white border-2 border-gray-200 rounded-lg peer focus:border-cyan-600 focus:outline-none text-gray-900"
                                        placeholder="Confirm Password"
                                    />
                                    <label
                                        htmlFor="PasswordConfirmation"
                                        className="absolute -top-2.5 left-3 bg-[#0A0F1A] px-1 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-cyan-400"
                                    >
                                        Confirm Password
                                    </label>
                                </div>
                            </div>
                            <div className="col-span-6">
                                <label className="flex items-center gap-4 hover:cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            id="acceptTerms"
                                            name="acceptTerms"
                                            checked={formData.acceptTerms}
                                            onChange={handleChange}
                                            className="peer sr-only"
                                        />
                                        <div className="transition-colors border-2 border-gray-200 rounded size-5 peer-checked:border-cyan-600 peer-checked:bg-cyan-600 group-hover:border-gray-300"></div>
                                        <div className="absolute inset-0 hidden text-white peer-checked:block">
                                            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-400">
                                        I accept the terms and conditions
                                    </span>
                                </label>
                            </div>
                            <div className="col-span-6">
                                <p className="text-sm text-gray-400">
                                    By creating an account, you agree to our
                                    <a href="#" className="ml-1 text-cyan-400 hover:text-cyan-300 hover:underline">terms and conditions</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-cyan-400 hover:text-cyan-300 hover:underline">privacy policy</a>.
                                </p>
                            </div>
                            <div className="col-span-6 sm:flex sm:items-center sm:gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="sci-fi-button relative inline-block w-full px-8 py-3 overflow-hidden text-white bg-cyan-600 rounded-lg group sm:w-auto focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2"
                                >
                                    <span className="relative inline-block text-md font-semibold">
                                        {loading ? "Creating an Account..." : "Create an Account"}
                                    </span>
                                </button>
                                <OAuth />
                            </div>
                            <p className="col-span-6 sm:flex sm:items-center sm:gap-4 mt-4 text-sm text-gray-400 sm:mt-0">
                                Already have an account?{' '}
                                <Link to="/sign-in" className="text-cyan-400 hover:text-cyan-300 hover:underline">Sign in</Link>
                            </p>
                            {error && (
                                <div className="col-span-6 p-3 text-sm text-red-400 rounded-lg bg-red-900/20">
                                    {error}
                                </div>
                            )}
                        </form>
                    </motion.div>
                </main>
            </div>
        </section>
    )
}

export default SignUp;