import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeaderboardRow from './LeaderboardRow';
import SortButton from './SortButton';
import { useLeaderboardData } from './useLeaderboardData';
import { FaSearch, FaArrowUp, FaArrowDown, FaTrophy, FaSortUp, FaSortDown, FaFilter, FaDownload, FaCalendarAlt, FaFileExcel, FaFileCsv, FaCalendarDay } from 'react-icons/fa';
import { exportToCSV, filterByPeriod, formatLeaderboardForExport, exportToXLSX, getDateRangeString } from '../../utils/exportUtils';
import { toast } from 'react-toastify';
import axios from 'axios';

const LeaderboardTable = () => {
  // Custom hook for sorting ranks
  const [rankSortDirection, setRankSortDirection] = useState('asc'); // 'asc' means 1,2,3... (default)
  const { 
    lecturers, 
    loading, 
    error, 
    sortConfig, 
    handleSort, 
    getPositionChange,
    refreshData
  } = useLeaderboardData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportPeriod, setExportPeriod] = useState('all'); // 'all', 'day', 'week', 'month', 'year', 'custom'
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Default: 30 days ago
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [exportFormat, setExportFormat] = useState('xlsx'); // 'xlsx' or 'csv'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Filter lecturers based on search term
  const filteredLecturers = lecturers.filter(lecturer => 
    lecturer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle rank sorting
  const handleRankSort = () => {
    setRankSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  // Apply rank sorting
  const rankedLecturers = [...filteredLecturers];
  // We don't need to sort here as the rank is determined by the index in the display

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Get rank sort icon
  const getRankSortIcon = () => {
    if (rankSortDirection === 'asc') {
      return <FaSortUp className="ml-1 inline cursor-pointer text-green-500" />;
    }
    return <FaSortDown className="ml-1 inline cursor-pointer text-green-500" />;
  };
  
  // Table animation variants
  const tableVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };
  
  // Search input animation variants
  const searchVariants = {
    focused: { 
      scale: 1.02,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    },
    unfocused: { 
      scale: 1,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"
        ></motion.div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
          onClick={refreshData}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
      {/* Search Bar */}
      <div className="p-4 border-b ">
        <motion.div 
          className="relative"
          variants={searchVariants}
          animate={isSearchFocused ? 'focused' : 'unfocused'}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className={`${isSearchFocused ? 'text-green-500' : 'text-gray-400'} transition-colors duration-200`} />
          </div>
          <input
            type="text"
            placeholder="Cari dosen berdasarkan nama..."
            className="pl-10 pr-4 py-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchTerm && (
            <motion.div 
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button 
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                ×
              </button>
            </motion.div>
          )}
        </motion.div>
        
        {/* Search results count */}
        <AnimatePresence>
          {searchTerm && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-sm text-gray-500"
            >
              Ditemukan {filteredLecturers.length} dosen dengan nama mengandung "{searchTerm}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <motion.table 
          className="min-w-full divide-y divide-gray-200"
          variants={tableVariants}
          initial="hidden"
          animate="visible"
        >
          <thead className="bg-gradient-to-r from-green-100 to-teal-50">
            <tr>
              <th className="p-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                <div className="flex items-center justify-center cursor-pointer" onClick={handleRankSort}>
                  <div className="flex items-center">
                    <span className="mr-1">Peringkat</span>
                    {getRankSortIcon()}
                  </div>
                </div>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <div className="flex items-center">
                  <span>Nama Dosen</span>
                </div>
              </th>
              <th className="p-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSort('averageScore')}>
                  <span>Skor Rata-rata</span>
                  <SortButton 
                    active={sortConfig.key === 'averageScore'} 
                    direction={sortConfig.direction} 
                  />
                </div>
              </th>

              <th className="p-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                <div className="flex items-center justify-center">
                  <span>Jumlah Voters</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {filteredLecturers.length > 0 ? (
                // Apply rank sorting
                (rankSortDirection === 'asc' ? [...filteredLecturers] : [...filteredLecturers].reverse())
                  .map((lecturer, index) => (
                    <LeaderboardRow 
                      key={lecturer.nidn} 
                      lecturer={lecturer} 
                      rank={rankSortDirection === 'asc' ? index + 1 : filteredLecturers.length - index}
                      positionChange={getPositionChange(lecturer.nidn)}
                    />
                  ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FaSearch className="text-gray-300 text-4xl mb-2" />
                      <p className="text-lg">Tidak ada dosen yang ditemukan</p>
                      <p className="text-sm text-gray-400">Coba ubah kata kunci pencarian</p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </motion.table>
      </div>
      
      {/* Export and Legend */}
      <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <FaDownload /> Export Leaderboard
            </button>
            
            {showExportOptions && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-4 flex items-center gap-2"
              >
                <span className="text-gray-700 flex items-center gap-1">
                  <FaCalendarAlt /> Filter:
                </span>
                <select 
                  value={exportPeriod}
                  onChange={(e) => setExportPeriod(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="all">Semua Data</option>
                  <option value="day">Hari Ini</option>
                  <option value="week">Minggu Ini</option>
                  <option value="month">Bulan Ini</option>
                  <option value="year">Tahun Ini</option>
                  <option value="custom">Kustom...</option>
                </select>
                
                {exportPeriod === 'custom' && (
                  <div className="flex items-center gap-2 ml-2">
                    <input 
                      type="date" 
                      ref={startDateRef}
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <span>-</span>
                    <input 
                      type="date"
                      ref={endDateRef}
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-gray-700">Format:</span>
                  <div className="flex border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => setExportFormat('xlsx')}
                      className={`flex items-center gap-1 px-2 py-1 text-sm ${exportFormat === 'xlsx' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                    >
                      <FaFileExcel /> XLSX
                    </button>
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`flex items-center gap-1 px-2 py-1 text-sm ${exportFormat === 'csv' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                    >
                      <FaFileCsv /> CSV
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={async () => {
                    try {
                      // Tampilkan loading state
                      setIsSubmitting(true);
                      
                      // Buat URL untuk request ke backend
                      let url = `${apiUrl}/api/leaderboard/export?period=${exportPeriod}`;
                      
                      // Tambahkan parameter tanggal jika menggunakan filter kustom
                      if (exportPeriod === 'custom') {
                        url += `&start_date=${customDateRange.startDate}&end_date=${customDateRange.endDate}`;
                      }
                      
                      // Ambil data dari backend
                      const token = localStorage.getItem('access_token');
                      const response = await axios.get(url, {
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      });
                      
                      // Format data untuk export
                      const filteredData = response.data;
                      const formattedData = formatLeaderboardForExport(filteredData);
                      
                      // Buat nama file
                      let dateString;
                      if (exportPeriod === 'custom') {
                        const startDate = new Date(customDateRange.startDate);
                        const endDate = new Date(customDateRange.endDate);
                        dateString = getDateRangeString(startDate, endDate);
                      } else {
                        dateString = exportPeriod;
                      }
                      
                      const filename = `leaderboard_dosen_${dateString}_${new Date().toISOString().split('T')[0]}`;
                      
                      // Export ke format yang dipilih
                      if (exportFormat === 'xlsx') {
                        exportToXLSX(formattedData, filename, 'Leaderboard Dosen');
                      } else {
                        exportToCSV(formattedData, filename);
                      }
                      
                      // Tampilkan notifikasi sukses
                      toast.success(`Berhasil mengunduh leaderboard dalam format ${exportFormat.toUpperCase()}`);
                    } catch (error) {
                      console.error('Error exporting leaderboard:', error);
                      toast.error('Gagal mengunduh leaderboard. Silakan coba lagi.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded transition-colors duration-200 text-sm flex items-center gap-1"
                >
                  <FaDownload /> Download
                </button>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center justify-center font-bold">
            <span>Data diperbarui secara berkala. Peringkat dapat berubah berdasarkan penilaian terbaru</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTable;
