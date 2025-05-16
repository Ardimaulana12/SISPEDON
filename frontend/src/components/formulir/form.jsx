import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const Form = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const lecturer_id = params.get('lecturer_id');
  const class_id = params.get('class_id');
  const evaluation_id = params.get('evaluation_id'); // For editing existing evaluation
  
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!lecturer_id || !class_id) {
      toast.error("Silakan pilih dosen terlebih dahulu.");
      navigate('/lecturer');
      return;
    }
    
    const fetchQuestions = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const res = await axios.get(`${apiUrl}/api/questions`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setQuestions(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Gagal mengambil pertanyaan evaluasi.");
      }
    };
    
    // Jika ada evaluation_id, berarti ini mode edit
    const fetchExistingEvaluation = async () => {
      if (!evaluation_id) return;
      
      const token = localStorage.getItem('access_token');
      try {
        const res = await axios.get(`${apiUrl}/api/student/evaluation/${evaluation_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Set comment jika ada
        if (res.data.comment) {
          setComment(res.data.comment);
        }
        
        // Set answers jika ada
        if (res.data.answers) {
          setAnswers(res.data.answers);
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal mengambil data evaluasi yang ada.");
      }
    };
    
    fetchQuestions();
    fetchExistingEvaluation();
  }, [lecturer_id, class_id, evaluation_id, navigate, apiUrl]);  

  const handleChange = (questionId, answerId) => {
    setAnswers({ ...answers, [questionId]: answerId });
  };

  const isFormValid = questions.length > 0 && questions.every(q => answers[q.id]);

  // Function to open the confirmation modal
  const openConfirmModal = () => {
    if (!isFormValid) return;
    setShowModal(true);
  };

  // Function to close the confirmation modal
  const closeModal = () => {
    setShowModal(false);
  };
  
  // Function to open the cancel confirmation modal
  const openCancelModal = () => {
    setShowCancelModal(true);
  };

  // Function to close the cancel confirmation modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
  };
  
  // Function to handle cancellation and return to lecturer selection
  const handleCancel = () => {
    setShowCancelModal(false);
    navigate('/lecturer');
  };

  // Function to handle the actual submission after confirmation
  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    setShowModal(false);

    try {
      const token = localStorage.getItem('access_token');
      
      // Format answers data for the backend
      const formattedAnswers = Object.entries(answers).map(([questionId, answerId]) => ({
        question_id: parseInt(questionId),
        answer_id: parseInt(answerId)
      }));
      
      const payload = { 
        answers: formattedAnswers,
        comment 
      };
      
      console.log('Sending payload:', payload);
      
      // Jika evaluation_id ada, berarti ini mode edit
      if (evaluation_id) {
        const response = await axios.put(
          `${apiUrl}/api/student/evaluation/${evaluation_id}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        console.log('Update response:', response.data);
        
        // Show the updated score if available
        if (response.data && response.data.score) {
          toast.success(`Evaluasi berhasil diperbarui`);
        } else {
          toast.success('Evaluasi berhasil diperbarui.');
        }
        
        // Navigate to history page without forcing a reload
        navigate('/history', { state: { refreshData: true } });
      } else {
        // Mode baru
        const response = await axios.post(
          `${apiUrl}/api/submit-evaluation?lecturer_id=${lecturer_id}&class_id=${class_id}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        console.log('Evaluation submitted:', response.data);
        
        // Show score if available
        if (response.data && response.data.score) {
          toast.success(`Terima kasih sudah mengisi evaluasi`);
        } else {
          toast.success('Terima kasih sudah mengisi evaluasi.');
        }
        
        // Navigate to history page with state to indicate refresh is needed
        navigate('/history', { state: { refreshData: true } });
      }
      
      setAnswers({});
      setComment('');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengirim evaluasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pastikan progress selalu valid, hindari NaN
  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md border border-teal-100 p-6 sm:p-8"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-2">Formulir Evaluasi</h2>
            <div className="w-full bg-teal-50 rounded-full h-3 border border-teal-100">
              <motion.div
                className="bg-gradient-to-r from-teal-400 to-green-400 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${isNaN(progress) ? 0 : progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-teal-600 mt-2 font-medium">
              {Object.keys(answers).length} dari {questions.length} pertanyaan telah dijawab
            </p>
          </div>

          <div className="space-y-8">
            {questions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-teal-50 rounded-lg p-6 ${
                  answers[q.id] ? 'ring-2 ring-teal-400' : 'border border-teal-100'
                }`}
              >
                <p className="text-lg font-medium text-gray-900 mb-4">
                  {index + 1}. {q.text}
                </p>
                <div className="space-y-3">
                  {q.choices.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        answers[q.id] === c.id
                          ? 'border-teal-400 bg-teal-50'
                          : 'border-teal-100 hover:border-teal-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={c.id}
                        checked={answers[q.id] === c.id}
                        onChange={() => handleChange(q.id, c.id)}
                        className="w-5 h-5 text-teal-600 border-teal-300 focus:ring-teal-500"
                      />
                      <span className="ml-3 text-teal-800">{c.text}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Kolom Komentar */}
          <div className="mt-8">
            <label htmlFor="comment" className="block text-sm font-medium text-teal-700 mb-2">
              Komentar (Opsional)
            </label>
            <textarea
              id="comment"
              name="comment"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-teal-200 rounded-md shadow-sm bg-teal-50 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Berikan komentar atau masukan tambahan untuk dosen..."
            />
          </div>

          <div className="mt-8 flex justify-between ">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCancelModal}
              disabled={isSubmitting}
              className="px-6 py-3 bg-rose-400 cursor-pointer rounded-lg text-white font-medium flex items-center border border-rose-300 hover:bg-rose-500 shadow-sm"
            >
              <span>Batalkan</span>
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openConfirmModal}
              disabled={!isFormValid || isSubmitting}
              className={`px-6 py-3 rounded-lg text-white font-medium flex items-center shadow-sm ${
                !isFormValid || isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-green-500 cursor-pointer hover:from-teal-600 hover:to-green-600'
              }`}
            >
              {isSubmitting ? (
                <> 
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Mengirim...
                </>
              ) : (
                <>
                  <span>Kirim Evaluasi</span>
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
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Confirmation Modal for Submit */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Konfirmasi Pengiriman
                </h2>
                <p className="text-gray-700 mb-4">Apakah Anda yakin ingin mengirim evaluasi ini?</p>
                <p className="text-sm text-gray-600 mb-6">
                  Evaluasi yang sudah dikirim akan disimpan dan digunakan untuk penilaian dosen.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors duration-300"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Ya, Kirim Evaluasi'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Confirmation Modal for Cancel */}
        <AnimatePresence>
          {showCancelModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeCancelModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Konfirmasi Pembatalan
                </h2>
                <p className="text-gray-700 mb-4">Apakah Anda yakin ingin membatalkan evaluasi ini?</p>
                <p className="text-sm text-gray-600 mb-6">
                  Semua jawaban yang telah Anda isi akan hilang dan tidak akan disimpan.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={closeCancelModal}
                    className="px-4 py-2 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors duration-300"
                  >
                    Kembali ke Form
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 cursor-pointer bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300"
                  >
                    Ya, Batalkan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Form;
