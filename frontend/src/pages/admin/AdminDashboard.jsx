import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentList from '../../components/admin/StudentList';
import LecturerList from '../../components/admin/LecturerList';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <StudentList />
        <LecturerList />
      </div>
    </div>
  );
};

export default AdminDashboard; 