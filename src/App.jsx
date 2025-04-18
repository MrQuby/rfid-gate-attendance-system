import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherStudents from './pages/teacher/TeacherStudents';
import RfidAttendanceMonitor from './pages/attendance/RfidAttendanceMonitor';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import AdminTeacher from './components/content/admin/TeacherContent';
import AdminDashboard from './components/content/admin/DashboardContent';
import AdminStudent from './components/content/admin/StudentContent';
import AdminCourses from './components/content/admin/CoursesContent';
import AdminClasses from './components/content/admin/ClassesContent';
import AdminDepartments from './components/content/admin/DepartmentsContent';
import './App.css';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Teacher Routes */}
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['teacher', 'departmentHead']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/teacher/students" 
          element={
            <ProtectedRoute allowedRoles={['teacher', 'departmentHead']}>
              <TeacherStudents />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes with Shared Layout */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route 
            path="dashboard" 
            element={<AdminDashboard />}
          />
          <Route 
            path="students" 
            element={<AdminStudent />}
          />
          <Route 
            path="teachers" 
            element={<AdminTeacher />}
          />
          <Route 
            path="departments" 
            element={<AdminDepartments />}
          />
          <Route 
            path="courses" 
            element={<AdminCourses />}
          />
          <Route 
            path="classes" 
            element={<AdminClasses />}
          />
          {/* Redirect to dashboard by default */}
          <Route index element={<AdminDashboard />} />
        </Route>
        
        {/* Attendance Monitor */}
        <Route path="/attendance" element={<RfidAttendanceMonitor />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
