import React, { useState, useEffect } from 'react';
import CourseModal from '../modals/CourseModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { getCourses, addCourse, updateCourse, deleteCourse, subscribeToCourses } from '../../api/courses';
import { getDepartments, subscribeToDepartments } from '../../api/departments';
import { toast } from 'react-toastify';
import Pagination from '../common/Pagination';
import SearchBar from '../common/SearchBar';

const CoursesContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [currentCourse, setCurrentCourse] = useState({
    courseId: '',
    courseName: '',
    description: ''
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    courseId: null,
    courseName: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    // Initial fetch for courses and departments
    Promise.all([
      getCourses(),
      getDepartments()
    ]).then(([coursesData, departmentsData]) => {
      setCourses(coursesData);
      setDepartments(departmentsData);
    }).catch(error => {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch required data');
    });

    // Set up real-time listeners
    const unsubscribeCourses = subscribeToCourses((updatedCourses) => {
      setCourses(updatedCourses);
    });

    const unsubscribeDepts = subscribeToDepartments((updatedDepartments) => {
      setDepartments(updatedDepartments);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeDepts();
    };
  }, []);

  const openModal = (mode, course = null) => {
    setModalMode(mode);
    if (course) {
      setCurrentCourse({
        ...course
      });
    } else {
      setCurrentCourse({
        courseId: '',
        code: '',
        title: '',
        description: '',
        department: '',
        credits: 3
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCourse({
      courseId: '',
      code: '',
      title: '',
      description: '',
      department: '',
      credits: 3
    });
  };

  const handleInputChange = (field, value) => {
    setCurrentCourse({
      ...currentCourse,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      if (modalMode === 'add') {
        await addCourse(currentCourse);
        toast.success('Course added successfully');
      } else if (modalMode === 'edit') {
        await updateCourse(currentCourse.id, currentCourse);
        toast.success('Course updated successfully');
      }
      closeModal();
    } catch (error) {
      console.error('Error submitting course:', error);
      toast.error('Failed to save course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteModal = (course) => {
    setDeleteModal({
      isOpen: true,
      courseId: course.id,
      courseName: course.title
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.courseId) return;
    
    try {
      await deleteCourse(deleteModal.courseId);
      toast.success('Course deleted successfully');
      setDeleteModal({
        isOpen: false,
        courseId: null,
        courseName: ''
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({
      isOpen: false,
      courseId: null,
      courseName: ''
    });
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter(course => {
    const query = searchQuery.toLowerCase();
    return (
      (course.code && course.code.toLowerCase().includes(query)) ||
      (course.title && course.title.toLowerCase().includes(query)) ||
      (course.description && course.description.toLowerCase().includes(query))
    );
  });

  // Pagination logic
  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

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
            <h1 className="hidden md:block text-lg font-semibold">All Courses</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <SearchBar
            placeholder="Search Courses"
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <button
            onClick={() => openModal('add')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-700 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>

      {/* Courses Table */}
      <main className="w-full mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Course ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Description
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((course, index) => (
              <tr key={course.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hidden sm:table-cell">
                  {indexOfFirstItem + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hidden md:table-cell">
                  {course.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-0">
                      <div className="text-sm font-medium text-gray-900">
                        {course.title}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden">
                        {course.code}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {course.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() => openModal('view', course)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition duration-200"
                      title="View"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      onClick={() => openModal('edit', course)}
                      className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2.5 py-1 rounded-lg transition duration-200"
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(course)}
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
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No courses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>

      {/* Pagination */}
      {filteredCourses.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
        />
      )}

      {/* Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        mode={modalMode}
        course={currentCourse}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        isLoading={isLoading}
        departments={departments}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        message={`Are you sure you want to delete the course "${deleteModal.courseName}"?`}
        confirmButtonText="Delete"
      />
    </div>
  );
};

export default CoursesContent;
