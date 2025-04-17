import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'courses';

/**
 * @typedef {Object} Course
 * @property {string} id - The unique identifier
 * @property {string} courseId - The course ID/code
 * @property {string} courseName - The course name
 * @property {string} department - The department ID this course belongs to
 * @property {string} description - The course description
 * @property {Date} createdAt - When the course was created
 * @property {Date} updatedAt - When the course was last updated
 * @property {Date|null} deletedAt - When the course was soft deleted, null if active
 */

/**
 * Retrieves all active (non-deleted) courses
 * @returns {Promise<Course[]>} Array of active courses
 */
export const getCourses = async () => {
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
    console.error('Error fetching courses:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for active courses
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToCourses = (onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null)
    );

    return onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(courses);
    }, (error) => {
      console.error('Error in courses subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up courses subscription:', error);
    throw error;
  }
};

/**
 * Creates a new course
 * @param {Omit<Course, 'id'|'createdAt'|'deletedAt'>} courseData - The course data
 * @returns {Promise<Course>} The created course
 */
export const addCourse = async (courseData) => {
  try {
    const dataWithTimestamp = {
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
  } catch (error) {
    console.error('Error adding course:', error);
    throw error;
  }
};

/**
 * Updates an existing course
 * @param {string} id - The course ID
 * @param {Partial<Course>} courseData - The fields to update
 * @returns {Promise<Course>} The updated course
 */
export const updateCourse = async (id, courseData) => {
  try {
    const courseRef = doc(db, COLLECTION_NAME, id);
    const dataWithTimestamp = {
      ...courseData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(courseRef, dataWithTimestamp);
    return { id, ...dataWithTimestamp };
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

/**
 * Soft deletes a course by setting deletedAt
 * @param {string} id - The course ID
 * @returns {Promise<string>} The ID of the deleted course
 */
export const deleteCourse = async (id) => {
  try {
    const courseRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(courseRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

/**
 * Restores a soft-deleted course
 * @param {string} id - The course ID
 * @returns {Promise<string>} The ID of the restored course
 */
export const restoreCourse = async (id) => {
  try {
    const courseRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(courseRef, {
      deletedAt: null,
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error('Error restoring course:', error);
    throw error;
  }
};

/**
 * Get courses by department ID
 * @param {string} departmentId - The department ID to filter by
 * @returns {Promise<Course[]>} Array of active courses in the department
 */
export const getCoursesByDepartment = async (departmentId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('department', '==', departmentId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching courses by department:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for courses in a specific department
 * @param {string} departmentId - The department ID to filter by
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToCoursesByDepartment = (departmentId, onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null),
      where('department', '==', departmentId)
    );

    return onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(courses);
    }, (error) => {
      console.error('Error in courses by department subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up courses by department subscription:', error);
    throw error;
  }
};
