import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { FaUserTie, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import LecturerForm from './LecturerForm';
import 'react-toastify/dist/ReactToastify.css';

const LecturerList = () => {
  const [lecturers, setLecturers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editLecturerId, setEditLecturerId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lecturerToDelete, setLecturerToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchLecturers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${apiUrl}/lecturers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLecturers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching lecturers:', err);
      setError('Failed to fetch lecturers');
      toast.error('Failed to fetch lecturers');
    }
  };

  useEffect(() => {
    fetchLecturers();
  }, [refreshTrigger]);

  const handleDelete = async (nidn) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${apiUrl}/admin/lecturers/${nidn}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Lecturer deleted successfully');
      setRefreshTrigger(prev => prev + 1);
      setShowDeleteModal(false);
      setLecturerToDelete(null);
    } catch (err) {
      console.error('Error deleting lecturer:', err);
      toast.error('Failed to delete lecturer');
    }
  };

  const handleEdit = (nidn) => {
    setEditLecturerId(nidn);
    setShowForm(true);
    setOpenMenuIndex(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditLecturerId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteClick = (lecturer) => {
    setLecturerToDelete(lecturer);
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
  const filteredLecturers = lecturers
    .filter(lecturer => {
      return (
        lecturer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lecturer.nidn && lecturer.nidn.toString().includes(searchTerm))
      );
    })
    .sort((a, b) => {
      if (sortConfig.key === 'nidn') {
        return sortConfig.direction === 'asc' ? 
          a.nidn - b.nidn : 
          b.nidn - a.nidn;
      }
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? 
          a.name.localeCompare(b.name) : 
          b.name.localeCompare(a.name);
      }
      return 0;
    });

  const totalEntries = filteredLecturers.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const paginatedLecturers = filteredLecturers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  // Function to extract proper initials from lecturer name
  const getInitials = (name) => {
    // Split name by space
    const nameParts = name.trim().split(' ');

    // Ambil dua bagian pertama yang bukan gelar
    const filteredParts = nameParts.filter(part => !part.match(/^(Dr\.?|Prof\.?|M\.Kom\.?|M\.T\.?|M\.Sc\.?|M\.Eng\.?|Ph\.D\.?|S\.Pd\.?|S\.Kom\.?|S\.T\.?)$/i));

    // Ambil maksimal 2 inisial pertama
    return filteredParts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
  };
  const handleClickOutside = (e) => {
    if (!e.target.closest('.dropdown-menu')) {
      setOpenMenuIndex(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="p-6 bg-white shadow-lg rounded-md ">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Lecturer List</h2>
      </div>
      
      {showForm && (
        <div className="mb-8">
          <LecturerForm
            lecturerId={editLecturerId}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}
      
      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search lecturers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditLecturerId(null);
          }}
          className="px-5 py-2 bg-green-500 text-white rounded-md font-semibold hover:bg-green-700 transition-all cursor-pointer"
        >
          + Add New Lecturer
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Lecturers Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-md">
          <thead>
            <tr className="bg-green-500 text-white">
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Photo</th>
              <th className="p-3 text-left">
                <button 
                  onClick={() => handleSort('nidn')}
                  className="flex items-center hover:text-gray-200 transition-colors cursor-pointer"
                >
                  NIDN
                  {getSortIcon('nidn')}
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
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLecturers.map((lecturer, idx) => (
              <tr key={lecturer.nidn} className="border-b hover:bg-gray-50">
                <td className="p-3">{(currentPage - 1) * pageSize + idx + 1}.</td>
                <td className="p-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500 flex items-center justify-center">
                    {lecturer.photo_url ? (
                      <img
                        src={`${apiUrl}${lecturer.photo_url}`}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${getInitials(lecturer.name)}&background=random`;
                        }}                      />
                    ) : (
                      <FaUserTie className="text-gray-400 text-xl" />
                    )}
                  </div>
                </td>
                <td className="p-3">{lecturer.nidn}</td>
                <td className="p-3">{lecturer.name}</td>
                <td className="p-3 text-center relative">
                  <button
                    className="p-1 hover:bg-gray-200 rounded-full cursor-pointer"
                    onClick={() => setOpenMenuIndex(openMenuIndex === idx ? null : idx)}
                  >
                    <HiOutlineDotsVertical size={20} />
                  </button>
                  {openMenuIndex === idx && (
                    <div
                      className={`absolute right-0 w-28 bg-white border border-gray-200 rounded shadow-lg z-10 dropdown-menu
                        ${idx >= paginatedLecturers.length - 2 ? 'bottom-0 mb-10' : 'mt-2'}`}
                    >
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleEdit(lecturer.nidn)}
                      >
                        Update
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
                        onClick={() => handleDeleteClick(lecturer)}
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 text-sm">
        <div className="mb-2 sm:mb-0 text-gray-600">
          Showing {paginatedLecturers.length} out of {totalEntries} entries
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

      {showDeleteModal && lecturerToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete lecturer {lecturerToDelete.name} (NIDN: {lecturerToDelete.nidn})?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setLecturerToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(lecturerToDelete.nidn)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors cursor-pointer"
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

export default LecturerList; 