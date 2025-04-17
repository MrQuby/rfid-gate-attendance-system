import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { getClasses } from '../../api/classes';
import { getCourses } from '../../api/courses';

const TeacherModal = ({ 
  isOpen, 
  onClose, 
  mode, 
  teacher, 
  onSubmit, 
  onInputChange,
  departments = []
}) => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [classesByCourse, setClassesByCourse] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(teacher.profileImageURL || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Set image preview if teacher has a profile image
      setImagePreview(teacher.profileImageURL || null);
    }
  }, [isOpen, teacher.profileImageURL]);
  
  useEffect(() => {
    if (teacher.classes) {
      setSelectedClasses(teacher.classes);
      
      // Determine selected courses based on selected classes
      if (classes.length > 0) {
        const coursesSet = new Set();
        teacher.classes.forEach(classId => {
          const classItem = classes.find(c => c.id === classId);
          if (classItem && classItem.courseId) {
            coursesSet.add(classItem.courseId);
          }
        });
        setSelectedCourses(Array.from(coursesSet));
      }
    } else {
      setSelectedClasses([]);
      setSelectedCourses([]);
    }
  }, [teacher.classes, classes]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch courses
      const coursesData = await getCourses();
      setCourses(coursesData);
      
      // Fetch classes
      const classesData = await getClasses();
      setClasses(classesData);
      
      // Group classes by course
      const groupedClasses = {};
      classesData.forEach(classItem => {
        const courseId = classItem.courseId;
        if (!groupedClasses[courseId]) {
          groupedClasses[courseId] = [];
        }
        groupedClasses[courseId].push(classItem);
      });
      
      setClassesByCourse(groupedClasses);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    let updatedCourses;
    
    if (e.target.checked) {
      updatedCourses = [...selectedCourses, courseId];
    } else {
      updatedCourses = selectedCourses.filter(id => id !== courseId);
      
      // Remove classes from this course from selected classes
      const classesFromCourse = classesByCourse[courseId] || [];
      const classIdsFromCourse = classesFromCourse.map(c => c.id);
      const updatedClasses = selectedClasses.filter(id => !classIdsFromCourse.includes(id));
      
      setSelectedClasses(updatedClasses);
      onInputChange({
        target: {
          name: 'classes',
          value: updatedClasses
        }
      });
    }
    
    setSelectedCourses(updatedCourses);
  };
  
  const handleClassChange = (e) => {
    const classId = e.target.value;
    let updatedClasses;
    
    if (e.target.checked) {
      updatedClasses = [...selectedClasses, classId];
    } else {
      updatedClasses = selectedClasses.filter(id => id !== classId);
    }
    
    setSelectedClasses(updatedClasses);
    
    // Update the teacher object with the new classes
    onInputChange({
      target: {
        name: 'classes',
        value: updatedClasses
      }
    });
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
        
        // Automatically update the teacher object with the image data URL
        onInputChange({
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
    // Clear the image file and preview
    setImageFile(null);
    setImagePreview(null);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Update the teacher object to remove the image
    onInputChange({
      target: {
        name: 'profileImageURL',
        value: null
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If there's a new image file and we're in add mode, we'll upload it after the teacher is created
    const hasNewImage = imageFile !== null;
    
    // Call the original onSubmit function
    await onSubmit(e);
    
    // If we're in edit mode and there's a new image, upload it
    if (mode === 'edit' && hasNewImage) {
      // No need to upload image as it's already updated in handleImageChange
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-auto flex flex-col max-h-[90vh]">
        {/* Modal Header - Fixed at top */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-blue-900">
              {mode === 'add' ? 'Add New Teacher' : mode === 'edit' ? 'Edit Teacher' : 'View Teacher'}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {mode === 'add' ? 'Create a new teacher account' : mode === 'edit' ? 'Modify teacher details' : 'View teacher information'}
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                          disabled={uploadingImage}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                            transition-colors flex items-center"
                          disabled={uploadingImage}
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
                            disabled={uploadingImage}
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

              {/* Teacher ID Field */}
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Teacher ID
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-id-card text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="teacherId"
                    value={teacher.teacherId}
                    onChange={onInputChange}
                    placeholder="Enter teacher ID"
                    className="pl-10 w-full rounded-lg border border-gray-300 shadow-sm p-2.5 
                      bg-white hover:border-gray-400 focus:border-blue-500 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    required
                    disabled={mode === 'view'}
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
                      value={teacher.firstName || ''}
                      onChange={onInputChange}
                      placeholder="Enter first name"
                      className="pl-10 w-full rounded-lg border border-gray-300 shadow-sm p-2.5 
                        bg-white hover:border-gray-400 focus:border-blue-500 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      required
                      disabled={mode === 'view'}
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
                      value={teacher.lastName || ''}
                      onChange={onInputChange}
                      placeholder="Enter last name"
                      className="pl-10 w-full rounded-lg border border-gray-300 shadow-sm p-2.5 
                        bg-white hover:border-gray-400 focus:border-blue-500 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      required
                      disabled={mode === 'view'}
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
                    value={teacher.email}
                    onChange={onInputChange}
                    placeholder="Enter email address"
                    className="pl-10 w-full rounded-lg border border-gray-300 shadow-sm p-2.5 
                      bg-white hover:border-gray-400 focus:border-blue-500 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    required
                    disabled={mode === 'view'}
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
                  <select
                    name="department"
                    value={teacher.department}
                    onChange={onInputChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 shadow-sm p-2.5 
                      bg-white hover:border-gray-400 focus:border-blue-500 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    required
                    disabled={mode === 'view'}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Courses Field */}
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Assigned Courses
                </label>
                {loading ? (
                  <div className="flex items-center justify-center p-4 border rounded-lg">
                    <i className="fas fa-spinner spin text-blue-500 mr-2"></i>
                    <span>Loading courses...</span>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {courses.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {courses.map(course => {
                          const isChecked = selectedCourses.includes(course.id);
                          return (
                            <div key={course.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`course-${course.id}`}
                                value={course.id}
                                checked={isChecked}
                                onChange={handleCourseChange}
                                disabled={mode === 'view'}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`course-${course.id}`}
                                className="ml-2 block text-sm text-gray-700"
                              >
                                {course.courseId}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No courses available</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Classes Field */}
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Assigned Classes
                </label>
                {loading ? (
                  <div className="flex items-center justify-center p-4 border rounded-lg">
                    <i className="fas fa-spinner spin text-blue-500 mr-2"></i>
                    <span>Loading classes...</span>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                    {selectedCourses.length > 0 ? (
                      <div className="space-y-4">
                        {selectedCourses.map(courseId => {
                          const course = courses.find(c => c.id === courseId);
                          const courseClasses = classesByCourse[courseId] || [];
                          if (!course || courseClasses.length === 0) return null;
                          
                          return (
                            <div key={courseId} className="border-b pb-2 last:border-b-0 last:pb-0">
                              <h4 className="font-medium text-gray-700 mb-2">{course.courseId}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {courseClasses.map(classItem => {
                                  const isChecked = selectedClasses.includes(classItem.id);
                                  return (
                                    <div key={classItem.id} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        id={`class-${classItem.id}`}
                                        value={classItem.id}
                                        checked={isChecked}
                                        onChange={handleClassChange}
                                        disabled={mode === 'view'}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <label
                                        htmlFor={`class-${classItem.id}`}
                                        className="ml-2 block text-sm text-gray-700"
                                      >
                                        {classItem.name}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Please select courses first to view available classes</p>
                    )}
                  </div>
                )}
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
                type="submit"
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                  transition-colors"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <i className="fas fa-spinner spin mr-2"></i>
                    {mode === 'add' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'add' ? 'Create Teacher' : 'Update Teacher'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

TeacherModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['add', 'edit', 'view']).isRequired,
  teacher: PropTypes.shape({
    id: PropTypes.string,
    teacherId: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    department: PropTypes.string,
    courses: PropTypes.arrayOf(PropTypes.string),
    classes: PropTypes.arrayOf(PropTypes.string),
    profileImageURL: PropTypes.string
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  departments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  )
};

export default TeacherModal;
