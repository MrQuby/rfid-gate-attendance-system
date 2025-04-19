import React, { useState, useEffect, useRef } from 'react';
import { subscribeToLatestAttendance, recordCheckIn, isStudentCheckedInToday, findStudentByRfidTag } from '../../api/attendance';
import { subscribeToCourses } from '../../api/courses';
import { subscribeToStudents } from '../../api/students';
import profileFemale from '../../assets/profile-female.png';
import profileMale from '../../assets/profile-male.png';
import unknownStudent from '../../assets/unknown.png';
import schoolLogo from '../../assets/SCC logo.png';
import backgroundImage from '../../assets/background.png';


const RfidAttendanceMonitor = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [lastStudent, setLastStudent] = useState(null); 
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastStatus, setLastStatus] = useState(''); // Track the last status (IN/OUT)
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rfidInput, setRfidInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentStudents, setRecentStudents] = useState([]); // Store previous students
  const [currentStudentId, setCurrentStudentId] = useState(null); // Track current student ID for filtering
  const scanTimeoutRef = useRef(null);
  const resetTimerRef = useRef(null);
  
  // We'll remove this effect as we only want to update recent students when a new student swipes
  // The logic for updating recent students will be handled in processRfidScan instead

  // Set default featured student
  const featuredStudent = currentStudent || lastStudent || {
    studentId: '',
    firstName: '',
    lastName: '',
    fullName: '',
    course: '',
    status: 'WAITING'
  };

  // Get the latest 7 attendance records for the table
  const latestAttendanceRecords = attendanceRecords.slice(0, 7);

  // Update current date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Subscribe to all attendance records with optimized local caching
  useEffect(() => {
    // Try to get cached records first for immediate display
    const cachedRecords = localStorage.getItem('attendanceRecords');
    if (cachedRecords) {
      try {
        const parsedRecords = JSON.parse(cachedRecords);
        setAttendanceRecords(parsedRecords);
      } catch (error) {
        console.error('Error parsing cached attendance records:', error);
        localStorage.removeItem('attendanceRecords'); // Remove invalid cache
      }
    }

    // Subscribe to real-time updates with a smaller limit for better performance
    const unsubscribe = subscribeToLatestAttendance(10, (records) => {
      setAttendanceRecords(records);
      
      // Use a try-catch block to handle potential storage errors
      try {
        localStorage.setItem('attendanceRecords', JSON.stringify(records));
      } catch (error) {
        console.error('Error caching attendance records:', error);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Subscribe to students data with optimized local caching
  useEffect(() => {
    // Try to get cached students first for immediate display
    const cachedStudents = localStorage.getItem('students');
    if (cachedStudents) {
      try {
        const parsedStudents = JSON.parse(cachedStudents);
        setStudents(parsedStudents);
      } catch (error) {
        console.error('Error parsing cached students:', error);
        localStorage.removeItem('students'); // Remove invalid cache
      }
    }

    // Create an index map for faster RFID lookups
    const createStudentIndex = (studentsList) => {
      // Pre-process student data for faster lookups
      const processedStudents = studentsList.map(student => ({
        ...student,
        // Pre-compute full name to avoid concatenation during rendering
        fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim()
      }));
      setStudents(processedStudents);
      
      // Cache the processed data
      try {
        localStorage.setItem('students', JSON.stringify(processedStudents));
      } catch (error) {
        console.error('Error caching students:', error);
      }
    };

    const unsubscribe = subscribeToStudents(createStudentIndex);
    
    return () => unsubscribe();
  }, []);

  // Subscribe to courses data with optimized local caching
  useEffect(() => {
    // Try to get cached courses first for immediate display
    const cachedCourses = localStorage.getItem('courses');
    if (cachedCourses) {
      try {
        const parsedCourses = JSON.parse(cachedCourses);
        setCourses(parsedCourses);
      } catch (error) {
        console.error('Error parsing cached courses:', error);
        localStorage.removeItem('courses'); // Remove invalid cache
      }
    }

    // Create a course map for faster lookups
    const createCourseMap = (coursesList) => {
      setCourses(coursesList);
      
      // Cache the course data
      try {
        localStorage.setItem('courses', JSON.stringify(coursesList));
      } catch (error) {
        console.error('Error caching courses:', error);
      }
    };

    const unsubscribe = subscribeToCourses(createCourseMap);
    
    return () => unsubscribe();
  }, []);


  // Set up keyboard event listener for RFID scanner with highly optimized performance
  useEffect(() => {
    // Create a buffer for RFID input to avoid excessive state updates
    let inputBuffer = '';
    let bufferTimer = null;
    
    const handleKeyPress = (e) => {
      // Only process if we're not already processing a scan and not in a form field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // If it's the first character of a new scan, start the timeout
      if (inputBuffer === '') {
        // Clear any existing timeout
        if (bufferTimer) {
          clearTimeout(bufferTimer);
        }
        
        // Set a timeout to process the complete scan (reduced to 200ms for faster response)
        bufferTimer = setTimeout(() => {
          if (inputBuffer.length > 0) {
            processRfidScan(inputBuffer);
            inputBuffer = '';
            setRfidInput(''); // Only update React state once
          }
        }, 200); // 200ms timeout for complete scan - highly optimized for faster response
      }

      // Process RFID input
      if (e.key === 'Enter') {
        // Process the scan immediately when Enter is pressed
        clearTimeout(bufferTimer);
        processRfidScan(inputBuffer);
        inputBuffer = '';
        setRfidInput(''); // Only update React state once
      } else if (e.key.length === 1) { // Only single characters
        inputBuffer += e.key; // Use local variable instead of state updates
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [rfidInput]);

  // Format date and time
  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return currentDateTime.toLocaleDateString('en-US', options).toUpperCase();
  };

  const formatTime = () => {
    return currentDateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  // Optimized helper function to get the course name from course ID
  const getCourseName = (courseId) => {
    if (!courseId) return 'No Course';
    
    // Use a cached lookup for better performance
    const course = courses.find(c => c.id === courseId);
    if (course) {
      return course.courseId;
    }
    
    // Fallback to courseId if course not found
    return courseId;
  };

  // Process RFID scan with highly optimized performance for real-time response
  const processRfidScan = async (rfidTag) => {
    try {
      // Always clear any previous reset timers to prevent display flickering
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      
      setIsProcessing(true);
      
      // Find student by RFID tag using the Firebase API
      const student = await findStudentByRfidTag(rfidTag);
      
      if (!student) {
        console.warn('No student found with RFID tag:', rfidTag);
        console.warn('Student not found');
        
        // Set invalid student state
        setCurrentStudent({
          studentId: 'INVALID',
          firstName: 'Invalid',
          lastName: 'Student',
          status: 'INVALID',
          profileImageURL: unknownStudent
        });
        setIsCheckedIn(false);
        setLastStatus('INVALID');
        
        // No timer to reset the display for invalid students
        // The invalid student will stay on screen until another scan happens
        
        setIsProcessing(false);
        return;
      }

      try {
        // Check if student is already checked in today BEFORE updating UI
        const existingRecord = await isStudentCheckedInToday(student.studentId);
        const isAlreadyCheckedIn = !!existingRecord;
        
        // Set the correct status immediately
        setIsCheckingOut(isAlreadyCheckedIn);
        setIsCheckedIn(true);
        setLastStatus(isAlreadyCheckedIn ? 'OUT' : 'IN');
        
        // Construct the student object with status once
        const studentWithStatus = {
          ...student,
          status: isAlreadyCheckedIn ? 'OUT' : 'IN'
        };
        
        // Update current student display immediately
        setCurrentStudent(studentWithStatus);
        setCurrentStudentId(student.studentId);
        setLastStudent(studentWithStatus);
        
        // Always update recent students when a student scans their card
        // First, check if this student is already in the recent students list
        setRecentStudents(prev => {
          // Remove the current student from the list if they're already there
          const filteredList = prev.filter(s => s.studentId !== student.studentId);
          return [studentWithStatus, ...filteredList].slice(0, 5); // Keep only last 5 students
        });

        // Record the attendance - do this after UI updates for better perceived performance
        const attendanceRecord = await recordCheckIn(rfidTag);
        
        // If the status returned from the server is different from what we predicted,
        // update the student status to match the server, but only if needed
        if (attendanceRecord.status !== studentWithStatus.status) {
          const updatedStudent = {
            ...student,
            status: attendanceRecord.status
          };
          setCurrentStudent(updatedStudent);
          setLastStudent(updatedStudent);
          
          // Update the student in recentStudents with the final status from the attendance record
          setRecentStudents(prev => {
            return prev.map(s => 
              s.studentId === student.studentId ? {...s, status: attendanceRecord.status} : s
            );
          });
        }
        
        setIsProcessing(false);
        
      } catch (error) {
        console.error('Error recording attendance:', error);
        console.error('Failed to record attendance');
        setCurrentStudent({...student, status: 'ERROR'});
        setIsProcessing(false);
      }
      
      // Set a new timer to reset the display
      resetTimerRef.current = setTimeout(() => {
        setCurrentStudent(null);
        // Don't reset currentStudentId - keep it for filtering
      }, 5000);
      
    } catch (error) {
      console.error('Error processing attendance:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      
      {/* Rose overlay */}
      <div className="absolute inset-0 z-0 bg-red-600/70"></div>
      
      {/* Content Container with z-index to appear above the background */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white/20 p-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <img src={schoolLogo} alt="College Logo" className="mr-4 h-20 w-20" />
            <div className="text-white">
              <h1 className="text-4xl font-bold tracking-tight text-shadow">ST. CECILIA'S COLLEGE - CEBU, INC.</h1>
              <p className="text-2xl opacity-90 text-shadow">Poblacion Ward II, Minglanilla, Cebu</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-white text-right">
              <p className="text-4xl font-bold text-shadow">{formatDate()}</p>
            </div>
            <div className="text-white text-right mt-2">
              <p className="text-2xl opacity-90 text-shadow">{formatTime()}</p>
            </div>
          </div>
        </div>

        {/* RFID Input Status (hidden but shows status) */}
        <div className="sr-only">
          Current RFID Input: {rfidInput}
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Panel - Featured Student */}
          <div className="bg-red-50 rounded-lg shadow-lg p-5 w-2/5">
            <div className="border border-gray-200 rounded-full mb-4 overflow-hidden">
              <div className="w-full h-[680px] flex items-center justify-center overflow-hidden rounded-full aspect-square">
                <img 
                  src={(currentStudent || lastStudent)?.profileImageURL || profileFemale} 
                  alt="Student" 
                  className="w-full h-full object-cover"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
            <div className={`${currentStudent ? (
              currentStudent.status === 'INVALID' ? 'bg-yellow-600' : 
              isCheckingOut ? 'bg-red-600' : 'bg-green-600'
            ) : 
            lastStatus ? (
              lastStatus === 'INVALID' ? 'bg-yellow-600' :
              lastStatus === 'OUT' ? 'bg-red-600' : 'bg-green-600'
            ) : 
            'bg-gray-500'} text-white text-center p-4 font-bold mb-4 rounded-lg shadow transition-all duration-300 flex items-center justify-center`}>
              <span className="mr-2">
                {currentStudent ? (
                  currentStudent.status === 'INVALID' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : isCheckingOut ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  )
                ) : lastStatus ? (
                  lastStatus === 'INVALID' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : lastStatus === 'OUT' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  )
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </span>
              <span className="text-2xl">
                {currentStudent ? (
                  currentStudent.status === 'INVALID' ? 'INVALID STUDENT' :
                  isCheckingOut ? 'CHECKED OUT' : 'CHECKED IN'
                ) : 
                lastStatus ? (
                  lastStatus === 'INVALID' ? 'INVALID STUDENT' :
                  lastStatus === 'OUT' ? 'CHECKED OUT' : 'CHECKED IN'
                ) : 
                'WAITING'}
              </span>
            </div>
            <div className="text-center font-bold text-xl">
              {currentStudent || lastStudent ? (
                <>
                  <p className="text-3xl mb-1">{featuredStudent.firstName} {featuredStudent.lastName}</p>
                  <p className="text-gray-700 text-2xl">{getCourseName(featuredStudent.course)}</p>
                </>
              ) : (
                <>
                  <p className="text-3xl mb-1">Waiting for student</p>
                  <p className="text-gray-700 text-2xl">Please scan RFID</p>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Students List and Attendance Table */}
          <div className="w-3/5">
            {/* Student Cards - Now showing recent students */}
            <div className="flex gap-6 mb-6">
              {(() => {
                // Filter out current student from recentStudents using currentStudentId
                const filteredStudents = recentStudents
                  .filter(student => !currentStudentId || student.studentId !== currentStudentId)
                  .slice(0, 4);
                
                // Always display cards, even when there are no students
                // Create an array with exactly 4 slots
                const displayCards = Array(4).fill(null);
                
                // Fill in the available students
                filteredStudents.forEach((student, index) => {
                  displayCards[index] = student;
                });
                
                // Render each card (student or placeholder)
                return displayCards.map((student, index) => (
                  <div key={index} className="bg-red-50 rounded-lg shadow-lg p-3 flex-1 transition-transform hover:scale-[1.02]">
                    {student ? (
                      // Display student card
                      <div className="flex flex-col items-center">
                        <div className="w-full h-60 flex items-center justify-center overflow-hidden rounded-lg mb-2">
                          <img 
                            src={student.profileImageURL || profileFemale} 
                            alt={`${student.firstName || ''} ${student.lastName || ''}`}
                            className="w-full h-full object-fill" 
                            style={{ width: '100%', height: '100%' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = profileFemale;
                            }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm">{student.firstName || ''} {student.lastName || ''}</p>
                          <p className="text-gray-600 text-xs">{getCourseName(student.course) || 'No Course'}</p>
                        </div>
                        <div className={`${student.status === 'OUT' ? 'bg-red-600' : 'bg-green-600'} text-white px-2 py-1 mt-2 font-bold rounded-full shadow-sm w-full text-center text-xs flex items-center justify-center`}>
                          <span className="mr-1">
                            {student.status === 'OUT' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                            )}
                          </span>
                          {student.status === 'OUT' ? 'CHECKED OUT' : 'CHECKED IN'}
                        </div>
                      </div>
                    ) : (
                      // Display empty placeholder
                      <div className="flex flex-col items-center opacity-70">
                        <div className="w-full h-60 flex items-center justify-center overflow-hidden rounded-lg mb-2">
                          <img 
                            src={profileMale} 
                            alt="Default profile"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-500 text-sm">Waiting for student</p>
                          <p className="text-gray-400 text-xs">Please scan RFID</p>
                        </div>
                        <div className="bg-gray-400 text-white px-2 py-1 mt-2 font-bold rounded-full w-full text-center text-xs">
                          WAITING
                        </div>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-3 bg-red-50 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Recent Attendance
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Student</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Course</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Time</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {latestAttendanceRecords.length > 0 ? (
                      latestAttendanceRecords.slice(0, 7).map((record, index) => {
                        const student = students.find(s => s.studentId === record.studentId) || {};
                        return (
                          <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-red-50'} hover:bg-gray-100 transition-colors duration-150`}>
                            <td className="px-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-12 w-12 flex-shrink-0 mr-3">
                                  <img 
                                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm" 
                                    src={student.profileImageURL || profileFemale} 
                                    alt="" 
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = profileFemale;
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{record.studentName}</div>
                                  <div className="text-xs text-gray-500">ID: {record.studentId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">{getCourseName(student.course) || record.courseId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">{record.date}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${record.status === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                {record.status === 'IN' ? record.timeIn : record.timeOut}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center shadow-sm w-16 justify-center`}>
                                <span className="mr-1">
                                  {record.status === 'IN' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                  )}
                                </span>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      // Sample placeholder data to show design when no records exist
                      Array(5).fill(null).map((_, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-red-50'} hover:bg-gray-100 transition-colors duration-150`}>
                          <td className="px-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-12 w-12 flex-shrink-0 mr-3">
                                <img 
                                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm" 
                                  src={profileMale} 
                                  alt="" 
                                />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">Sample Student {index + 1}</div>
                                <div className="text-xs text-gray-500">ID: 2023{index + 1000}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-md inline-block">
                              {index % 2 === 0 ? 'BSIT' : 'BSCS'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">{new Date().toISOString().split('T')[0]}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${index % 2 === 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {index % 2 === 0 ? '08:3' + index : '17:1' + index}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${index % 2 === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center shadow-sm w-16 justify-center`}>
                              <span className="mr-1">
                                {index % 2 === 0 ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                  </svg>
                                )}
                              </span>
                              {index % 2 === 0 ? 'IN' : 'OUT'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RfidAttendanceMonitor;
