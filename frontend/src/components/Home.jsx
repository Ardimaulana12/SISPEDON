import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaInstagram, FaFacebook, FaYoutube, FaTrophy, FaEdit } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function Home() {
  const [lecturers, setLecturers] = useState([]);
  const [topLecturers, setTopLecturers] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = besar ke kecil
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
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

  useEffect(() => {
    const fetchLecturers = async () => {
      const token = localStorage.getItem('access_token');
      try {
        // Fetch all lecturers for the leaderboard
        const res = await axios.get(`${apiUrl}/lecturers/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res.data)
        
        // Add average score if not present
        const lecturersWithScores = res.data.map(lecturer => ({
          ...lecturer,
          averageScore: (lecturer.average_score != null && !isNaN(lecturer.average_score)) ? lecturer.average_score : 0
        }));
        
        setLecturers(lecturersWithScores);
        
        // Get top 3 lecturers for the featured section
        const top3 = [...lecturersWithScores]
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 3);
          
        setTopLecturers(top3);
      } catch (error) {
        console.error('Error fetching lecturers:', error);
      }
    };
    fetchLecturers();
  }, []);

  const sortedLecturers = [...lecturers].sort((a, b) => {
    const scoreA = a.averageScore ?? 0;
    const scoreB = b.averageScore ?? 0;
    return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
  });
  
  // Get lecturer image URL
  const getLecturerImage = (lecturer) => {
    if (lecturer.photo_url && lecturer.photo_url !== '/uploads/lecturers/') {
      return `${apiUrl}${lecturer.photo_url}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(lecturer.name)}&background=random`;
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-gradient-to-br from-white to-blue-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.header 
        className="py-12 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-r from-blue-600 to-indigo-800 text-white"
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            <span className="block">Yuk!</span>
            <span className="block">Lihat Dan Laporkan</span>
            <span className="block">Seluruh Kinerja</span>
            <span className="block">Dosen Kita</span>
          </h1>
          <motion.div 
            className="mt-8 inline-block bg-white text-blue-700 px-8 py-3 rounded-full font-bold text-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Leaderboard
          </motion.div>
        </div>
      </motion.header>

      {/* Top 3 Lecturers - Dark Mode Style */}
      <motion.section 
        className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white"
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Top Performers</h2>
          
          <div className="flex flex-wrap justify-center gap-6">
            {topLecturers.map((lecturer, index) => {
              const rank = index + 1;
              const trophyColor = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-amber-600';
              const scoreColor = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-green-400';
              const bgColor = rank === 1 ? 'from-yellow-900/30 to-yellow-700/30' : rank === 2 ? 'from-gray-800/30 to-gray-700/30' : 'from-amber-900/30 to-amber-700/30';
              const size = rank === 1 ? 'w-48 h-48' : 'w-40 h-40';
              const order = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';
              
              return (
                <motion.div 
                  key={lecturer.nidn}
                  className={`${order} flex flex-col items-center`}
                  whileHover={{ y: -10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={`relative ${rank === 1 ? 'mb-8' : 'mb-4'}`}>
                    {rank === 1 && (
                      <motion.div 
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, 10, 0, -10, 0] }}
                        transition={{ duration: 1, delay: 0.5 }}
                      >
                        <FaTrophy className="text-yellow-400 text-3xl" />
                      </motion.div>
                    )}
                    <div className={`${size} rounded-full overflow-hidden border-4 ${rank === 1 ? 'border-yellow-400' : rank === 2 ? 'border-gray-300' : 'border-amber-600'} bg-gradient-to-b ${bgColor}`}>
                      <img 
                        src={getLecturerImage(lecturer)} 
                        alt={lecturer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold">{lecturer.name}</h3>
                  <p className={`text-2xl font-bold ${scoreColor}`}>{Math.round(lecturer.averageScore)}%</p>
                  <p className="text-gray-400 text-sm">@{lecturer.name.toLowerCase().replace(/\s+/g, '')}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Leaderboard Section */}
      <motion.section 
        className="py-12 px-4 sm:px-6 lg:px-8 flex-grow"
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Leaderboard</h2>
            <Link 
              to="/leaderboard" 
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              View Full Leaderboard
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-green-100 to-teal-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rank</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dosen</th>
                    <th className="p-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedLecturers.slice(0, 5).map((lecturer, index) => {
                    const rank = index + 1;
                    const rowStyle = rank <= 3 
                      ? rank === 1 
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400' 
                        : rank === 2 
                          ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-400' 
                          : 'bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-600'
                      : 'bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100';
                    
                    return (
                      <motion.tr 
                        key={lecturer.nidn} 
                        className={`${rowStyle}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            {rank <= 3 && (
                              <FaTrophy className={`mr-2 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
                            )}
                            <span className={`font-medium ${rank <= 3 ? 'font-bold' : ''}`}>{rank}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className={`${rank <= 3 ? 'w-10 h-10' : 'w-8 h-8'} rounded-full overflow-hidden mr-3 flex-shrink-0 border-2 ${rank === 1 ? 'border-yellow-400' : rank === 2 ? 'border-gray-400' : rank === 3 ? 'border-amber-600' : 'border-gray-200'}`}>
                              <img 
                                src={getLecturerImage(lecturer)} 
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className={`${rank <= 3 ? 'font-semibold' : 'font-medium'}`}>{lecturer.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium">
                          {Math.round(lecturer.averageScore)}%
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer Section */}
      <motion.footer 
        className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white"
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center mb-4">
              <FaEdit className="text-blue-400 text-xl mr-2" />
              <h2 className="text-2xl font-bold">SISPEDON</h2>
            </div>
            <p className="text-gray-400 mb-6">Sistem Penilaian Dosen</p>
            <p className="text-gray-300 font-bold mb-8">UNIVERSITAS DIKTE</p>
            
            <div className="flex space-x-6">
              <motion.a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors duration-300"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaInstagram className="text-2xl" />
              </motion.a>
              <motion.a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors duration-300"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaFacebook className="text-2xl" />
              </motion.a>
              <motion.a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-500 transition-colors duration-300"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaYoutube className="text-2xl" />
              </motion.a>
            </div>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
}
