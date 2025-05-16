import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserTie } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const LecturerForm = ({ lecturerId, onSuccess }) => {
  const [lecturerData, setLecturerData] = useState({
    nidn: '',
    name: '',
    photo: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (lecturerId) {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      axios.get(`${apiUrl}/admin/lecturers/${lecturerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          setLecturerData({
            ...response.data,
            photo: null
          });
          if (response.data.photo_url) {
            setPreviewUrl(`${apiUrl}${response.data.photo_url}`);
          }
        })
        .catch(err => {
          console.error('Error fetching lecturer:', err);
          toast.error('Failed to fetch lecturer details');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [lecturerId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLecturerData({
      ...lecturerData,
      [name]: value
    });
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLecturerData(prev => ({
        ...prev,
        photo: file
      }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearForm = () => {
    setLecturerData({
      nidn: '',
      name: '',
      photo: null
    });
    setPreviewUrl(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!/^\d+$/.test(lecturerData.nidn)) {
      newErrors.nidn = 'NIDN must contain only numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    
    formData.append('nidn', lecturerData.nidn);
    formData.append('name', lecturerData.name);
    if (lecturerData.photo) {
      formData.append('photo', lecturerData.photo);
    }

    const method = lecturerId ? 'PUT' : 'POST';
    const url = lecturerId ? 
      `${apiUrl}/admin/lecturers/${lecturerId}` : 
      `${apiUrl}/admin/lecturers`;

    axios({
      method,
      url,
      data: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(response => {
        onSuccess();
        clearForm();
        toast.success(`Lecturer ${lecturerId ? 'updated' : 'added'} successfully`);
      })
      .catch(err => {
        const errorData = err.response?.data;
        
        if (errorData) {
          if (errorData.error && errorData.error.includes('UniqueViolation')) {
            const errorMessage = errorData.error.toLowerCase();
            const newErrors = {};

            if (errorMessage.includes('nidn')) {
              newErrors.nidn = 'NIDN already exists';
              toast.error('NIDN already exists');
            }

            if (Object.keys(newErrors).length > 0) {
              setErrors(newErrors);
              return;
            }
          }

          if (errorData.errors) {
            const newErrors = {};
            Object.keys(errorData.errors).forEach(key => {
              newErrors[key] = errorData.errors[key][0];
            });
            setErrors(newErrors);
            toast.error('Please check the form for errors');
            return;
          }

          if (errorData.message) {
            toast.error(errorData.message);
            return;
          }
        }

        toast.error(`Failed to ${lecturerId ? 'update' : 'add'} lecturer`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onSuccess();
    }
  };

  return (
    <div className="fixed  inset-0 backdrop-blur-sm shadow-lg bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{lecturerId ? 'Edit Lecturer' : 'Add Lecturer'}</h2>
          <button
            onClick={onSuccess}
            className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Photo</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-500">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FaUserTie className="text-gray-400 text-2xl" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 cursor-pointer
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    file:cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">Max size: 2MB</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">NIDN</label>
            <input
              type="text"
              name="nidn"
              value={lecturerData.nidn}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full p-2 border ${errors.nidn ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            />
            {errors.nidn && <p className="text-red-500 text-sm mt-1">{errors.nidn}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={lecturerData.name}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full p-2 cursor-pointer bg-green-500 text-white rounded-md disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center hover:bg-green-600 transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {lecturerId ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              lecturerId ? 'Update Lecturer' : 'Add Lecturer'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LecturerForm; 