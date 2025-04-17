import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp, onSnapshot, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'attendance';
const STUDENTS_COLLECTION = 'students';

/**
 * @typedef {Object} AttendanceRecord
 * @property {string} id - Attendance record document ID
 * @property {string} studentId - Student ID number
 * @property {string} studentName - Student full name
 * @property {string} course - Student course/program
 * @property {string} rfidTag - RFID tag used for check-in
 * @property {string} date - Date of attendance (YYYY-MM-DD)
 * @property {string} timeIn - Time student checked in
 * @property {string} timeOut - Time student checked out (null if not checked out)
 * @property {string} status - Status (IN/OUT)
 * @property {string} imageUrl - Student image URL or base64
 * @property {Date} createdAt - When the record was created
 * @property {Date} updatedAt - When the record was last updated
 */

/**
 * Find a student by RFID tag
 * @param {string} rfidTag - The RFID tag to search for
 * @returns {Promise<Object|null>} The student data or null if not found
 */
export const findStudentByRfidTag = async (rfidTag) => {
  try {
    // Check local cache first
    const cachedStudents = localStorage.getItem('students');
    if (cachedStudents) {
      const students = JSON.parse(cachedStudents);
      const student = students.find(s => s.rfidTag === rfidTag && !s.deletedAt);
      if (student) return student;
    }

    // If not in cache, query Firestore
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('rfidTag', '==', rfidTag),
      where('deletedAt', '==', null)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching student
    const studentDoc = querySnapshot.docs[0];
    const student = {
      id: studentDoc.id,
      ...studentDoc.data()
    };

    // Update local cache
    const students = cachedStudents ? JSON.parse(cachedStudents) : [];
    const updatedStudents = students.filter(s => s.rfidTag !== rfidTag);
    updatedStudents.push(student);
    localStorage.setItem('students', JSON.stringify(updatedStudents));

    return student;
  } catch (error) {
    console.error('Error finding student by RFID tag:', error);
    throw error;
  }
};

/**
 * Records a student check-in
 * @param {string} rfidTag - The RFID tag scanned
 * @returns {Promise<AttendanceRecord>} The created attendance record
 */
export const recordCheckIn = async (rfidTag) => {
  try {
    // Find student by RFID tag
    const student = await findStudentByRfidTag(rfidTag);
    
    if (!student) {
      throw new Error(`No student found with RFID tag: ${rfidTag}`);
    }
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Check if student is already checked in today
    const existingRecord = await isStudentCheckedInToday(student.studentId);
    if (existingRecord) {
      // If already checked in, record check-out instead
      return await recordCheckOut(existingRecord.id);
    }
    
    const attendanceData = {
      studentId: student.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      course: student.course,
      rfidTag: student.rfidTag,
      imageUrl: student.profileImageURL || '',
      date: dateStr,
      timeIn: timeStr,
      timeOut: null,
      status: 'IN',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), attendanceData);
    return { id: docRef.id, ...attendanceData };
  } catch (error) {
    console.error('Error recording check-in:', error);
    throw error;
  }
};

/**
 * Records a student check-out
 * @param {string} id - The attendance record ID
 * @returns {Promise<AttendanceRecord>} The updated attendance record
 */
export const recordCheckOut = async (id) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    const attendanceRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      timeOut: timeStr,
      status: 'OUT',
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(attendanceRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error('Error recording check-out:', error);
    throw error;
  }
};

/**
 * Get attendance records for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<AttendanceRecord[]>} Array of attendance records
 */
export const getAttendanceByDate = async (date) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '==', date),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for today's attendance
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToTodayAttendance = (onUpdate) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check local cache first
    const cachedData = localStorage.getItem(`attendance_${today}`);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      onUpdate(parsedData);
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '==', today),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Update local cache
      localStorage.setItem(`attendance_${today}`, JSON.stringify(records));
      onUpdate(records);
    }, (error) => {
      console.error('Error in attendance subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up attendance subscription:', error);
    throw error;
  }
};

/**
 * Get the latest attendance records (limited to a specific count)
 * @param {number} count - Number of records to retrieve
 * @returns {Promise<AttendanceRecord[]>} Array of attendance records
 */
export const getLatestAttendance = async (count = 5) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching latest attendance:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for latest attendance records
 * @param {number} count - Number of records to retrieve
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToLatestAttendance = (count = 5, onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(count)
    );

    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(records);
    }, (error) => {
      console.error('Error in latest attendance subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up latest attendance subscription:', error);
    throw error;
  }
};

/**
 * Get attendance records for a specific student
 * @param {string} studentId - Student ID
 * @returns {Promise<AttendanceRecord[]>} Array of attendance records
 */
export const getStudentAttendance = async (studentId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    throw error;
  }
};

/**
 * Check if a student is already checked in for today
 * @param {string} studentId - Student ID
 * @returns {Promise<Object|null>} The attendance record if found, null otherwise
 */
export const isStudentCheckedInToday = async (studentId) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '==', today),
      where('studentId', '==', studentId),
      where('status', '==', 'IN')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error checking student check-in status:', error);
    throw error;
  }
};
