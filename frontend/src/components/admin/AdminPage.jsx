import React, { useState } from 'react';
import StudentList from './StudentList';
import LecturerList from './LecturerList';
import CourseList from './CourseList';
import TeachingAssignmentList from './TeachingAssignmentList';
import ClassList from './ClassList';

const AdminPage = () => {
  const [editStudentId, setEditStudentId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('students');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return <StudentList onEdit={setEditStudentId} refreshTrigger={refreshTrigger} />;
      case 'lecturers':
        return <LecturerList />;
      case 'courses':
        return <CourseList />;
      case 'classes':
        return <ClassList />;
      case 'teaching':
        return <TeachingAssignmentList />;
      default:
        return <StudentList onEdit={setEditStudentId} refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Admin Dashboard</h1>
          
          <div className="flex flex-wrap justify-center mb-6 border-b">
            <button
              className={`px-4 py-2 mx-2 font-medium cursor-pointer ${activeTab === 'students' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'}`}
              onClick={() => setActiveTab('students')}
            >
              Students
            </button>
            <button
              className={`px-4 py-2 mx-2 font-medium cursor-pointer ${activeTab === 'lecturers' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'}`}
              onClick={() => setActiveTab('lecturers')}
            >
              Lecturers
            </button>
            <button
              className={`px-4 py-2 mx-2 font-medium cursor-pointer ${activeTab === 'courses' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'}`}
              onClick={() => setActiveTab('courses')}
            >
              Courses
            </button>
            <button
              className={`px-4 py-2 mx-2 font-medium cursor-pointer ${activeTab === 'classes' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'}`}
              onClick={() => setActiveTab('classes')}
            >
              Classes
            </button>
            <button
              className={`px-4 py-2 mx-2 font-medium cursor-pointer ${activeTab === 'teaching' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'}`}
              onClick={() => setActiveTab('teaching')}
            >
              Teaching Assignments
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
