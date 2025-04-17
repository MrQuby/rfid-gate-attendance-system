import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const AttendanceChart = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        // Get the current date
        const today = new Date();
        
        // Calculate the date for Monday of this week
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        monday.setHours(0, 0, 0, 0);
        
        // Create an array of weekdays
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const weekData = [];
        
        // For each day of the week (Monday to Friday)
        for (let i = 0; i < 5; i++) {
          const currentDate = new Date(monday);
          currentDate.setDate(monday.getDate() + i);
          
          // Format date as YYYY-MM-DD for query
          const dateString = currentDate.toISOString().split('T')[0];
          
          // Query for attendance records on this date
          const attendanceQuery = query(
            collection(db, 'attendance'),
            where('date', '==', dateString)
          );
          
          const snapshot = await getDocs(attendanceQuery);
          
          // Count present and absent
          let presentCount = 0;
          let absentCount = 0;
          
          snapshot.forEach(doc => {
            const record = doc.data();
            if (record.status === 'present') {
              presentCount++;
            } else if (record.status === 'absent') {
              absentCount++;
            }
          });
          
          // Add to week data
          weekData.push({
            day: weekdays[i],
            present: presentCount,
            absent: absentCount
          });
        }
        
        setAttendanceData(weekData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, []);

  // Custom Legend component
  const CustomLegend = () => {
    return (
      <div className="flex items-center justify-start gap-6 mb-4 ml-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FAE27C]"></div>
          <span className="text-xs text-gray-400">IN</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#C3EBFA]"></div>
          <span className="text-xs text-gray-400">OUT</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-semibold">Attendance</h1>
        <button className="focus:outline-none text-gray-400">
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>
      
      {/* Legend */}
      <CustomLegend />
      
      {/* CHART */}
      <div className="w-full h-[75%]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={attendanceData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              barGap={5}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                domain={[0, 'dataMax + 20']}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Bar 
                dataKey="present" 
                fill="#FAE27C" 
                radius={[4, 4, 0, 0]} 
                isAnimationActive={true}
              />
              <Bar 
                dataKey="absent" 
                fill="#C3EBFA" 
                radius={[4, 4, 0, 0]} 
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AttendanceChart;
