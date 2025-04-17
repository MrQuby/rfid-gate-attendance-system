import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const StudentCountChart = () => {
  const [studentData, setStudentData] = useState({
    total: 0,
    boys: 0,
    girls: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentsQuery = collection(db, 'students');
    
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const total = snapshot.size;
      let boys = 0;
      let girls = 0;
      
      snapshot.forEach(doc => {
        const student = doc.data();
        if (student.gender === 'male') {
          boys++;
        } else if (student.gender === 'female') {
          girls++;
        }
      });
      
      setStudentData({ total, boys, girls });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching students:', error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const boysPercentage = calculatePercentage(studentData.boys, studentData.total);
  const girlsPercentage = calculatePercentage(studentData.girls, studentData.total);

  // Create data for the outer pie chart (boys)
  const outerData = [
    { name: 'Boys', value: studentData.boys, color: '#C3EBFA' },
    { name: 'Empty', value: studentData.total > 0 ? studentData.total - studentData.boys : 100, color: '#F3F4F6' }
  ];

  // Create data for the inner pie chart (girls)
  const innerData = [
    { name: 'Girls', value: studentData.girls, color: '#FAE27C' },
    { name: 'Empty', value: studentData.total > 0 ? studentData.total - studentData.girls : 100, color: '#F3F4F6' }
  ];

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold">Students</h1>
        <button className="focus:outline-none text-gray-400">
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>
      
      {/* CHART */}
      <div className="relative w-full h-[65%]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Outer pie chart (boys) */}
              <Pie
                data={outerData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                paddingAngle={0}
                isAnimationActive={true}
              >
                {outerData.map((entry, index) => (
                  <Cell key={`outer-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              
              {/* Inner pie chart (girls) */}
              <Pie
                data={innerData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                paddingAngle={0}
                isAnimationActive={true}
              >
                {innerData.map((entry, index) => (
                  <Cell key={`inner-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
        
        {/* Center icons */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2">
          <i className="fas fa-male text-[#C3EBFA] text-2xl"></i>
          <i className="fas fa-female text-[#FAE27C] text-2xl"></i>
        </div>
      </div>
      
      {/* BOTTOM */}
      <div className="flex justify-center gap-16 mt-4">
        <div className="flex flex-col items-center">
          <div className="w-4 h-4 bg-[#C3EBFA] rounded-full mb-1"></div>
          <h1 className="font-bold text-lg">{studentData.boys.toLocaleString()}</h1>
          <h2 className="text-xs text-gray-400">Boys ({boysPercentage}%)</h2>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-4 h-4 bg-[#FAE27C] rounded-full mb-1"></div>
          <h1 className="font-bold text-lg">{studentData.girls.toLocaleString()}</h1>
          <h2 className="text-xs text-gray-400">Girls ({girlsPercentage}%)</h2>
        </div>
      </div>
    </div>
  );
};

export default StudentCountChart;
