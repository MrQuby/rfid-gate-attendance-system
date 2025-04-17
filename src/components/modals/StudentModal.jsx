import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { getDepartments, subscribeToDepartments } from '../../api/departments';
import { 
  getCourses, 
  subscribeToCourses, 
  getCoursesByDepartment, 
  subscribeToCoursesByDepartment 
} from '../../api/courses';
import { 
  getClasses, 
  subscribeToClasses, 
  getClassesByCourse, 
  subscribeToClassesByCourse 
} from '../../api/classes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const StudentModal = ({ 
  isOpen, 
  onClose, 
  mode, 
  currentStudent, 
  onSubmit, 
  onChange,
  loading 
}) => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentStudent.profileImageURL || null);
  const fileInputRef = useRef(null);

  // Load departments
  useEffect(() => {
    let departmentsUnsubscribe = null;

    if (isOpen) {
      setDepartmentsLoading(true);
      
      // Set up real-time listener for departments
      departmentsUnsubscribe = subscribeToDepartments((updatedDepartments) => {
        if (updatedDepartments) {
          setDepartments(updatedDepartments);
          setDepartmentsLoading(false);
        }
      });
    }

    // Clean up subscription when component unmounts or modal closes
    return () => {
      if (departmentsUnsubscribe) departmentsUnsubscribe();
    };
  }, [isOpen]);

  // Load courses based on selected department
  useEffect(() => {
    let coursesUnsubscribe = null;

    if (isOpen && currentStudent.department) {
      setCoursesLoading(true);
      setCourses([]); // Clear existing courses when department changes
      
      // Set up real-time listener for courses in the selected department
      coursesUnsubscribe = subscribeToCoursesByDepartment(
        currentStudent.department,
        (updatedCourses) => {
          console.log('Courses received:', updatedCourses); // Debug log
          setCourses(updatedCourses || []);
          setCoursesLoading(false);
        }
      );
    } else {
      setCourses([]);
    }

    // Clean up subscription when component unmounts or modal closes
    return () => {
      if (coursesUnsubscribe) coursesUnsubscribe();
    };
  }, [isOpen, currentStudent.department]);

  // Load classes based on selected course
  useEffect(() => {
    let classesUnsubscribe = null;

    if (isOpen && currentStudent.course) {
      setClassesLoading(true);
      setClasses([]); // Clear existing classes when course changes
      
      // Set up real-time listener for classes in the selected course
      classesUnsubscribe = subscribeToClassesByCourse(
        currentStudent.course,
        (updatedClasses) => {
          console.log('Classes received:', updatedClasses); // Debug log
          setClasses(updatedClasses || []);
          setClassesLoading(false);
        }
      );
    } else {
      setClasses([]);
    }

    // Clean up subscription when component unmounts or modal closes
    return () => {
      if (classesUnsubscribe) classesUnsubscribe();
    };
  }, [isOpen, currentStudent.course]);

  // Update image preview when student data changes
  useEffect(() => {
    if (isOpen) {
      setImagePreview(currentStudent.profileImageURL || null);
    }
  }, [isOpen, currentStudent.profileImageURL]);

  const handleLocalChange = (e) => {
    const { name, value } = e.target;
    
    // If department changes, reset course and class
    if (name === 'department' && value !== currentStudent.department) {
      onChange({
        target: { name, value }
      });
      onChange({
        target: { name: 'course', value: '' }
      });
      onChange({
        target: { name: 'class', value: '' }
      });
    } 
    // If course changes, reset class
    else if (name === 'course' && value !== currentStudent.course) {
      onChange({
        target: { name, value }
      });
      onChange({
        target: { name: 'class', value: '' }
      });
    } else {
      onChange(e);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataURL = reader.result;
        setImagePreview(dataURL);
        
        // Automatically update the student object with the image data URL
        onChange({
          target: {
            name: 'profileImageURL',
            value: dataURL
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDelete = () => {
    setImageFile(null);
    setImagePreview(null);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Update the student object to remove the image
    onChange({
      target: {
        name: 'profileImageURL',
        value: null
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-auto flex flex-col max-h-[90vh]">
        {/* Modal Header - Fixed at top */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-blue-900">
              {mode === 'add' ? 'Add New Student' : 
               mode === 'edit' ? 'Edit Student' : 'Student Details'}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {mode === 'add' ? 'Create a new student record' : 
               mode === 'edit' ? 'Update student information' : 'View student information'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <i className="fas fa-times text-gray-500 text-xl"></i>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-grow">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-4">
              {/* Profile Image */}
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Profile Image
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-300">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-user text-gray-400 text-4xl"></i>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {mode !== 'view' && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          ref={fileInputRef}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                            transition-colors flex items-center"
                        >
                          <i className="fas fa-upload mr-2"></i>
                          Select Image
                        </button>
                        
                        {imageFile && (
                          <button
                            type="button"
                            onClick={handleImageDelete}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-sm text-sm font-medium
                              hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 
                              transition-colors flex items-center"
                          >
                            <i className="fas fa-trash mr-2"></i>
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Student ID Field */}
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Student ID
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-id-card text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="studentId"
                    value={currentStudent.studentId || ''}
                    onChange={onChange}
                    disabled={mode === 'view'}
                    placeholder="Enter student ID"
                    className={`pl-10 w-full rounded-lg border ${
                      mode === 'view' 
                        ? 'bg-gray-50 text-gray-500' 
                        : 'bg-white hover:border-gray-400 focus:border-blue-500'
                    } border-gray-300 shadow-sm p-2.5 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    required
                  />
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name Field */}
                <div className="grid grid-cols-1 gap-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    First Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fas fa-user text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={currentStudent.firstName || ''}
                      onChange={onChange}
                      disabled={mode === 'view'}
                      placeholder="Enter first name"
                      className={`pl-10 w-full rounded-lg border ${
                        mode === 'view' 
                          ? 'bg-gray-50 text-gray-500' 
                          : 'bg-white hover:border-gray-400 focus:border-blue-500'
                      } border-gray-300 shadow-sm p-2.5 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      required
                    />
                  </div>
                </div>

                {/* Last Name Field */}
                <div className="grid grid-cols-1 gap-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Last Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fas fa-user text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={currentStudent.lastName || ''}
                      onChange={onChange}
                      disabled={mode === 'view'}
                      placeholder="Enter last name"
                      className={`pl-10 w-full rounded-lg border ${
                        mode === 'view' 
                          ? 'bg-gray-50 text-gray-500' 
                          : 'bg-white hover:border-gray-400 focus:border-blue-500'
                      } border-gray-300 shadow-sm p-2.5 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={currentStudent.email || ''}
                    onChange={onChange}
                    disabled={mode === 'view'}
                    placeholder="Enter email address"
                    className={`pl-10 w-full rounded-lg border ${
                      mode === 'view' 
                        ? 'bg-gray-50 text-gray-500' 
                        : 'bg-white hover:border-gray-400 focus:border-blue-500'
                    } border-gray-300 shadow-sm p-2.5 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    required
                  />
                </div>
              </div>

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
                  {departmentsLoading ? (
                    <div className="flex items-center pl-10 py-2.5">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 mr-2" />
                      <span>Loading departments...</span>
                    </div>
                  ) : (
                    <select
                      name="department"
                      value={currentStudent.department || ''}
                      onChange={handleLocalChange}
                      disabled={mode === 'view'}
                      className={`pl-10 w-full rounded-lg border ${
                        mode === 'view' 
                          ? 'bg-gray-50 text-gray-500' 
                          : 'bg-white hover:border-gray-400 focus:border-blue-500'
                      } border-gray-300 shadow-sm p-2.5 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
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
                  {!currentStudent.department ? (
                    <div className="flex items-center pl-10 py-2.5 text-gray-500">
                      Please select a department first
                    </div>
                  ) : coursesLoading ? (
                    <div className="flex items-center pl-10 py-2.5">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 mr-2" />
                      <span>Loading courses...</span>
                    </div>
                  ) : (
                    <select
                      name="course"
                      value={currentStudent.course || ''}
                      onChange={handleLocalChange}
                      disabled={mode === 'view' || !currentStudent.department}
                      className={`pl-10 w-full rounded-lg border ${
                        mode === 'view' || !currentStudent.department
                          ? 'bg-gray-50 text-gray-500' 
                          : 'bg-white hover:border-gray-400 focus:border-blue-500'
                      } border-gray-300 shadow-sm p-2.5 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name || course.courseName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {currentStudent.department && courses.length === 0 && !coursesLoading && mode !== 'view' && (
                  <p className="text-sm text-red-500">No courses found for this department</p>
                )}
              </div>

              {/* Class Field */}
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Class
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-users text-gray-400"></i>
                  </div>
                  {!currentStudent.course ? (
                    <div className="flex items-center pl-10 py-2.5 text-gray-500">
                      Please select a course first
                    </div>
                  ) : classesLoading ? (
                    <div className="flex items-center pl-10 py-2.5">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 mr-2" />
                      <span>Loading classes...</span>
                    </div>
                  ) : (
                    <select
                      name="class"
                      value={currentStudent.class || ''}
                      onChange={onChange}
                      disabled={mode === 'view' || !currentStudent.course}
                      className={`pl-10 w-full rounded-lg border ${
                        mode === 'view' || !currentStudent.course
                          ? 'bg-gray-50 text-gray-500' 
                          : 'bg-white hover:border-gray-400 focus:border-blue-500'
                      } border-gray-300 shadow-sm p-2.5 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map(classItem => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {!currentStudent.course && mode !== 'view' && (
                  <p className="text-sm text-gray-500">Please select a course first</p>
                )}
                {currentStudent.course && classes.length === 0 && !classesLoading && mode !== 'view' && (
                  <p className="text-sm text-red-500">No classes found for this course</p>
                )}
              </div>

              {/* RFID Tag Field */}
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  RFID Tag
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-tag text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="rfidTag"
                    value={currentStudent.rfidTag || ''}
                    onChange={onChange}
                    disabled={mode === 'view'}
                    placeholder="Enter RFID tag"
                    className={`pl-10 w-full rounded-lg border ${
                      mode === 'view' 
                        ? 'bg-gray-50 text-gray-500' 
                        : 'bg-white hover:border-gray-400 focus:border-blue-500'
                    } border-gray-300 shadow-sm p-2.5 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    required
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer - Fixed at bottom */}
        <div className="p-4 sm:p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 
                hover:bg-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 
                transition-colors"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg 
                  shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                  transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

StudentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['add', 'edit', 'view']).isRequired,
  currentStudent: PropTypes.shape({
    id: PropTypes.string,
    studentId: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    department: PropTypes.string,
    course: PropTypes.string,
    class: PropTypes.string,
    rfidTag: PropTypes.string,
    profileImageURL: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

StudentModal.defaultProps = {
  currentStudent: {
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    course: '',
    class: '',
    rfidTag: '',
    profileImageURL: null
  },
  loading: false
};

export default StudentModal;
