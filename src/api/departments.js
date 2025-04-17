import { collection, getDocs, addDoc, updateDoc, doc, query, where, Timestamp, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'departments';

/**
 * @typedef {Object} Department
 * @property {string} id - The unique identifier
 * @property {string} name - The department name
 * @property {string} code - The department code
 * @property {string} description - The department description
 * @property {Date} createdAt - When the department was created
 * @property {Date} updatedAt - When the department was last updated
 * @property {Date|null} deletedAt - When the department was soft deleted, null if active
 */


/**
 * Retrieves all active (non-deleted) departments
 * @returns {Promise<Department[]>} Array of active departments
 */
export const getDepartments = async () => {
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
    console.error('Error fetching departments:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for active departments
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToDepartments = (onUpdate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('deletedAt', '==', null)
    );

    return onSnapshot(q, (snapshot) => {
      const departments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(departments);
    }, (error) => {
      console.error('Error in departments subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up departments subscription:', error);
    throw error;
  }
};

/**
 * Creates a new department
 * @param {Omit<Department, 'id'|'createdAt'|'deletedAt'>} departmentData - The department data
 * @returns {Promise<Department>} The created department
 */
export const addDepartment = async (departmentData) => {
  try {
    const dataWithTimestamp = {
      ...departmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
  } catch (error) {
    console.error('Error adding department:', error);
    throw error;
  }
};

/**
 * Updates an existing department
 * @param {string} id - The department ID
 * @param {Partial<Department>} departmentData - The fields to update
 * @returns {Promise<Department>} The updated department
 */
export const updateDepartment = async (id, departmentData) => {
  try {
    const departmentRef = doc(db, COLLECTION_NAME, id);
    const dataWithTimestamp = {
      ...departmentData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(departmentRef, dataWithTimestamp);
    return { id, ...dataWithTimestamp };
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

/**
 * Soft deletes a department by setting deletedAt
 * @param {string} id - The department ID
 * @returns {Promise<string>} The ID of the deleted department
 */
export const deleteDepartment = async (id) => {
  try {
    const departmentRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(departmentRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};

// Helper function to restore a soft-deleted department
/**
 * Restores a soft-deleted department
 * @param {string} id - The department ID
 * @returns {Promise<string>} The ID of the restored department
 */
export const restoreDepartment = async (id) => {
  try {
    const departmentRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(departmentRef, {
      deletedAt: null,
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error('Error restoring department:', error);
    throw error;
  }
};
