import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaTrophy } from 'react-icons/fa';

const LeaderboardRow = ({ lecturer, rank, positionChange }) => {
  // Get row styling based on rank
  const getRowStyle = () => {
    switch(rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-400';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-600';
      default:
        return 'bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-colors duration-300';
    }
  };
  
  // Get trophy based on rank
  const getTrophy = () => {
    switch(rank) {
      case 1:
        return <FaTrophy className="text-yellow-500 mr-2" />;
      case 2:
        return <FaTrophy className="text-gray-400 mr-2" />;
      case 3:
        return <FaTrophy className="text-amber-600 mr-2" />;
      default:
        return null;
    }
  };
  // Default image if none provided
  const apiUrl = import.meta.env.VITE_API_URL;
  const imageUrl = lecturer.photo_url && lecturer.photo_url !== '/uploads/lecturers/'
    ? `${apiUrl}${lecturer.photo_url}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(lecturer.name)}&background=random`;
  
  // Animation variants for row
  const rowVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        delay: rank * 0.05 // Stagger animation based on rank
      }
    },
    hover: {
      scale: rank <= 3 ? 1.02 : 1.01,
      transition: { duration: 0.2 }
    }
  };
  
  // Get font size based on rank
  const getFontSize = () => {
    switch(rank) {
      case 1: return 'text-lg font-bold';
      case 2: return 'text-base font-semibold';
      case 3: return 'text-base font-medium';
      default: return 'text-sm';
    }
  };

  // Position change indicator
  const renderPositionIndicator = () => {
    if (!positionChange || positionChange === 'same') return null;
    
    if (positionChange === 'up') {
      return (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-green-500 ml-2"
        >
          <FaArrowUp />
        </motion.span>
      );
    }
    
    return (
      <motion.span 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-red-500 ml-2"
      >
        <FaArrowDown />
      </motion.span>
    );
  };

  return (
    <motion.tr
      variants={rowVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={`border-b transition-all ${getRowStyle()} ${getFontSize()}`}
    >
      <td className="p-3 text-center font-semibold">
        <div className="flex items-center justify-center">
          {getTrophy()}
          <span>{rank}</span>
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center">
          <div className={`${rank === 1 ? 'w-14 h-14' : rank === 2 ? 'w-12 h-12' : rank === 3 ? 'w-11 h-11' : 'w-10 h-10'} rounded-full overflow-hidden mr-3 flex-shrink-0 border-2 ${rank === 1 ? 'border-yellow-400' : rank === 2 ? 'border-gray-400' : rank === 3 ? 'border-amber-600' : 'border-gray-200'}`}>
            <img 
              src={imageUrl} 
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(lecturer.name)}&background=random`;
              }}
            />
          </div>
          <span className={`${rank <= 3 ? 'font-semibold' : 'font-medium'}`}>{lecturer.name}</span>
        </div>
      </td>
      <td className="p-3 text-center">
        <div className="flex items-center justify-center">
          <span className="font-medium">
            {lecturer.averageScore !== null && lecturer.averageScore !== undefined
              ? `${Math.round(lecturer.averageScore)}%`
              : "No Score"}
          </span>
          {renderPositionIndicator()}
        </div>
      </td>
      <td className="p-3 text-center">
        <div className="flex items-center justify-center">
          <span className="font-medium">
            {lecturer.votersCount !== null && lecturer.votersCount !== undefined
              ? lecturer.votersCount
              : "0"}
          </span>
        </div>
      </td>
    </motion.tr>
  );
};

export default LeaderboardRow;
