import React, { useState, useEffect } from 'react';
import { getClasses, addClass, updateClass, deleteClass, restoreClass, subscribeToClasses } from '../../api/classes';
import { getDepartments } from '../../api/departments';
import { getCourses } from '../../api/courses';
import { getStudentsByClass, subscribeToStudentsByClass } from '../../api/students';
import ClassModal from '../modals/ClassModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { toast } from 'react-toastify';
import Pagination from '../common/Pagination';
import SearchBar from '../common/SearchBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const ClassesContent = () => {
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentClass, setCurrentClass] = useState({
    name: '',
    capacity: 50,
    yearLevel: '1st',
    departmentId: '',
    courseId: ''
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [departmentMap, setDepartmentMap] = useState({});
  const [courseMap, setCourseMap] = useState({});
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set up real-time listener for classes
    const unsubscribe = subscribeToClasses((updatedClasses) => {
      setClasses(updatedClasses);
      
      // Set up enrollment count listeners for each class
      updatedClasses.forEach(classItem => {
        subscribeToStudentsByClass(classItem.id, (students) => {
          setEnrollmentCounts(prev => ({
            ...prev,
            [classItem.id]: students.length
          }));
        });
      });
    });

    // Fetch departments and courses for display
    const fetchDepartmentsAndCourses = async () => {
      try {
        const departments = await getDepartments();
        const courses = await getCourses();
        
        // Create maps for display
        const deptMap = {};
        departments.forEach(dept => {
          deptMap[dept.id] = dept.name;
        });
        setDepartmentMap(deptMap);
        
        const courseMap = {};
        courses.forEach(course => {
          courseMap[course.id] = {
            name: course.courseName,
            code: course.courseId
          };
        });
        setCourseMap(courseMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch required data');
      }
    };
    
    fetchDepartmentsAndCourses();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenModal = (mode, classItem = null) => {
    setModalMode(mode);
    
    if (classItem) {
      setCurrentClass({
        ...classItem
      });
    } else {
      setCurrentClass({
        name: '',
        capacity: 50,
        yearLevel: '1st',
        departmentId: '',
        courseId: ''
      });
    }
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentClass({
      name: '',
      capacity: 50,
      yearLevel: '1st',
      departmentId: '',
      courseId: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentClass(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setLoading(true);
    try {
      if (modalMode === 'add') {
        await addClass(currentClass);
        toast.success('Class added successfully');
      } else if (modalMode === 'edit') {
        await updateClass(currentClass.id, currentClass);
        toast.success('Class updated successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting class:', error);
      toast.error('Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (classItem) => {
    setClassToDelete(classItem);
    setDeleteModalOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    
    setLoading(true);
    try {
      await deleteClass(classToDelete.id);
      toast.success('Class deleted successfully');
      setDeleteModalOpen(false);
      setClassToDelete(null);
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setClassToDelete(null);
  };

  // Filter classes based on search query
  const filteredClasses = classes.filter(classItem => {
    const query = searchQuery.toLowerCase();
    return (
      classItem.name.toLowerCase().includes(query) ||
      (departmentMap[classItem.departmentId] && departmentMap[classItem.departmentId].toLowerCase().includes(query)) ||
      (courseMap[classItem.courseId] && courseMap[classItem.courseId].name.toLowerCase().includes(query)) ||
      (courseMap[classItem.courseId] && courseMap[classItem.courseId].code.toLowerCase().includes(query)) ||
      classItem.yearLevel.toLowerCase().includes(query)
    );
  });

  // Pagination logic
  const totalItems = filteredClasses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <SearchBar
            placeholder="Search Classes"
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <button
            onClick={() => handleOpenModal('add')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-700 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>

      {/* Classes Table */}
      <main className="w-full mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Year Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Enrollment
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((classItem, index) => (
              <tr key={classItem.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hidden sm:table-cell">
                  {indexOfFirstItem + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                  <div className="text-xs text-gray-500 md:hidden">
                    {courseMap[classItem.courseId]?.code}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                  {courseMap[classItem.courseId] && (
                    <div>
                      <div className="font-medium">{courseMap[classItem.courseId].code}</div>
                      <div className="text-xs">{courseMap[classItem.courseId].name}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {departmentMap[classItem.departmentId]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {classItem.yearLevel}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  <div className="flex items-center">
                    <span>{enrollmentCounts[classItem.id] || 0}/{classItem.capacity}</span>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          ((enrollmentCounts[classItem.id] || 0) / classItem.capacity) > 0.8
                            ? 'bg-red-500'
                            : ((enrollmentCounts[classItem.id] || 0) / classItem.capacity) > 0.5
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            ((enrollmentCounts[classItem.id] || 0) / classItem.capacity) * 100,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() => handleOpenModal('view', classItem)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition duration-200"
                      title="View"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      onClick={() => handleOpenModal('edit', classItem)}
                      className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2.5 py-1 rounded-lg transition duration-200"
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(classItem)}
                      className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition duration-200"
                      title="Delete"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No classes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>

      {/* Pagination */}
      {filteredClasses.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
        />
      )}

      {/* Class Modal */}
      <ClassModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        currentClass={currentClass}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        loading={loading}
        departments={Object.entries(departmentMap).map(([id, name]) => ({ id, name }))}
        courses={Object.values(courseMap)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteClass}
        title="Delete Class"
        message={`Are you sure you want to delete the class "${classToDelete?.name}"?`}
        confirmButtonText="Delete"
        loading={loading}
      />
    </div>
  );
};

export default ClassesContent;
