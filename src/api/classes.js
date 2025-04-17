import { collection, getDocs, addDoc, updateDoc, doc, query, where, Timestamp, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'classes';

/**
 * @typedef {Object} Class
 * @property {string} id - The unique identifier
 * @property {string} name - The class name (e.g., "1A", "2B")
 * @property {number} capacity - Maximum number of students
 * @property {string} yearLevel - Year level (e.g., "1st", "2nd")
 * @property {string} departmentId - Reference to department
 * @property {string} courseId - Reference to course
 * @property {Date} createdAt - When the class was created
 * @property {Date} updatedAt - When the class was last updated
 * @property {Date|null} deletedAt - When the class was soft deleted, null if active
 */

/**
 * Retrieves all active (non-deleted) classes
 * @returns {Promise<Class[]>} Array of active classes
 */
export const getClasses = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for active classes
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToClasses = (onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null)
    );

    return onSnapshot(q, (snapshot) => {
      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(classes);
    }, (error) => {
      console.error('Error in classes subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up classes subscription:', error);
    throw error;
  }
};

/**
 * Get classes by department ID
 * @param {string} departmentId - The department ID to filter by
 * @returns {Promise<Class[]>} Array of active classes in the department
 */
export const getClassesByDepartment = async (departmentId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('departmentId', '==', departmentId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching classes by department:', error);
    throw error;
  }
};

/**
 * Get classes by course ID
 * @param {string} courseId - The course ID to filter by
 * @returns {Promise<Class[]>} Array of active classes for the course
 */
export const getClassesByCourse = async (courseId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching classes by course:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for classes in a specific department
 * @param {string} departmentId - The department ID to filter by
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToClassesByDepartment = (departmentId, onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('departmentId', '==', departmentId)
    );

    return onSnapshot(q, (snapshot) => {
      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(classes);
    }, (error) => {
      console.error('Error in classes by department subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up classes by department subscription:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for classes of a specific course
 * @param {string} courseId - The course ID to filter by
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToClassesByCourse = (courseId, onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('courseId', '==', courseId)
    );

    return onSnapshot(q, (snapshot) => {
      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(classes);
    }, (error) => {
      console.error('Error in classes by course subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up classes by course subscription:', error);
    throw error;
  }
};

/**
 * Creates a new class
 * @param {Omit<Class, 'id'|'createdAt'|'deletedAt'>} classData - The class data
 * @returns {Promise<Class>} The created class
 */
export const addClass = async (classData) => {
  try {
    const dataWithTimestamp = {
      ...classData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
  } catch (error) {
    console.error('Error adding class:', error);
    throw error;
  }
};

/**
 * Updates an existing class
 * @param {string} id - The class ID
 * @param {Partial<Class>} classData - The fields to update
 * @returns {Promise<Class>} The updated class
 */
export const updateClass = async (id, classData) => {
  try {
    const classRef = doc(db, COLLECTION_NAME, id);
    const dataWithTimestamp = {
      ...classData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(classRef, dataWithTimestamp);
    return { id, ...dataWithTimestamp };
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

/**
 * Soft deletes a class by setting deletedAt
 * @param {string} id - The class ID
 * @returns {Promise<string>} The ID of the deleted class
 */
export const deleteClass = async (id) => {
  try {
    const classRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(classRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

/**
 * Restores a soft-deleted class
 * @param {string} id - The class ID
 * @returns {Promise<string>} The ID of the restored class
 */
export const restoreClass = async (id) => {
  try {
    const classRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(classRef, {
      deletedAt: null,
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error('Error restoring class:', error);
    throw error;
  }
};
