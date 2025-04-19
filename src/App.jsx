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
import TeacherContent from './components/content/TeacherContent';
import DashboardContent from './components/content/DashboardContent';
import StudentContent from './components/content/StudentContent';
import CoursesContent from './components/content/CoursesContent';
import ClassesContent from './components/content/ClassesContent';
import DepartmentsContent from './components/content/DepartmentsContent';
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
            element={<DashboardContent />}
          />
          <Route 
            path="students" 
            element={<StudentContent />}
          />
          <Route 
            path="teachers" 
            element={<TeacherContent />}
          />
          <Route 
            path="departments" 
            element={<DepartmentsContent />}
          />
          <Route 
            path="courses" 
            element={<CoursesContent />}
          />
          <Route 
            path="classes" 
            element={<ClassesContent />}
          />
          {/* Redirect to dashboard by default */}
          <Route index element={<DashboardContent />} />
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
