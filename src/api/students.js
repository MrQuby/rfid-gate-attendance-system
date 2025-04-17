import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'students';

/**
 * @typedef {Object} Student
 * @property {string} id - Student document ID
 * @property {string} studentId - Student ID number
 * @property {string} firstName - Student first name
 * @property {string} lastName - Student last name
 * @property {string} email - Student email
 * @property {string} department - Student department ID
 * @property {string} course - Student course ID
 * @property {string} class - Student class ID
 * @property {string} rfidTag - Student RFID tag
 * @property {string} profileImageURL - Student profile image (stored as base64 data URL)
 * @property {Date} createdAt - When the student record was created
 * @property {Date} updatedAt - When the student record was last updated
 * @property {Date|null} deletedAt - When the student was soft deleted, null if active
 */

/**
 * Retrieves all active (non-deleted) students
 * @returns {Promise<Student[]>} Array of active students
 */
export const getStudents = async () => {
  try {
    console.log('Fetching students from collection:', COLLECTION_NAME);
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null)
    );
    const querySnapshot = await getDocs(q);
    const students = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Retrieved students:', students);
    return students;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for active students
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToStudents = (onUpdate) => {
  try {
    console.log('Setting up students subscription...');
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null)
    );

    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Received students update:', students);
      onUpdate(students);
    }, (error) => {
      console.error('Error in students subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up students subscription:', error);
    throw error;
  }
};

/**
 * Creates a new student record
 * @param {Omit<Student, 'id'|'createdAt'|'updatedAt'|'deletedAt'>} studentData - The student data
 * @returns {Promise<Student>} The created student record
 */
export const addStudent = async (studentData) => {
  try {
    const dataWithTimestamp = {
      ...studentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

/**
 * Updates an existing student record
 * @param {string} id - The student ID
 * @param {Partial<Student>} studentData - The fields to update
 * @returns {Promise<Student>} The updated student record
 */
export const updateStudent = async (id, studentData) => {
  try {
    const studentRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...studentData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(studentRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

/**
 * Soft deletes a student by setting deletedAt
 * @param {string} id - The student ID
 * @returns {Promise<string>} The ID of the deleted student
 */
export const deleteStudent = async (id) => {
  try {
    const studentRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(studentRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

/**
 * Restores a soft-deleted student
 * @param {string} id - The student ID
 * @returns {Promise<string>} The ID of the restored student
 */
export const restoreStudent = async (id) => {
  try {
    const studentRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(studentRef, {
      deletedAt: null,
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error('Error restoring student:', error);
    throw error;
  }
};

/**
 * Get students by department
 * @param {string} department - The department to filter by
 * @returns {Promise<Student[]>} Array of active students in the department
 */
export const getStudentsByDepartment = async (department) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('department', '==', department)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching students by department:', error);
    throw error;
  }
};

/**
 * Get students by course
 * @param {string} course - The course to filter by
 * @returns {Promise<Student[]>} Array of active students in the course
 */
export const getStudentsByCourse = async (course) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('course', '==', course)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching students by course:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for students in a specific department
 * @param {string} department - The department to filter by
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToStudentsByDepartment = (department, onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('department', '==', department)
    );

    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(students);
    });
  } catch (error) {
    console.error('Error setting up students by department subscription:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for students in a specific course
 * @param {string} course - The course to filter by
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToStudentsByCourse = (course, onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('course', '==', course)
    );

    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(students);
    });
  } catch (error) {
    console.error('Error setting up students by course subscription:', error);
    throw error;
  }
};

/**
 * Get students by class
 * @param {string} classId - The class to filter by
 * @returns {Promise<Student[]>} Array of active students in the class
 */
export const getStudentsByClass = async (classId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('class', '==', classId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching students by class:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for students in a specific class
 * @param {string} classId - The class to filter by
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToStudentsByClass = (classId, onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('class', '==', classId)
    );

    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(students);
    });
  } catch (error) {
    console.error('Error setting up students by class subscription:', error);
    throw error;
  }
};
