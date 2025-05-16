import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { FaSchool, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import ClassForm from './ClassForm';
import 'react-toastify/dist/ReactToastify.css';

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editClassId, setEditClassId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });
  const [filterConfig, setFilterConfig] = useState({
    semester: '',
    academicYear: ''
  });
  const menuRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Lists for filter dropdowns
  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [academicYears, setAcademicYears] = useState([]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${apiUrl}/admin/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setClasses(response.data);
      
      // Extract unique academic years for filtering
      const uniqueAcademicYears = [...new Set(response.data.map(c => c.academic_year))];
      setAcademicYears(uniqueAcademicYears);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to fetch classes');
      toast.error('Failed to fetch classes');
    }
  };

  useEffect(() => {
    fetchClasses();
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

  const handleDelete = async (classId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${apiUrl}/admin/classes/${classId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Class deleted successfully');
      setRefreshTrigger(prev => prev + 1);
      setShowDeleteModal(false);
      setClassToDelete(null);
    } catch (err) {
      console.error('Error deleting class:', err);
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to delete class');
      }
    }
  };

  const handleEdit = (classId) => {
    setEditClassId(classId);
    setShowForm(true);
    setOpenMenuIndex(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditClassId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteClick = (classObj) => {
    setClassToDelete(classObj);
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
      semester: '',
      academicYear: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filter and search logic with sorting
  const filteredClasses = classes
    .filter(classObj => {
      // Apply search term
      const searchFields = [
        classObj.name,
        `Semester ${classObj.semester}`,
        classObj.academic_year
      ];
      
      const matchesSearch = searchTerm === '' || 
        searchFields.some(field => 
          field.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Apply filters
      const matchesSemester = filterConfig.semester === '' || 
        classObj.semester.toString() === filterConfig.semester;
      
      const matchesAcademicYear = filterConfig.academicYear === '' || 
        classObj.academic_year === filterConfig.academicYear;
      
      return matchesSearch && matchesSemester && matchesAcademicYear;
    })
    .sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? 
          a.name.localeCompare(b.name) : 
          b.name.localeCompare(a.name);
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
      if (sortConfig.key === 'studentCount') {
        return sortConfig.direction === 'asc' ? 
          a.student_count - b.student_count : 
          b.student_count - a.student_count;
      }
      return 0;
    });

  const totalEntries = filteredClasses.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Class Management</h2>
        <button
          onClick={() => {
            setEditClassId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer"
        >
          Add Class
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          
          <div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('name')}>
                Class Name {getSortIcon('name')}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('semester')}>
                Semester {getSortIcon('semester')}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('academicYear')}>
                Academic Year {getSortIcon('academicYear')}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('studentCount')}>
                Students {getSortIcon('studentCount')}
              </th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClasses.map((classObj, idx) => (
              <tr key={classObj.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3">{classObj.name}</td>
                <td className="p-3">Semester {classObj.semester}</td>
                <td className="p-3">{classObj.academic_year}</td>
                <td className="p-3">{classObj.student_count || 0}</td>
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
                        ${idx >= paginatedClasses.length - 2 ? 'bottom-0 mb-10' : 'mt-2'}`}
                    >
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleEdit(classObj.id)}
                      >
                        Update
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
                        onClick={() => handleDeleteClick(classObj)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedClasses.length === 0 && (
              <tr>
                <td colSpan="5" className="p-3 text-center text-gray-500">
                  No classes found
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
            Showing {paginatedClasses.length} out of {totalEntries} entries
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

      {showDeleteModal && classToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete class {classToDelete.name}?
              <br />
              <span className="font-medium">Semester:</span> {classToDelete.semester}
              <br />
              <span className="font-medium">Academic Year:</span> {classToDelete.academic_year}
              <br />
              <span className="font-medium">Students:</span> {classToDelete.student_count || 0}
            </p>
            {classToDelete.student_count > 0 && (
              <p className="text-red-500 mb-4">
                Warning: This class has {classToDelete.student_count} students. You need to reassign them before deleting.
              </p>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setClassToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(classToDelete.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors cursor-pointer"
                disabled={classToDelete.student_count > 0}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <ClassForm 
          classId={editClassId} 
          onSuccess={handleFormSuccess} 
        />
      )}
    </div>
  );
};

export default ClassList;
