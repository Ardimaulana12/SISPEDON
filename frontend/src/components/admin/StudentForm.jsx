import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StudentForm = ({ studentId, onSuccess }) => {
  const [studentData, setStudentData] = useState({
    nim: '',
    name: '',
    email: '',
    password: '',
    classId: ''
  });

  const [classes, setClasses] = useState([]);
  const [newStudent, setNewStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const apiUrl = import.meta.env.VITE_API_URL; 

  // Fetch all classes for dropdown
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    axios.get(`${apiUrl}/admin/classes-dropdown`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        setClasses(response.data);
      })
      .catch(err => {
        console.error('Error fetching classes:', err);
        toast.error('Failed to fetch classes');
      });
  }, []);

  // Fetch student data if editing
  useEffect(() => {
    if (studentId) {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      axios.get(`${apiUrl}/admin/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          setStudentData({
            ...response.data,
            classId: response.data.class_id
          });
        })
        .catch(err => {
          console.error('Error fetching student:', err);
          console.error('Error details:', err.response?.data);
          toast.error('Failed to fetch student details');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [studentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudentData({
      ...studentData,
      [name]: value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const clearForm = () => {
    setStudentData({
      nim: '',
      name: '',
      email: '',
      password: '',
      classId: ''
    });
    setNewStudent(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate NIM (must be numeric)
    if (!/^\d+$/.test(studentData.nim)) {
      newErrors.nim = 'NIM must contain only numbers';
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate class selection
    if (!studentData.classId) {
      newErrors.classId = 'Please select a class';
    }

    // Validate password (minimum 6 characters)
    if (!studentId && studentData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
    const method = studentId ? 'PUT' : 'POST';
    const url = studentId ? `${apiUrl}/admin/students/${studentId}` : `${apiUrl}/admin/students`;
    const token = localStorage.getItem('access_token'); 

    const requestData = {
      nim: studentData.nim,
      name: studentData.name,
      email: studentData.email,
      password: studentData.password,
      class_id: parseInt(studentData.classId)
    };

    axios({
      method,
      url,
      data: requestData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        setNewStudent(true);
        onSuccess();
        clearForm();
        toast.success(`Student ${studentId ? 'updated' : 'added'} successfully`);
      })
      .catch(err => {
        const errorData = err.response?.data;
        
        if (errorData) {
          // Handle PostgreSQL unique violation error
          if (errorData.error && errorData.error.includes('UniqueViolation')) {
            const errorMessage = errorData.error.toLowerCase();
            const newErrors = {};

            // Check for duplicate email/username
            if (errorMessage.includes('username_key') || errorMessage.includes('email')) {
              newErrors.email = 'Email already exists';
              toast.error('Email already exists');
            }
            // Check for duplicate NIM
            else if (errorMessage.includes('nim')) {
              newErrors.nim = 'NIM already exists';
              toast.error('NIM already exists');
            }

            if (Object.keys(newErrors).length > 0) {
              setErrors(newErrors);
              return;
            }
          }

          // Handle validation errors
          if (errorData.errors) {
            const newErrors = {};
            Object.keys(errorData.errors).forEach(key => {
              newErrors[key] = errorData.errors[key][0];
            });
            setErrors(newErrors);
            toast.error('Please check the form for errors');
            return;
          }

          // Handle other specific error messages
          if (errorData.message) {
            toast.error(errorData.message);
            return;
          }
        }

        // Generic error message if no specific error is found
        toast.error(`Failed to ${studentId ? 'update' : 'add'} student`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-lg rounded-md">
      <h2 className="text-xl font-semibold mb-4">{studentId ? 'Edit Student' : 'Add Student'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium">NIM</label>
          <input
            type="text"
            name="nim"
            value={studentData.nim}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={`w-full p-2 border ${errors.nim ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-gray-700 rounded-md disabled:bg-gray-100`}
          />
          {errors.nim && <p className="text-red-500 text-sm mt-1">{errors.nim}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={studentData.name}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-gray-700 rounded-md disabled:bg-gray-100`}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={studentData.email}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={`w-full p-2 border ${errors.email ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-gray-700 rounded-md disabled:bg-gray-100`}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={studentData.password}
            onChange={handleInputChange}
            required={!studentId}
            disabled={isLoading}
            className={`w-full p-2 border ${errors.password ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-gray-700 rounded-md disabled:bg-gray-100`}
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Class</label>
          <select
            name="classId"
            value={studentData.classId}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={`w-full p-2 border ${errors.classId ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-gray-700 rounded-md disabled:bg-gray-100`}
          >
            <option value="">Select a class</option>
            {classes.map(classItem => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.display_name}
              </option>
            ))}
          </select>
          {errors.classId && <p className="text-red-500 text-sm mt-1">{errors.classId}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full p-2 cursor-pointer bg-gradient-to-r from-gray-800 to-black text-white rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {studentId ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            studentId ? 'Update Student' : 'Add Student'
          )}
        </button>
      </form>

      {newStudent && (
        <div className="mt-4 p-4 border border-gray-700 rounded-md">
          <h3 className="text-lg font-semibold">Student {studentId ? 'Updated' : 'Added'} Successfully</h3>
          <p><strong>NIM:</strong> {studentData.nim}</p>
          <p><strong>Name:</strong> {studentData.name}</p>
          <p><strong>Email:</strong> {studentData.email}</p>
          <p><strong>Class:</strong> {
            classes.find(c => c.id === parseInt(studentData.classId))?.display_name || studentData.classId
          }</p>
        </div>
      )}
    </div>
  );
};

export default StudentForm;
