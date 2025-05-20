import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaInstagram, FaFacebook, FaYoutube, FaTrophy, FaEdit, FaGraduationCap, FaChalkboardTeacher, FaStar } from 'react-icons/fa';
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
  
  // Function to extract proper initials from lecturer name
  const getInitials = (name) => {
    // Split name by space
    const nameParts = name.trim().split(' ');

    // Ambil dua bagian pertama yang bukan gelar
    const filteredParts = nameParts.filter(part => !part.match(/^(Dr\.?|Prof\.?|M\.Kom\.?|M\.T\.?|M\.Sc\.?|M\.Eng\.?|Ph\.D\.?|S\.Pd\.?|S\.Kom\.?|S\.T\.?)$/i));

    // Ambil maksimal 2 inisial pertama
    return filteredParts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
  };
  
  // Get lecturer image URL
  const getLecturerImage = (lecturer) => {
    if (lecturer.photo_url && lecturer.photo_url !== '/uploads/lecturers/') {
      return `${apiUrl}${lecturer.photo_url}`;
    }
    return `https://ui-avatars.com/api/?name=${getInitials(lecturer.name)}&background=random`;
  };

  const scrollToLeaderboard = () => {
    const section = document.getElementById("leaderboard");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <motion.div 
      className="min-h-screen flex flex-col relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.header 
        className="py-12 px-4 sm:px-6 lg:px-8 text-center text-black relative "
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            <span className="block">Yuk!</span>
            <span className="block">Lihat Dan Laporkan</span>
            <span className="block">Seluruh Kinerja</span>
            <span className="block">Dosen Kita</span>
          </h1>
          <p className="text-lg text-gray-900 max-w-2xl mx-auto mt-4">
            Sistem Penilaian Dosen (SISPEDON) membantu meningkatkan kualitas pengajaran di Universitas Dikte
          </p>
          <motion.button
            onClick={scrollToLeaderboard}
            className="mt-8 bg-gradient-to-r cursor-pointer from-gray-800 to-black text-white px-8 py-3 rounded-full font-bold text-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Leaderboard
          </motion.button>
        </div>
      </motion.header>

      {/* Divider */}
      <div className="relative z-10">
        <div className="h-1 bg-gradient-to-r from-gray-700 via-gray-800 to-black max-w-5xl mx-auto"></div>
      </div>
      
      {/* Top 3 Lecturers - Leaderboard Style */}
      <motion.section 
        className="py-12 px-4 sm:px-6 lg:px-8 relative z-10"
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-gray-800 to-black rounded-t-[45px] shadow-lg py-6 px-8">
            <h2 className="text-3xl font-bold text-center text-white">Top Performers</h2>
          </div>
          <div className="bg-gradient-to-r from-gray-800 to-black rounded-b-[45px] shadow-lg py-8 px-6 border border-gray-200 border-t-2">
          
          <div className="flex flex-wrap justify-center gap-8 mt-4">
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
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${getInitials(lecturer.name)}&background=random`;
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white">{lecturer.name}</h3>
                  <p className={`text-2xl font-bold ${scoreColor}`}>{Math.round(lecturer.averageScore)}%</p>
                  <p className="text-white text-sm">@{lecturer.name.toLowerCase().replace(/\s+/g, '')}</p>
                </motion.div>
              );
            })}
          </div>
          </div>
        </div>
      </motion.section>

      {/* White Line */}
      <div className="relative z-10">
        <div className="h-1 bg-white max-w-5xl mx-auto"></div>
      </div>

      {/* Divider */}
      <div className="relative z-10">
        <div className="h-1 bg-gradient-to-r from-black via-gray-800 to-gray-700 max-w-5xl mx-auto"></div>
      </div>
      
      {/* Leaderboard Section */}
      <motion.section 
        className="py-12 px-4 sm:px-6 lg:px-8 relative z-10"
        id='leaderboard'
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-gray-800 to-black rounded-t-[45px] shadow-lg py-4 px-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
              <Link 
                to="/leaderboard" 
                className="text-white underline hover:text-gray-300 font-medium flex items-center"
              >
                View Full Leaderboard
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-b-xl shadow-lg py-6 px-6 border border-gray-200 border-t-0">
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
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
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200';
                    
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
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${getInitials(lecturer.name)}&background=random`;
                                }}
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
        </div>
      </motion.section>

      
      {/* Footer Section */}
      <motion.footer 
        className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-800 to-black text-white relative z-10"
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center mb-4">
              <FaEdit className="text-gray-300 text-xl mr-2" />
              <h2 className="text-2xl font-bold">SISPEDON</h2>
            </div>
            <p className="text-white mb-6">Sistem Penilaian Dosen</p>
            <p className="text-white font-bold mb-8">UNIVERSITAS DIKTE</p>
            
            <div className="flex space-x-8">
              <motion.a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-pink-500 transition-colors duration-300"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaInstagram className="text-2xl" />
              </motion.a>
              <motion.a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300 transition-colors duration-300"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaFacebook className="text-2xl" />
              </motion.a>
              <motion.a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-red-500 transition-colors duration-300"
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
