import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

/**
 * AdminLayout component that serves as a template for all admin pages
 * It includes the sidebar and header components
 */
const AdminLayout = () => {
  const location = useLocation();
  
  // Determine the current page title based on the path
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/admin/dashboard') || path === '/admin') {
      return 'Dashboard';
    } else if (path.includes('/admin/students')) {
      return 'Student Management';
    } else if (path.includes('/admin/teachers')) {
      return 'Teacher Management';
    } else if (path.includes('/admin/departments')) {
      return 'Department Management';
    } else if (path.includes('/admin/courses')) {
      return 'Course Management';
    } else if (path.includes('/admin/classes')) {
      return 'Class Management';
    } else {
      return 'Admin Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
        <AdminHeader 
          title={getPageTitle()} 
        />
        
        {/* Content area where child routes will be rendered */}
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
