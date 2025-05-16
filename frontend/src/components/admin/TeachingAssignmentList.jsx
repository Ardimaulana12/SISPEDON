import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { FaChalkboardTeacher, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import TeachingAssignmentForm from './TeachingAssignmentForm';
import 'react-toastify/dist/ReactToastify.css';

const TeachingAssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'lecturer',
    direction: 'asc'
  });
  const [filterConfig, setFilterConfig] = useState({
    lecturer: '',
    class: '',
    course: '',
    semester: '',
    academicYear: ''
  });
  const menuRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Lists for filter dropdowns
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [academicYears, setAcademicYears] = useState([]);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${apiUrl}/admin/teaching-assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAssignments(response.data);
      
      // Extract unique values for filters
      const uniqueLecturers = [...new Set(response.data.map(a => a.lecturer.id))];
      const uniqueClasses = [...new Set(response.data.map(a => a.class.id))];
      const uniqueCourses = [...new Set(response.data.map(a => a.course.id))];
      const uniqueAcademicYears = [...new Set(response.data.map(a => a.academic_year))];
      
      // Fetch lecturer details
      const lecturerResponse = await axios.get(`${apiUrl}/lecturers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLecturers(lecturerResponse.data.filter(l => uniqueLecturers.includes(l.nidn)));
      
      // Set academic years
      setAcademicYears(uniqueAcademicYears);
      
      // For classes and courses, we'll need to fetch them separately
      // This is a simplified approach
      setClasses(response.data.map(a => a.class).filter((c, i, self) => 
        i === self.findIndex(t => t.id === c.id)
      ));
      
      setCourses(response.data.map(a => a.course).filter((c, i, self) => 
        i === self.findIndex(t => t.id === c.id)
      ));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to fetch teaching assignments');
      toast.error('Failed to fetch teaching assignments');
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [refreshTrigger, apiUrl]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async (assignmentId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${apiUrl}/admin/teaching-assignments/${assignmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Teaching assignment deleted successfully');
      setRefreshTrigger(prev => prev + 1);
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
    } catch (err) {
      console.error('Error deleting assignment:', err);
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to delete teaching assignment');
      }
    }
  };

  const handleEdit = (assignmentId) => {
    setEditAssignmentId(assignmentId);
    setShowForm(true);
    setOpenMenuIndex(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditAssignmentId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteClick = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
    setOpenMenuIndex(null);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="ml-1 inline cursor-pointer" />;
    }
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="ml-1 inline cursor-pointer" /> : 
      <FaSortDown className="ml-1 inline cursor-pointer" />;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterConfig({
      ...filterConfig,
      [name]: value
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const resetFilters = () => {
    setFilterConfig({
      lecturer: '',
      class: '',
      course: '',
      semester: '',
      academicYear: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filter and search logic with sorting
  const filteredAssignments = assignments
    .filter(assignment => {
      // Apply search term
      const searchFields = [
        assignment.lecturer.name,
        assignment.class.name,
        assignment.course.name,
        assignment.course.code,
        `Semester ${assignment.semester}`,
        assignment.academic_year
      ];
      
      const matchesSearch = searchTerm === '' || 
        searchFields.some(field => 
          field.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Apply filters
      const matchesLecturer = filterConfig.lecturer === '' || 
        assignment.lecturer.id.toString() === filterConfig.lecturer;
      
      const matchesClass = filterConfig.class === '' || 
        assignment.class.id.toString() === filterConfig.class;
      
      const matchesCourse = filterConfig.course === '' || 
        assignment.course.id.toString() === filterConfig.course;
      
      const matchesSemester = filterConfig.semester === '' || 
        assignment.semester.toString() === filterConfig.semester;
      
      const matchesAcademicYear = filterConfig.academicYear === '' || 
        assignment.academic_year === filterConfig.academicYear;
      
      return matchesSearch && matchesLecturer && matchesClass && 
        matchesCourse && matchesSemester && matchesAcademicYear;
    })
    .sort((a, b) => {
      if (sortConfig.key === 'lecturer') {
        return sortConfig.direction === 'asc' ? 
          a.lecturer.name.localeCompare(b.lecturer.name) : 
          b.lecturer.name.localeCompare(a.lecturer.name);
      }
      if (sortConfig.key === 'class') {
        return sortConfig.direction === 'asc' ? 
          a.class.name.localeCompare(b.class.name) : 
          b.class.name.localeCompare(a.class.name);
      }
      if (sortConfig.key === 'course') {
        return sortConfig.direction === 'asc' ? 
          a.course.name.localeCompare(b.course.name) : 
          b.course.name.localeCompare(a.course.name);
      }
      if (sortConfig.key === 'semester') {
        return sortConfig.direction === 'asc' ? 
          a.semester - b.semester : 
          b.semester - a.semester;
      }
      if (sortConfig.key === 'academicYear') {
        return sortConfig.direction === 'asc' ? 
          a.academic_year.localeCompare(b.academic_year) : 
          b.academic_year.localeCompare(a.academic_year);
      }
      return 0;
    });

  const totalEntries = filteredAssignments.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const paginatedAssignments = filteredAssignments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Teaching Assignment Management</h2>
        <button
          onClick={() => {
            setEditAssignmentId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer"
        >
          Add Teaching Assignment
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Lecturer Filter */}
          <div>
            <select
              name="lecturer"
              value={filterConfig.lecturer}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Lecturers</option>
              {lecturers.map(lecturer => (
                <option key={lecturer.nidn} value={lecturer.nidn}>
                  {lecturer.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Class Filter */}
          <div>
            <select
              name="class"
              value={filterConfig.class}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Classes</option>
              {classes.map(classItem => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Course Filter */}
          <div>
            <select
              name="course"
              value={filterConfig.course}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          
          {/* Semester Filter */}
          <div>
            <select
              name="semester"
              value={filterConfig.semester}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Semesters</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </div>
          
          {/* Academic Year Filter */}
          <div>
            <select
              name="academicYear"
              value={filterConfig.academicYear}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Academic Years</option>
              {academicYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('lecturer')}>
                Lecturer {getSortIcon('lecturer')}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('class')}>
                Class {getSortIcon('class')}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('course')}>
                Course {getSortIcon('course')}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('semester')}>
                Semester {getSortIcon('semester')}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('academicYear')}>
                Academic Year {getSortIcon('academicYear')}
              </th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAssignments.map((assignment, idx) => (
              <tr key={assignment.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3">{assignment.lecturer.name}</td>
                <td className="p-3">{assignment.class.name}</td>
                <td className="p-3">
                  <div>{assignment.course.name}</div>
                  <div className="text-xs text-gray-500">{assignment.course.code}</div>
                </td>
                <td className="p-3">Semester {assignment.semester}</td>
                <td className="p-3">{assignment.academic_year}</td>
                <td className="p-3 text-center relative">
                  <button
                    className="p-1 hover:bg-gray-200 rounded-full cursor-pointer"
                    onClick={() => setOpenMenuIndex(openMenuIndex === idx ? null : idx)}
                  >
                    <HiOutlineDotsVertical size={20} />
                  </button>
                  {openMenuIndex === idx && (
                    <div
                      ref={menuRef}
                      className={`absolute right-0 w-28 bg-white border border-gray-200 rounded shadow-lg z-10 dropdown-menu
                        ${idx >= paginatedAssignments.length - 2 ? 'bottom-0 mb-10' : 'mt-2'}`}
                    >
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleEdit(assignment.id)}
                      >
                        Update
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
                        onClick={() => handleDeleteClick(assignment)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedAssignments.length === 0 && (
              <tr>
                <td colSpan="6" className="p-3 text-center text-gray-500">
                  No teaching assignments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalEntries > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 text-sm">
          <div className="mb-2 sm:mb-0 text-gray-600">
            Showing {paginatedAssignments.length} out of {totalEntries} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              className="px-2 py-1 rounded hover:bg-gray-200 cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  currentPage === i + 1 ? 'bg-green-600 text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-2 py-1 rounded hover:bg-gray-200 cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && assignmentToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete this teaching assignment?
              <br />
              <span className="font-medium">Lecturer:</span> {assignmentToDelete.lecturer.name}
              <br />
              <span className="font-medium">Class:</span> {assignmentToDelete.class.name}
              <br />
              <span className="font-medium">Course:</span> {assignmentToDelete.course.name}
              <br />
              <span className="font-medium">Semester:</span> {assignmentToDelete.semester}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAssignmentToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(assignmentToDelete.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <TeachingAssignmentForm 
          assignmentId={editAssignmentId} 
          onSuccess={handleFormSuccess} 
        />
      )}
    </div>
  );
};

export default TeachingAssignmentList;
