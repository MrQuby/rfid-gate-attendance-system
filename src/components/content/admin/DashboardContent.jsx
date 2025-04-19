import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import StudentCountChart from '../../charts/StudentCountChart';
import AttendanceChart from '../../charts/AttendanceChart';

const DashboardContent = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }).toUpperCase();

  useEffect(() => {
    // Create queries for students and teachers
    const studentsQuery = query(collection(db, 'students'));
    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));

    // Set up real-time listeners
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setTotalStudents(snapshot.size);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching students:', error);
      setIsLoading(false);
    });

    const unsubscribeTeachers = onSnapshot(teachersQuery, (snapshot) => {
      setTotalTeachers(snapshot.size);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching teachers:', error);
      setIsLoading(false);
    });

    // Cleanup function to unsubscribe from listeners
    return () => {
      unsubscribeStudents();
      unsubscribeTeachers();
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-md shadow-md m-4 mt-0">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">{formattedDate}</p>
            <p className="text-sm font-semibold text-gray-700">{formattedTime}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-red-50 p-6 rounded-lg shadow border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-500 font-medium">Total Students</p>
                  <h3 className="text-2xl font-bold text-red-700">{totalStudents}</h3>
                </div>
                <div className="p-3 bg-red-500 rounded-full">
                  <i className="fas fa-user-graduate text-white"></i>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg shadow border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-500 font-medium">Total Teachers</p>
                  <h3 className="text-2xl font-bold text-orange-700">{totalTeachers}</h3>
                </div>
                <div className="p-3 bg-orange-500 rounded-full">
                  <i className="fas fa-chalkboard-teacher text-white"></i>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg shadow border border-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-500 font-medium">Active Courses</p>
                  <h3 className="text-2xl font-bold text-yellow-700">12</h3>
                </div>
                <div className="p-3 bg-yellow-500 rounded-full">
                  <i className="fas fa-book text-white"></i>
                </div>
              </div>
            </div>

            <div className="bg-rose-50 p-6 rounded-lg shadow border border-rose-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-rose-500 font-medium">Departments</p>
                  <h3 className="text-2xl font-bold text-rose-700">4</h3>
                </div>
                <div className="p-3 bg-rose-500 rounded-full">
                  <i className="fas fa-building text-white"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Student Distribution</h3>
              <div className="h-64">
                <StudentCountChart />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Weekly Attendance</h3>
              <div className="h-64">
                <AttendanceChart />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Sample activity log entries */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              New student registered
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Admin User</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10 minutes ago
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Course updated
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Teacher User</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2 hours ago
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardContent;
