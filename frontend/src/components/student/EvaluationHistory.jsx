import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaHistory, FaEdit, FaCalendarAlt, FaBook, FaUser, FaStar, FaPencilAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import Loading from '../Loading';
import { DateTime } from 'luxon';

const EvaluationHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    score: 0,
    comment: ''
  });
  
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Fetch evaluation history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${apiUrl}/api/student/evaluation-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Check if we received data and process it
      if (response.data && Array.isArray(response.data)) {
        // Sort data by created_at date (newest first)
        const sortedData = [...response.data].sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setHistory(sortedData);
        
        // Log whether we're using real or dummy data
        const hasDummyData = sortedData.some(item => item.is_dummy);
      } else {
        setHistory([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching evaluation history:', err);
      setError('Failed to fetch evaluation history');
      toast.error('Failed to fetch evaluation history');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch evaluation details
  const fetchEvaluationDetails = async (evaluationId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${apiUrl}/api/student/evaluation/${evaluationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedEvaluation(response.data);
      setEditForm({
        score: response.data.score,
        comment: response.data.comment
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching evaluation details:', err);
      setError('Failed to fetch evaluation details');
      toast.error('Failed to fetch evaluation details');
    } finally {
      setLoading(false);
    }
  };
  
  // Update evaluation
  const updateEvaluation = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      await axios.put(`${apiUrl}/api/student/evaluation/${selectedEvaluation.id}`, editForm, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Evaluation updated successfully');
      setIsEditing(false);
      fetchHistory(); // Refresh the list
      setSelectedEvaluation(null);
    } catch (err) {
      console.error('Error updating evaluation:', err);
      setError('Failed to update evaluation');
      toast.error('Failed to update evaluation');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === 'score' ? parseInt(value, 10) : value
    });
  };
  
  // Format date with WIB timezone (UTC+7)
// Fungsi untuk memformat tanggal dengan zona waktu WIB (UTC+7)

const formatDate = (dateString) => {
  if (!dateString) return '';

  try {
    // Tangani format tanggal dari database (contoh: "2025-05-19 07:14:29.870937")
    const isoFormatted = dateString.replace(' ', 'T'); // Jadi: 2025-05-19T07:14:29.870937

    const dt = DateTime.fromISO(isoFormatted, { zone: 'utc' }) // anggap inputnya UTC
      .setZone('Asia/Jakarta'); // ubah ke WIB

    return dt.setLocale('id').toFormat("d MMMM yyyy 'pukul' HH:mm 'WIB'");
  } catch (error) {
    console.error('Luxon format error:', error);
    return dateString;
  }
};

  useEffect(() => {
    fetchHistory();
  }, []);
  
  // Handle refresh from form submission
  useEffect(() => {
    // Check if we have a refreshData state from navigation
    if (location.state && location.state.refreshData) {
      fetchHistory();
    }
  }, [location]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  if (loading && history.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center"
      >
        <FaHistory className="text-green-500 text-3xl mr-3" />
        <h1 className="text-2xl font-bold text-gray-800">Riwayat Evaluasi Dosen</h1>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evaluation List */}
        <motion.div 
          className="lg:col-span-1 bg-white rounded-lg shadow-md overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-gradient-to-r from-gray-800 to-black text-white p-4">
            <h2 className="font-bold text-lg">Daftar Evaluasi</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FaHistory className="text-gray-300 text-5xl mx-auto mb-3" />
              <p className="text-lg">Belum ada riwayat evaluasi</p>
              <p className="text-sm mt-2">Evaluasi yang Anda submit akan muncul di sini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {history.map((item) => (
                <motion.div 
                  key={item.id}
                  variants={itemVariants}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEvaluation && selectedEvaluation.id === item.id ? 'bg-gray-100 border-l-4 border-gray-800' : ''}`}
                  onClick={() => {
                    fetchEvaluationDetails(item.id);
                    setIsEditing(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    {item.is_dummy && (
                      <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Data Contoh
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.lecturer_name}</h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <FaBook className="mr-1 text-gray-700" /> {item.course_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <FaCalendarAlt className="mr-1 text-gray-400" /> {item.created_at_formatted || formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                      <FaStar className="text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">{item.score}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Evaluation Details */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {selectedEvaluation ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-black text-white p-4 flex justify-between items-center">
                <h2 className="font-bold text-lg">Detail Evaluasi</h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-white text-green-500 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                  >
                    <FaEdit className="mr-1" /> Edit
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Edit Evaluasi</h3>
                      <p className="text-gray-600 mb-4">Perbarui penilaian Anda untuk dosen {selectedEvaluation.lecturer_name}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Skor Penilaian</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          name="score"
                          value={editForm.score}
                          onChange={handleInputChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-2">
                          <span className="text-sm text-gray-500">0%</span>
                          <span className="text-lg font-bold text-green-500">{editForm.score}%</span>
                          <span className="text-sm text-gray-500">100%</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 mb-2">Komentar</label>
                        <textarea 
                          name="comment"
                          value={editForm.comment}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows="4"
                          placeholder="Berikan komentar tentang pengajaran dosen..."
                        ></textarea>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button 
                          onClick={updateEvaluation}
                          className="px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-md hover:bg-gray-700 transition-colors"
                          disabled={loading}
                        >
                          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{selectedEvaluation.lecturer_name}</h3>
                        <p className="text-gray-600">{selectedEvaluation.course_name}</p>
                      </div>
                      <div className="bg-green-100 px-4 py-2 rounded-lg">
                        <div className="text-sm text-gray-600">Skor</div>
                        <div className="text-2xl font-bold text-gray-800">{selectedEvaluation.score}%</div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Semester</p>
                          <p className="font-medium">{selectedEvaluation.semester}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tahun Akademik</p>
                          <p className="font-medium">{selectedEvaluation.academic_year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Dibuat Pada</p>
                          <p className="font-medium">{selectedEvaluation.created_at_formatted || formatDate(selectedEvaluation.created_at)}</p>
                        </div>
                        {selectedEvaluation.updated_at && (
                          <div>
                            <p className="text-sm text-gray-500">Diperbarui Pada</p>
                            <p className="font-medium">{selectedEvaluation.updated_at_formatted || formatDate(selectedEvaluation.updated_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Komentar</h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        {selectedEvaluation.comment ? (
                          <p className="text-gray-700">{selectedEvaluation.comment}</p>
                        ) : (
                          <p className="text-gray-400 italic">Tidak ada komentar</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          // Redirect ke form dengan mode edit
                          const lecturerId = selectedEvaluation.lecturer_nidn || selectedEvaluation.lecturer_id;
                          const classId = selectedEvaluation.class_id;
                          
                          if (lecturerId && classId) {
                            navigate(`/form?lecturer_id=${lecturerId}&class_id=${classId}&evaluation_id=${selectedEvaluation.id}`);
                          } else {
                            toast.error('Data dosen atau kelas tidak lengkap untuk mengedit evaluasi');
                            console.error('Missing lecturer_id or class_id for editing', selectedEvaluation);
                          }
                        }}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <FaPencilAlt className="mr-2" />
                        Edit Lengkap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FaHistory className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Pilih Evaluasi</h3>
              <p className="text-gray-500">Pilih salah satu evaluasi dari daftar untuk melihat detailnya</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EvaluationHistory;
