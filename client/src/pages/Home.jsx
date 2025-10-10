import HeroSection from '../components/HeroSection';
import UnisGrid from '../components/UnisGrid';
import RentalProcess from '../components/RentalProcess';
import Features from '../components/Features';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <>
      <div className="bg-[#0A0F1A] text-[#E0E0E0] min-h-screen font-sans">
        <Navbar />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <HeroSection />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <UnisGrid />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <RentalProcess />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Features />
        </motion.div>
        <Footer />
      </div>
    </>
  );
}