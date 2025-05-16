import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaIdCard, FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../components/AuthProvider';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(`${apiUrl}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(response.data);
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Gagal memuat profil pengguna');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [apiUrl, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 py-4 px-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FaUser className="mr-2" /> Profil Pengguna
          </h2>
        </div>

        {userData ? (
          <div className="py-6 px-8">
            <div className="flex justify-center mb-6">
              {userData.username ? (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {userData.username.split(' ').map(name => name[0]).join('').toUpperCase().substring(0, 2)}
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                  <FaUser className="text-4xl text-green-600" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <FaIdCard className="text-green-600 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium">{userData.name || userData.username}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FaEnvelope className="text-green-600 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FaUser className="text-green-600 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium capitalize">{userData.role}</p>
                </div>
              </div>

              {userData.nim && (
                <div className="flex items-start">
                  <FaIdCard className="text-green-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">NIM</p>
                    <p className="font-medium">{userData.nim}</p>
                  </div>
                </div>
              )}

              {userData.class_name && (
                <div className="flex items-start">
                  <FaGraduationCap className="text-green-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Kelas</p>
                    <p className="font-medium">{userData.class_name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Kembali
              </button>
              <button
                onClick={() => navigate('/change-password')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Ganti Password
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 px-8 text-center">
            <p className="text-gray-500">Tidak dapat memuat data profil</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Kembali
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
