import React from 'react';
import { motion } from 'framer-motion';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const SortButton = ({ columnKey, sortConfig, onSort }) => {
  // Check if this column is currently being sorted
  const isActive = sortConfig?.key === columnKey;
  const getIcon = () => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return (
        <motion.span 
          whileHover={{ scale: 1.2 }}
          className="ml-1 inline-block text-gray-300 hover:text-gray-500 transition-colors duration-200"
        >
          <FaSort />
        </motion.span>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <motion.span 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.2 }}
        className="ml-1 inline-block text-green-500"
      >
        <FaSortUp />
      </motion.span>
    ) : (
      <motion.span 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.2 }}
        className="ml-1 inline-block text-green-500"
      >
        <FaSortDown />
      </motion.span>
    );
  };

  return (
    <motion.button 
      onClick={() => onSort(columnKey)}
      className={`inline-flex items-center focus:outline-none ml-2 ${isActive ? 'text-green-600' : 'text-gray-500'}`}
      aria-label={`Sort by ${columnKey}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {getIcon()}
    </motion.button>
  );
};

export default SortButton;