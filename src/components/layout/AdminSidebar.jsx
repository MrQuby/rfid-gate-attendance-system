import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import LogoutModal from '../modals/LogoutModal';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] bg-[#2C3E50] text-white">
      <div className="p-4">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
          <img src="/graduation-cap.svg" alt="Logo" className="w-8 h-8" />
          <h1 className="text-lg font-bold hidden md:hidden lg:block">SCC-ITECH SOCIETY</h1>
        </div>

        <nav className="space-y-2">
          <Link
            to="/admin/dashboard"
            className={`flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg ${
              currentPath === '/admin/dashboard' ? 'bg-blue-600' : 'hover:bg-blue-600'
            }`}
          >
            <i className="fas fa-th-large w-5 lg:w-6 text-center"></i>
            <span className="ml-4 hidden md:hidden lg:inline-block">Dashboard</span>
          </Link>

          <Link
            to="/admin/students"
            className={`flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg ${
              currentPath.startsWith('/admin/students') ? 'bg-blue-600' : 'hover:bg-blue-600'
            }`}
          >
            <i className="fas fa-user-graduate w-5 lg:w-6 text-center"></i>
            <span className="ml-4 hidden md:hidden lg:inline-block">Students</span>
          </Link>

          <Link
            to="/admin/teachers"
            className={`flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg ${
              currentPath.startsWith('/admin/teachers') ? 'bg-blue-600' : 'hover:bg-blue-600'
            }`}
          >
            <i className="fas fa-chalkboard-teacher w-5 lg:w-6 text-center"></i>
            <span className="ml-4 hidden md:hidden lg:inline-block">Teachers</span>
          </Link>

          <Link
            to="/admin/departments"
            className={`flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg ${
              currentPath.startsWith('/admin/departments') ? 'bg-blue-600' : 'hover:bg-blue-600'
            }`}
          >
            <i className="fas fa-building w-5 lg:w-6 text-center"></i>
            <span className="ml-4 hidden md:hidden lg:inline-block">Departments</span>
          </Link>

          <Link
            to="/admin/courses"
            className={`flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg ${
              currentPath.startsWith('/admin/courses') ? 'bg-blue-600' : 'hover:bg-blue-600'
            }`}
          >
            <i className="fas fa-book w-5 lg:w-6 text-center"></i>
            <span className="ml-4 hidden md:hidden lg:inline-block">Courses</span>
          </Link>

          <Link
            to="/admin/classes"
            className={`flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg ${
              currentPath.startsWith('/admin/classes') ? 'bg-blue-600' : 'hover:bg-blue-600'
            }`}
          >
            <i className="fas fa-chalkboard w-5 lg:w-6 text-center"></i>
            <span className="ml-4 hidden md:hidden lg:inline-block">Classes</span>
          </Link>

          <Link
            to="/admin/user-logs"
            className={`flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg ${
              currentPath.startsWith('/admin/user-logs') ? 'bg-blue-600' : 'hover:bg-blue-600'
            }`}
          >
            <i className="fas fa-history w-5 lg:w-6 text-center"></i>
            <span className="ml-4 hidden md:hidden lg:inline-block">User Logs</span>
          </Link>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg text-red-300 hover:bg-red-600 hover:text-white"
          >
            <i className="fas fa-sign-out-alt w-5 lg:w-6 text-center"></i>
            <span className="ml-4 hidden md:hidden lg:inline-block">Logout</span>
          </button>
        </nav>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default AdminSidebar;
