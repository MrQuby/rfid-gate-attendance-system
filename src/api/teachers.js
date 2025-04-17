import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

// Use the users collection instead of teachers
const COLLECTION_NAME = 'users';

/**
 * @typedef {Object} Teacher
 * @property {string} id - The unique identifier
 * @property {string} teacherId - The teacher's ID number
 * @property {string} firstName - The teacher's first name
 * @property {string} lastName - The teacher's last name
 * @property {string} email - The teacher's email address
 * @property {string} department - The department ID this teacher belongs to
 * @property {string[]} courses - Array of course IDs this teacher handles
 * @property {string[]} classes - Array of class IDs this teacher is assigned to
 * @property {Date} createdAt - When the teacher record was created
 * @property {Date} updatedAt - When the teacher record was last updated
 * @property {boolean} isActive - Whether the teacher is active or not
 */

/**
 * Retrieves all active (non-deleted) teachers
 * @returns {Promise<Teacher[]>} Array of active teachers
 */
export const getTeachers = async () => {
  try {
    // Query users with role 'teacher' and isActive true
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('role', '==', 'teacher'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Map idNumber to teacherId for backward compatibility
      return {
        id: doc.id,
        ...data,
        teacherId: data.idNumber || data.teacherId
      };
    });
  } catch (error) {
    console.error('Error getting teachers:', error);
    throw error;
  }
};

/**
 * Creates a new teacher record
 * @param {Omit<Teacher, 'id'|'createdAt'|'updatedAt'|'isActive'>} teacherData - The teacher data
 * @returns {Promise<Teacher>} The created teacher record
 */
export const addTeacher = async (teacherData) => {
  try {
    const dataToSave = {
      ...teacherData,
      role: 'teacher', // Set role to 'teacher'
      idNumber: teacherData.teacherId, // Map teacherId to idNumber
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
    return {
      id: docRef.id,
      ...dataToSave,
      teacherId: dataToSave.idNumber // Ensure teacherId is returned for backward compatibility
    };
  } catch (error) {
    console.error('Error adding teacher:', error);
    throw error;
  }
};

/**
 * Updates an existing teacher record
 * @param {string} id - The teacher ID
 * @param {Partial<Teacher>} teacherData - The fields to update
 * @returns {Promise<void>}
 */
export const updateTeacher = async (id, teacherData) => {
  try {
    const updateData = { ...teacherData };
    
    // Map teacherId to idNumber if present
    if (updateData.teacherId) {
      updateData.idNumber = updateData.teacherId;
    }
    
    // Ensure role is teacher
    updateData.role = 'teacher';
    updateData.updatedAt = serverTimestamp();
    
    const teacherRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(teacherRef, updateData);
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
};

/**
 * Soft deletes a teacher by setting isActive to false
 * @param {string} id - The teacher ID
 * @returns {Promise<void>}
 */
export const deleteTeacher = async (id) => {
  try {
    const teacherRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(teacherRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
};

/**
 * Retrieves the classes assigned to a specific teacher
 * @param {string} teacherId - The teacher's ID
 * @returns {Promise<string[]>} Array of class IDs assigned to the teacher
 */
export const getTeacherClasses = async (teacherId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, teacherId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.classes || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting teacher classes:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for active teachers
 * @param {function} callback - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToTeachers = (callback) => {
  try {
    // Query users with role 'teacher' and isActive true
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('role', '==', 'teacher'),
      where('isActive', '==', true)
    );
    
    return onSnapshot(q, (snapshot) => {
      const teachers = snapshot.docs.map(doc => {
        const data = doc.data();
        // Map idNumber to teacherId for backward compatibility
        return {
          id: doc.id,
          ...data,
          teacherId: data.idNumber || data.teacherId
        };
      });
      
      callback(teachers);
    });
  } catch (error) {
    console.error('Error setting up teachers subscription:', error);
    throw error;
  }
};
