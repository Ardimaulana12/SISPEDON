import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaBook } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const CourseForm = ({ courseId, onSuccess }) => {
  const [courseData, setCourseData] = useState({
    code: '',
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (courseId) {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      axios.get(`${apiUrl}/admin/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          setCourseData({
            code: response.data.code,
            name: response.data.name,
            description: response.data.description || ''
          });
        })
        .catch(err => {
          console.error('Error fetching course:', err);
          toast.error('Failed to fetch course details');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [courseId, apiUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData({
      ...courseData,
      [name]: value
    });
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const clearForm = () => {
    setCourseData({
      code: '',
      name: '',
      description: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!courseData.code.trim()) {
      newErrors.code = 'Course code is required';
    }
    
    if (!courseData.name.trim()) {
      newErrors.name = 'Course name is required';
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
    
    const method = courseId ? 'PUT' : 'POST';
    const url = courseId ? 
      `${apiUrl}/admin/courses/${courseId}` : 
      `${apiUrl}/admin/courses`;

    axios({
      method,
      url,
      data: courseData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        onSuccess();
        clearForm();
        toast.success(`Course ${courseId ? 'updated' : 'added'} successfully`);
      })
      .catch(err => {
        const errorData = err.response?.data;
        
        if (errorData && errorData.error) {
          toast.error(errorData.error);
          
          if (errorData.error.includes('code already exists')) {
            setErrors(prev => ({
              ...prev,
              code: 'Course code already exists'
            }));
          }
        } else {
          toast.error('An error occurred. Please try again.');
        }
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
    <div 
      className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{courseId ? 'Edit Course' : 'Add Course'}</h2>
          <button
            onClick={onSuccess}
            className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium">Course Code</label>
            <input
              type="text"
              name="code"
              value={courseData.code}
              onChange={handleInputChange}
              required
              disabled={isLoading || courseId} // Course code cannot be changed once created
              className={`w-full p-2 border ${errors.code ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Course Name</label>
            <input
              type="text"
              name="name"
              value={courseData.name}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Description (Optional)</label>
            <textarea
              name="description"
              value={courseData.description}
              onChange={handleInputChange}
              disabled={isLoading}
              rows={3}
              className="w-full p-2 border border-black focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100"
            />
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
                {courseId ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              courseId ? 'Update Course' : 'Add Course'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
