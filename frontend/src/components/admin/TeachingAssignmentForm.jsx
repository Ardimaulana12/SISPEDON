import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaChalkboardTeacher } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const TeachingAssignmentForm = ({ assignmentId, onSuccess }) => {
  const [formData, setFormData] = useState({
    lecturer_id: '',
    class_id: '',
    course_id: '',
    semester: '',
    academic_year: ''
  });
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const apiUrl = import.meta.env.VITE_API_URL;

  // Generate academic year options (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 6 }, (_, i) => {
    const startYear = currentYear + i;
    return `${startYear}/${startYear + 1}`;
  });

  // Fetch lecturers, classes, and courses
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      try {
        // Fetch lecturers
        const lecturersResponse = await axios.get(`${apiUrl}/lecturers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setLecturers(lecturersResponse.data);

        // Fetch classes
        const classesResponse = await axios.get(`${apiUrl}/admin/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        // Extract unique classes from students data
        const uniqueClasses = Array.from(
          new Set(classesResponse.data.map(student => student.class))
        ).filter(Boolean).map((className, index) => ({
          id: index + 1, // This is a simplification, you should use actual class IDs
          name: className
        }));
        setClasses(uniqueClasses);

        // Fetch courses
        const coursesResponse = await axios.get(`${apiUrl}/admin/courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCourses(coursesResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to fetch required data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  // Fetch assignment data if editing
  useEffect(() => {
    if (assignmentId) {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      axios.get(`${apiUrl}/admin/teaching-assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          const data = response.data;
          setFormData({
            lecturer_id: data.lecturer.id,
            class_id: data.class.id,
            course_id: data.course.id,
            semester: data.semester,
            academic_year: data.academic_year
          });
        })
        .catch(err => {
          console.error('Error fetching assignment:', err);
          toast.error('Failed to fetch assignment details');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [assignmentId, apiUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
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
    setFormData({
      lecturer_id: '',
      class_id: '',
      course_id: '',
      semester: '',
      academic_year: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.lecturer_id) {
      newErrors.lecturer_id = 'Lecturer is required';
    }
    
    if (!formData.class_id) {
      newErrors.class_id = 'Class is required';
    }
    
    if (!formData.course_id) {
      newErrors.course_id = 'Course is required';
    }
    
    if (!formData.semester) {
      newErrors.semester = 'Semester is required';
    }
    
    if (!formData.academic_year) {
      newErrors.academic_year = 'Academic year is required';
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
    
    const method = assignmentId ? 'PUT' : 'POST';
    const url = assignmentId ? 
      `${apiUrl}/admin/teaching-assignments/${assignmentId}` : 
      `${apiUrl}/admin/teaching-assignments`;

    axios({
      method,
      url,
      data: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        onSuccess();
        clearForm();
        toast.success(`Teaching assignment ${assignmentId ? 'updated' : 'added'} successfully`);
      })
      .catch(err => {
        const errorData = err.response?.data;
        
        if (errorData && errorData.error) {
          toast.error(errorData.error);
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
          <h2 className="text-xl font-semibold">
            {assignmentId ? 'Edit Teaching Assignment' : 'Add Teaching Assignment'}
          </h2>
          <button
            onClick={onSuccess}
            className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium">Lecturer</label>
            <select
              name="lecturer_id"
              value={formData.lecturer_id}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full p-2 border ${errors.lecturer_id ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            >
              <option value="">Select Lecturer</option>
              {lecturers.map(lecturer => (
                <option key={lecturer.nidn} value={lecturer.nidn}>
                  {lecturer.name} (NIDN: {lecturer.nidn})
                </option>
              ))}
            </select>
            {errors.lecturer_id && <p className="text-red-500 text-sm mt-1">{errors.lecturer_id}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Class</label>
            <select
              name="class_id"
              value={formData.class_id}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full p-2 border ${errors.class_id ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            >
              <option value="">Select Class</option>
              {classes.map(classItem => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
            {errors.class_id && <p className="text-red-500 text-sm mt-1">{errors.class_id}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Course</label>
            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full p-2 border ${errors.course_id ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
            {errors.course_id && <p className="text-red-500 text-sm mt-1">{errors.course_id}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Semester</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full p-2 border ${errors.semester ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
            {errors.semester && <p className="text-red-500 text-sm mt-1">{errors.semester}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Academic Year</label>
            <select
              name="academic_year"
              value={formData.academic_year}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full p-2 border ${errors.academic_year ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.academic_year && <p className="text-red-500 text-sm mt-1">{errors.academic_year}</p>}
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
                {assignmentId ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              assignmentId ? 'Update Assignment' : 'Add Assignment'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeachingAssignmentForm;
