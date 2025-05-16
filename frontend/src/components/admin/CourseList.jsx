import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { FaBook, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import CourseForm from './CourseForm';
import 'react-toastify/dist/ReactToastify.css';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editCourseId, setEditCourseId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'code',
    direction: 'asc'
  });
  const menuRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${apiUrl}/admin/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCourses(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses');
      toast.error('Failed to fetch courses');
    }
  };

  useEffect(() => {
    fetchCourses();
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

  const handleDelete = async (courseId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${apiUrl}/admin/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Course deleted successfully');
      setRefreshTrigger(prev => prev + 1);
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (err) {
      console.error('Error deleting course:', err);
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to delete course');
      }
    }
  };

  const handleEdit = (courseId) => {
    setEditCourseId(courseId);
    setShowForm(true);
    setOpenMenuIndex(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditCourseId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
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

  // Filter and search logic with sorting
  const filteredCourses = courses
    .filter(course => {
      return (
        course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortConfig.key === 'code') {
        return sortConfig.direction === 'asc' ? 
          a.code.localeCompare(b.code) : 
          b.code.localeCompare(a.code);
      }
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? 
          a.name.localeCompare(b.name) : 
          b.name.localeCompare(a.name);
      }
      return 0;
    });

  const totalEntries = filteredCourses.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Course Management</h2>
        <button
          onClick={() => {
            setEditCourseId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer"
        >
          Add Course
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('code')}>
                Code {getSortIcon('code')}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('name')}>
                Name {getSortIcon('name')}
              </th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCourses.map((course, idx) => (
              <tr key={course.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3">{course.code}</td>
                <td className="p-3">{course.name}</td>
                <td className="p-3">
                  {course.description ? 
                    (course.description.length > 50 ? 
                      `${course.description.substring(0, 50)}...` : 
                      course.description) : 
                    '-'}
                </td>
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
                        ${idx >= paginatedCourses.length - 2 ? 'bottom-0 mb-10' : 'mt-2'}`}
                    >
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleEdit(course.id)}
                      >
                        Update
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
                        onClick={() => handleDeleteClick(course)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedCourses.length === 0 && (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-500">
                  No courses found
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
            Showing {paginatedCourses.length} out of {totalEntries} entries
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

      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete course {courseToDelete.name} ({courseToDelete.code})?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(courseToDelete.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <CourseForm 
          courseId={editCourseId} 
          onSuccess={handleFormSuccess} 
        />
      )}
    </div>
  );
};

export default CourseList;
