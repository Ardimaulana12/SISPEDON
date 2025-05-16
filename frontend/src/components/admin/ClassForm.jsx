import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSchool } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const ClassForm = ({ classId, onSuccess }) => {
  const [classData, setClassData] = useState({
    name: '',
    semester: '',
    academic_year: '',
    teaching_assignments: []
  });
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const apiUrl = import.meta.env.VITE_API_URL;

  // Generate academic year options (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 6 }, (_, i) => {
    const startYear = currentYear + i;
    return `${startYear}/${startYear + 1}`;
  });

  // Fetch lecturers and courses
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

  // Fetch class data if editing
  useEffect(() => {
    if (classId) {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      axios.get(`${apiUrl}/admin/classes/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          const data = response.data;
          setClassData({
            name: data.name,
            semester: data.semester,
            academic_year: data.academic_year,
            teaching_assignments: data.teaching_assignments || []
          });
        })
        .catch(err => {
          console.error('Error fetching class:', err);
          toast.error('Failed to fetch class details');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [classId, apiUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClassData({
      ...classData,
      [name]: value
    });
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTeachingAssignment = () => {
    if (!selectedLecturer || !selectedCourse) {
      toast.error('Please select both a lecturer and a course');
      return;
    }

    // Check if this assignment already exists
    const exists = classData.teaching_assignments.some(
      ta => ta.lecturer.id === parseInt(selectedLecturer) && ta.course.id === parseInt(selectedCourse)
    );

    if (exists) {
      toast.error('This lecturer and course combination already exists');
      return;
    }

    // Find the lecturer and course objects
    const lecturer = lecturers.find(l => l.nidn === parseInt(selectedLecturer));
    const course = courses.find(c => c.id === parseInt(selectedCourse));

    if (!lecturer || !course) {
      toast.error('Invalid lecturer or course selection');
      return;
    }

    // Add the new teaching assignment
    setClassData(prev => ({
      ...prev,
      teaching_assignments: [
        ...prev.teaching_assignments,
        {
          lecturer: {
            id: lecturer.nidn,
            name: lecturer.name
          },
          course: {
            id: course.id,
            name: course.name,
            code: course.code
          }
        }
      ]
    }));

    // Reset selections
    setSelectedLecturer('');
    setSelectedCourse('');
  };

  const handleRemoveTeachingAssignment = (index) => {
    setClassData(prev => ({
      ...prev,
      teaching_assignments: prev.teaching_assignments.filter((_, i) => i !== index)
    }));
  };

  const clearForm = () => {
    setClassData({
      name: '',
      semester: '',
      academic_year: '',
      teaching_assignments: []
    });
    setSelectedLecturer('');
    setSelectedCourse('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!classData.name.trim()) {
      newErrors.name = 'Class name is required';
    }
    
    if (!classData.semester) {
      newErrors.semester = 'Semester is required';
    } else if (parseInt(classData.semester) < 1 || parseInt(classData.semester) > 8) {
      newErrors.semester = 'Semester must be between 1 and 8';
    }
    
    if (!classData.academic_year) {
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
    
    // Format the data for the API
    const formattedData = {
      ...classData,
      teaching_assignments: classData.teaching_assignments.map(ta => ({
        lecturer_id: ta.lecturer.id,
        course_id: ta.course.id
      }))
    };
    
    const method = classId ? 'PUT' : 'POST';
    const url = classId ? 
      `${apiUrl}/admin/classes/${classId}` : 
      `${apiUrl}/admin/classes`;

    axios({
      method,
      url,
      data: formattedData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        onSuccess();
        clearForm();
        toast.success(`Class ${classId ? 'updated' : 'added'} successfully`);
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
      className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{classId ? 'Edit Class' : 'Add Class'}</h2>
          <button
            onClick={onSuccess}
            className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium">Class Name</label>
              <input
                type="text"
                name="name"
                value={classData.name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-black'} focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Semester</label>
              <select
                name="semester"
                value={classData.semester}
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

            <div>
              <label className="block text-sm font-medium">Academic Year</label>
              <select
                name="academic_year"
                value={classData.academic_year}
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
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Teaching Assignments</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium">Lecturer</label>
                <select
                  value={selectedLecturer}
                  onChange={(e) => setSelectedLecturer(e.target.value)}
                  disabled={isLoading}
                  className="w-full p-2 border border-black focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100"
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.nidn} value={lecturer.nidn}>
                      {lecturer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={isLoading}
                  className="w-full p-2 border border-black focus:ring-2 focus:ring-green-500 rounded-md disabled:bg-gray-100"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddTeachingAssignment}
                  disabled={isLoading}
                  className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Add Assignment
                </button>
              </div>
            </div>

            {/* Teaching Assignments List */}
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lecturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classData.teaching_assignments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                        No teaching assignments added yet
                      </td>
                    </tr>
                  ) : (
                    classData.teaching_assignments.map((assignment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assignment.lecturer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.course.name} ({assignment.course.code})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveTeachingAssignment(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
                {classId ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              classId ? 'Update Class' : 'Add Class'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClassForm;
