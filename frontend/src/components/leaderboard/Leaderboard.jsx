import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LeaderboardTable from './LeaderboardTable';
import { FaTrophy, FaChartLine } from 'react-icons/fa';

const Leaderboard = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.3,
        duration: 0.5
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  // Animated background circles
  const circles = Array(5).fill().map((_, i) => (
    <motion.div
      key={i}
      className={`absolute rounded-full bg-gradient-to-r from-green-200 to-teal-200 opacity-20 z-0`}
      style={{
        width: `${Math.random() * 200 + 50}px`,
        height: `${Math.random() * 200 + 50}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
      }}
      animate={{
        x: [0, Math.random() * 50 - 25],
        y: [0, Math.random() * 50 - 25],
        scale: [1, Math.random() * 0.3 + 0.8, 1],
      }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: Math.random() * 10 + 10,
      }}
    />
  ));

  return (
    <motion.div 
      className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden bg-gradient-to-br from-white to-green-50 rounded-xl shadow-sm"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated background */}
      {circles}
      <motion.div
        variants={itemVariants}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            >
              <FaChartLine />
            </motion.div>
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-6 rounded-lg shadow-lg inline-flex items-center"
            >
              <FaTrophy className="text-yellow-300 text-3xl mr-3" />
              <h1 className="text-3xl font-bold">Leaderboard Dosen</h1>
            </motion.div>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-gray-600 max-w-2xl mx-auto bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            Peringkat dosen berdasarkan <span className="font-semibold text-green-700">Skor Rata-rata</span>. 
            Gunakan fitur pencarian untuk menemukan dosen tertentu atau urutkan berdasarkan nama, peringkat, atau skor.
          </p>
          <div className="mt-2 text-sm text-gray-500 max-w-2xl mx-auto bg-green-50 p-3 rounded-lg border border-green-100">
            <p><span className="font-semibold">Skor Rata-rata:</span> Nilai murni berdasarkan evaluasi mahasiswa.</p>
          </div>
        </motion.div>
        
        <div className="flex justify-center mt-6 space-x-4">
          <motion.div 
            whileHover={{ y: -5 }}
            className="flex flex-col items-center bg-yellow-50 p-3 rounded-lg shadow-sm border border-yellow-100"
          >
            <FaTrophy className="text-yellow-500 text-2xl mb-1" />
            <span className="text-sm font-medium text-gray-700">Peringkat 1</span>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="flex flex-col items-center bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100"
          >
            <FaTrophy className="text-gray-400 text-2xl mb-1" />
            <span className="text-sm font-medium text-gray-700">Peringkat 2</span>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="flex flex-col items-center bg-amber-50 p-3 rounded-lg shadow-sm border border-amber-100"
          >
            <FaTrophy className="text-amber-600 text-2xl mb-1" />
            <span className="text-sm font-medium text-gray-700">Peringkat 3</span>
          </motion.div>
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <LeaderboardTable />
      </motion.div>
      
    </motion.div>
  );
};

export default Leaderboard;
