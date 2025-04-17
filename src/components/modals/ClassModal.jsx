import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getDepartments } from '../../api/departments';
import { getCoursesByDepartment } from '../../api/courses';

const ClassModal = ({ isOpen, onClose, mode, currentClass, onSubmit, onChange }) => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classNameOptions, setClassNameOptions] = useState([]);
  const [loading, setLoading] = useState({
    departments: false,
    courses: false
  });
  const isViewMode = mode === 'view';
  const modalTitle = {
    add: 'Add New Class',
    edit: 'Edit Class',
    view: 'Class Details'
  }[mode];

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(prev => ({ ...prev, departments: true }));
        const departmentsData = await getDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(prev => ({ ...prev, departments: false }));
      }
    };

    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  // Fetch courses when department changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!currentClass.departmentId) {
        setCourses([]);
        return;
      }
      
      try {
        setLoading(prev => ({ ...prev, courses: true }));
        const coursesData = await getCoursesByDepartment(currentClass.departmentId);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };

    fetchCourses();
  }, [currentClass.departmentId]);

  // Generate class name options based on year level
  useEffect(() => {
    if (!currentClass.yearLevel) {
      setClassNameOptions([]);
      return;
    }

    const yearPrefix = currentClass.yearLevel.charAt(0);
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const options = sections.map(section => `${yearPrefix}${section}`);
    setClassNameOptions(options);
  }, [currentClass.yearLevel]);

  const handleDepartmentChange = (e) => {
    const { name, value } = e.target;
    // Reset courseId when department changes
    if (name === 'departmentId') {
      onChange({
        target: {
          name: 'courseId',
          value: ''
        }
      });
    }
    onChange(e);
  };

  const handleYearLevelChange = (e) => {
    const { name, value } = e.target;
    
    // Reset class name when year level changes
    onChange({
      target: {
        name: 'name',
        value: ''
      }
    });
    
    // Update year level
    onChange(e);
  };

  if (!isOpen) return null;

  const yearLevelOptions = [
    '1st',
    '2nd',
    '3rd',
    '4th'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{modalTitle}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                {loading.departments ? (
                  <div className="flex items-center justify-center p-2">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500" />
                    <span className="ml-2">Loading departments...</span>
                  </div>
                ) : (
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={currentClass.departmentId || ''}
                    onChange={handleDepartmentChange}
                    disabled={isViewMode}
                    className={`w-full p-2 border rounded-md ${isViewMode ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                {loading.courses ? (
                  <div className="flex items-center justify-center p-2">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500" />
                    <span className="ml-2">Loading courses...</span>
                  </div>
                ) : (
                  <select
                    id="courseId"
                    name="courseId"
                    value={currentClass.courseId || ''}
                    onChange={onChange}
                    disabled={isViewMode || !currentClass.departmentId}
                    className={`w-full p-2 border rounded-md ${isViewMode || !currentClass.departmentId ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.courseName} ({course.courseId})</option>
                    ))}
                  </select>
                )}
                {!currentClass.departmentId && !isViewMode && (
                  <p className="text-sm text-gray-500 mt-1">Please select a department first</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Year Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="yearLevel"
                  name="yearLevel"
                  value={currentClass.yearLevel || ''}
                  onChange={handleYearLevelChange}
                  disabled={isViewMode}
                  className={`w-full p-2 border rounded-md ${isViewMode ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                >
                  <option value="">Select Year Level</option>
                  {yearLevelOptions.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="name"
                  name="name"
                  value={currentClass.name || ''}
                  onChange={onChange}
                  disabled={isViewMode || !currentClass.yearLevel}
                  className={`w-full p-2 border rounded-md ${isViewMode || !currentClass.yearLevel ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                >
                  <option value="">Select Class Name</option>
                  {classNameOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {!currentClass.yearLevel && !isViewMode && (
                  <p className="text-sm text-gray-500 mt-1">Please select a year level first</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  min="1"
                  max="500"
                  value={currentClass.capacity || ''}
                  onChange={onChange}
                  disabled={isViewMode}
                  className={`w-full p-2 border rounded-md ${isViewMode ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                />
              </div>

              {!isViewMode && (
                <div className="flex justify-end mt-6 gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {mode === 'add' ? 'Add Class' : 'Update Class'}
                  </button>
                </div>
              )}

              {isViewMode && (
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassModal;
