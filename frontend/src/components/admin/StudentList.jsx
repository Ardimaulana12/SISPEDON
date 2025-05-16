import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import StudentForm from './StudentForm';

const StudentList = ({ onEdit, refreshTrigger }) => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });
  const apiUrl = import.meta.env.VITE_API_URL; 
  const menuRefs = useRef([]);

  const fetchStudents = () => {
    const token = localStorage.getItem('access_token');
    axios.get(`${apiUrl}/admin/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        setStudents(response.data);
        setError(null);
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        setError('Failed to fetch students');
        toast.error('Failed to fetch students');
      });
  };

  useEffect(() => {
    fetchStudents();
  }, [refreshTrigger]);

  // Close dropdown menu if click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (openMenuIndex !== null) {
        const menuEl = menuRefs.current[openMenuIndex];
        // Check if click is inside the dropdown or the three dots button
        if (menuEl && !menuEl.contains(event.target)) {
          // If the dropdown menu is open, check if the click is on a dropdown item
          const dropdownMenu = document.querySelector('.dropdown-menu');
          if (dropdownMenu && dropdownMenu.contains(event.target)) {
            // Let the button handler run first
            return;
          }
          setOpenMenuIndex(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuIndex]);

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
  const filteredStudents = students
    .filter(student => {
      return (
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.nim && student.nim.toString().includes(searchTerm)) ||
        (student.class && student.class.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => {
      if (sortConfig.key === 'nim') {
        return sortConfig.direction === 'asc' ? 
          a.nim - b.nim : 
          b.nim - a.nim;
      }
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? 
          a.name.localeCompare(b.name) : 
          b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'class') {
        return sortConfig.direction === 'asc' ? 
          (a.class || '').localeCompare(b.class || '') : 
          (b.class || '').localeCompare(a.class || '');
      }
      return 0;
    });

  const totalEntries = filteredStudents.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Modal handlers
  const handleAddNew = () => {
    setEditStudentId(null);
    setShowFormModal(true);
  };
  const handleEdit = (nim) => {
    console.log('Edit clicked', nim);
    setEditStudentId(nim);
    setShowFormModal(true);
    setOpenMenuIndex(null);
  };
  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditStudentId(null);
    fetchStudents();
  };
  const handleDelete = (student) => {
    console.log('Delete clicked', student);
    setStudentToDelete(student);
    setShowDeleteModal(true);
    setOpenMenuIndex(null);
  };
  const confirmDelete = () => {
    if (!studentToDelete) return;
    const token = localStorage.getItem('access_token');
    axios.delete(`${apiUrl}/admin/students/${studentToDelete.nim}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        fetchStudents();
        setError(null);
        toast.success('Student deleted successfully');
        setShowDeleteModal(false);
        setStudentToDelete(null);
      })
      .catch(err => {
        console.error('Error deleting student:', err);
        setError('Failed to delete student');
        toast.error('Failed to delete student');
      });
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-md">
      <h2 className="text-2xl font-bold mb-6">Student List</h2>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          className="ml-0 sm:ml-4 px-5 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-all cursor-pointer"
          onClick={handleAddNew}
        >
          + Add New Student
        </button>
      </div>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-md">
        <thead>
            <tr className="bg-blue-500 text-white">
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">
                <button 
                  onClick={() => handleSort('nim')}
                  className="flex items-center hover:text-gray-200 transition-colors cursor-pointer"
                >
                  NIM
                  {getSortIcon('nim')}
                </button>
              </th>
              <th className="p-3 text-left">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center hover:text-gray-200 transition-colors cursor-pointer"
                >
                  Name
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="p-3 text-left">
                <button 
                  onClick={() => handleSort('class')}
                  className="flex items-center hover:text-gray-200 transition-colors cursor-pointer"
                >
                  Class
                  {getSortIcon('class')}
                </button>
              </th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student, idx) => (
              <tr key={student.nim} className="border-b hover:bg-gray-50">
                <td className="p-3">{(currentPage - 1) * pageSize + idx + 1}.</td>
                <td className="p-3">{student.nim}</td>
                <td className="p-3">{student.name}</td>
                <td className="p-3">{student.class || '-'}</td>
                <td className="p-3 text-center relative">
                  <button
                    className="p-1 hover:bg-gray-200 rounded-full cursor-pointer"
                    onClick={() => {
                      console.log('Three dots clicked', idx);
                      setOpenMenuIndex(openMenuIndex === idx ? null : idx);
                    }}
                    ref={el => menuRefs.current[idx] = el}
                  >
                    <HiOutlineDotsVertical size={20} />
                  </button>
                  {/* Dropdown menu */}
                  {openMenuIndex === idx && (
                    <div
                      className={`absolute right-0 w-28 bg-white border border-gray-200 rounded shadow-lg z-10 dropdown-menu
                        ${idx >= paginatedStudents.length - 2 ? 'bottom-0 mb-10' : 'mt-2'}`}
                    >
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleEdit(student.nim)}
                      >
                        Update
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
                        onClick={() => handleDelete(student)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 text-sm">
        <div className="mb-2 sm:mb-0 text-gray-600">
          Showing {paginatedStudents.length} out of {totalEntries} entries
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
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
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

      {/* Modal for Add/Edit Student */}
      {showFormModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-2xl max-w-lg w-full mx-4 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-3xl w-10 h-10 flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-200 transition-all"
              onClick={() => { setShowFormModal(false); setEditStudentId(null); }}
              style={{ lineHeight: 1 }}
            >
              &times;
            </button>
            <StudentForm studentId={editStudentId} onSuccess={handleFormSuccess} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete student <span className="font-bold">{studentToDelete.name}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
