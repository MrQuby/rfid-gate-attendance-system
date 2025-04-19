import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getDepartments } from '../../api/departments';
import { getCoursesByDepartment } from '../../api/courses';

const ClassModal = ({ isOpen, onClose, mode, currentClass, onSubmit, onChange, loading = false }) => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classNameOptions, setClassNameOptions] = useState([]);
  const [loadingState, setLoadingState] = useState({
    departments: false,
    courses: false
  });
  const isViewMode = mode === 'view';

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingState(prev => ({ ...prev, departments: true }));
        const departmentsData = await getDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingState(prev => ({ ...prev, departments: false }));
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
        setLoadingState(prev => ({ ...prev, courses: true }));
        const coursesData = await getCoursesByDepartment(currentClass.departmentId);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoadingState(prev => ({ ...prev, courses: false }));
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 max-w-lg w-full mx-2">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-blue-900">
              {mode === 'add' ? 'Add New Class' : 
               mode === 'edit' ? 'Edit Class' : 'Class Details'}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {mode === 'add' ? 'Create a new class in the system' : 
               mode === 'edit' ? 'Modify existing class details' : 'View class information'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <i className="fas fa-times text-gray-500 text-xl"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4">
          <div className="space-y-4">
            {/* Department Field */}
            <div className="grid grid-cols-1 gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                Department
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-building text-gray-400"></i>
                </div>
                {loadingState.departments ? (
                  <div className="pl-10 w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      <span>Loading departments...</span>
                    </div>
                  </div>
                ) : (
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={currentClass.departmentId || ''}
                    onChange={handleDepartmentChange}
                    disabled={isViewMode || loading}
                    className={`pl-10 w-full rounded-lg border ${
                      isViewMode || loading 
                        ? 'bg-gray-50 text-gray-500' 
                        : 'bg-white hover:border-gray-400 focus:border-blue-500'
                    } border-gray-300 shadow-sm p-2.5 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Course Field */}
            <div className="grid grid-cols-1 gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                Course
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-book text-gray-400"></i>
                </div>
                {loadingState.courses ? (
                  <div className="pl-10 w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      <span>Loading courses...</span>
                    </div>
                  </div>
                ) : (
                  <select
                    id="courseId"
                    name="courseId"
                    value={currentClass.courseId || ''}
                    onChange={onChange}
                    disabled={isViewMode || loading || !currentClass.departmentId}
                    className={`pl-10 w-full rounded-lg border ${
                      isViewMode || loading || !currentClass.departmentId
                        ? 'bg-gray-50 text-gray-500' 
                        : 'bg-white hover:border-gray-400 focus:border-blue-500'
                    } border-gray-300 shadow-sm p-2.5 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.courseId}</option>
                    ))}
                  </select>
                )}
                {!currentClass.departmentId && !isViewMode && (
                  <p className="text-xs text-gray-500 mt-1 ml-2">Please select a department first</p>
                )}
              </div>
            </div>

            {/* Year Level Field */}
            <div className="grid grid-cols-1 gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                Year Level
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-layer-group text-gray-400"></i>
                </div>
                <select
                  id="yearLevel"
                  name="yearLevel"
                  value={currentClass.yearLevel || ''}
                  onChange={handleYearLevelChange}
                  disabled={isViewMode || loading}
                  className={`pl-10 w-full rounded-lg border ${
                    isViewMode || loading 
                      ? 'bg-gray-50 text-gray-500' 
                      : 'bg-white hover:border-gray-400 focus:border-blue-500'
                  } border-gray-300 shadow-sm p-2.5 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  required
                >
                  <option value="">Select Year Level</option>
                  {yearLevelOptions.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class Name Field */}
            <div className="grid grid-cols-1 gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                Class Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-users text-gray-400"></i>
                </div>
                <select
                  id="name"
                  name="name"
                  value={currentClass.name || ''}
                  onChange={onChange}
                  disabled={isViewMode || loading || !currentClass.yearLevel}
                  className={`pl-10 w-full rounded-lg border ${
                    isViewMode || loading || !currentClass.yearLevel
                      ? 'bg-gray-50 text-gray-500' 
                      : 'bg-white hover:border-gray-400 focus:border-blue-500'
                  } border-gray-300 shadow-sm p-2.5 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  required
                >
                  <option value="">Select Class Name</option>
                  {classNameOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {!currentClass.yearLevel && !isViewMode && (
                  <p className="text-xs text-gray-500 mt-1 ml-2">Please select a year level first</p>
                )}
              </div>
            </div>

            {/* Capacity Field */}
            <div className="grid grid-cols-1 gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                Capacity
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user-friends text-gray-400"></i>
                </div>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  min="1"
                  max="500"
                  value={currentClass.capacity || ''}
                  onChange={onChange}
                  disabled={isViewMode || loading}
                  placeholder="Enter class capacity"
                  className={`pl-10 w-full rounded-lg border ${
                    isViewMode || loading 
                      ? 'bg-gray-50 text-gray-500' 
                      : 'bg-white hover:border-gray-400 focus:border-blue-500'
                  } border-gray-300 shadow-sm p-2.5 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {!isViewMode ? (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 
                    hover:bg-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 
                    transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
                    bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                    transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className={`fas ${mode === 'add' ? 'fa-plus' : 'fa-save'}`}></i>
                      {mode === 'add' ? 'Add Class' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
                    bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                    transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

ClassModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['add', 'edit', 'view']).isRequired,
  currentClass: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default ClassModal;
