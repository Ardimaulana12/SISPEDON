import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const SelectLecturer = () => {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`${apiUrl}/api/my-lecturers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLecturers(res.data);
      } catch (error) {
        console.error('Error fetching lecturers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLecturers();
  }, []);

  const handleSelect = (lecturer) => {
    setSelectedLecturer(lecturer);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (selectedLecturer) {
      navigate(`/form?lecturer_id=${selectedLecturer.nidn}&class_id=${selectedLecturer.class_id}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLecturer(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Pilih Dosen untuk Penilaian
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lecturers.map((lecturer, index) => (
            <motion.div
              key={`${lecturer.nidn}_${lecturer.class_id}_${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="aspect-w-1 aspect-h-1">
                <img
                  src={lecturer.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lecturer.name)}&background=random`}
                  alt={lecturer.name}
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {lecturer.name}
                </h2>
                <div className="space-y-1 mb-4">
                  <p className="text-gray-700">
                    <span className="font-medium">Mata Kuliah:</span> {lecturer.course_name || 'Tidak ada data'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Semester:</span> {lecturer.semester || '-'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Tahun Akademik:</span> {lecturer.academic_year || '-'}
                  </p>
                </div>
                
                <button
                  onClick={() => handleSelect(lecturer)}
                  className="w-full cursor-pointer bg-black text-white py-2 px-4 rounded-md hover:bg-gray-900 transition-colors duration-300 flex items-center justify-center"
                >
                  <span>Isi Form Penilaian</span>
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Konfirmasi Penilaian
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{selectedLecturer?.name}</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Mata Kuliah:</span> {selectedLecturer?.course_name || 'Tidak ada data'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Semester:</span> {selectedLecturer?.semester || '-'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Tahun Akademik:</span> {selectedLecturer?.academic_year || '-'}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin melanjutkan penilaian untuk dosen ini?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
                >
                  Lanjutkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectLecturer;
