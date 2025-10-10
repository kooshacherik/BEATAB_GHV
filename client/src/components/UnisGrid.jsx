import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardMedia, Typography, Chip, CircularProgress, Button } from "@mui/material";
import { School, LocationOn, Map as MapIcon } from "@mui/icons-material";
import axios from "axios";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const UniversityGrid = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await axios.get("/universities");
        setUniversities(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchUniversities();
  }, []);

  const filteredUniversities = Array.isArray(universities) 
    ? (filter === "All" 
        ? universities 
        : universities.filter(uni => uni.type === filter))
    : [];

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <CircularProgress sx={{ color: 'rgb(79, 70, 229)' }} />
    </div>
  );

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl font-bold text-gray-900">Explore Universities</h1>
        {/* <Button
          variant="contained"
          startIcon={<MapIcon />}
          onClick={() => setShowMap(!showMap)}
          sx={{
            bgcolor: 'rgb(79, 70, 229)',
            '&:hover': { bgcolor: 'rgb(67, 56, 202)' },
          }}
        >
          {showMap ? 'Hide Map' : 'View on Map'}
        </Button> */}
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {["All", "State", "Private"].map((type) => (
          <motion.button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg ${
              filter === type
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {type}
          </motion.button>
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {filteredUniversities.map((uni) => (
          <motion.div
            key={uni._id}
            variants={cardVariants}
            whileHover="hover"
            layoutId={uni._id}
          >
            <Link
              to={`/search?lat=${uni.lat}&lng=${uni.lng}`}
              className="block h-full no-underline"
            >
              <Card className="relative h-[320px] overflow-hidden bg-white shadow-lg">
                <CardMedia
                  component="img"
                  image={uni.logo}
                  alt={uni.name}
                  className="object-cover w-full h-full"
                />
                
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />

                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <Typography variant="h5" className="mb-2 font-bold text-white">
                    {uni.name}
                  </Typography>

                  <div className="flex items-center gap-2 mb-3 text-white/90">
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">{uni.location}</Typography>
                  </div>

                  <Chip
                    icon={<School />}
                    label={uni.type}
                    size="small"
                    sx={{
                      bgcolor: uni.type === "State" 
                        ? "rgb(167, 243, 208)" 
                        : "rgb(253, 230, 138)",
                      color: uni.type === "State" 
                        ? "rgb(6, 95, 70)" 
                        : "rgb(146, 64, 14)",
                      '& .MuiChip-icon': { color: 'inherit' }
                    }}
                  />
                </motion.div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {showMap && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 bg-white"
        >
          {/* map component goes here */}
          <div className="h-full">Map Component</div>
        </motion.div>
      )}
      
    </div>
  );
};

export default UniversityGrid;