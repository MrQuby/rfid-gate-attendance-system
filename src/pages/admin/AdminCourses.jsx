import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import CourseModal from '../../components/modals/CourseModal';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import { getCourses, addCourse, updateCourse, deleteCourse, subscribeToCourses } from '../../api/courses';
import { getDepartments, subscribeToDepartments } from '../../api/departments';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';

const AdminCourses = () => {
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

    // Clean up subscriptions
    return () => {
      unsubscribeCourses();
      unsubscribeDepts();
    };
  }, []);

  // Modal handlers
  const openModal = (mode, course = null) => {
    setModalMode(mode);
    setCurrentCourse(course || { courseId: '', courseName: '', description: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCourse({ courseId: '', courseName: '', description: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // CRUD operations
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      console.error('Error:', error);
      toast.error(modalMode === 'add' ? 'Failed to add course' : 'Failed to update course');
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await deleteCourse(courseId);
      toast.success('Course archived successfully');
      setDeleteModal({ isOpen: false, courseId: null, courseName: '' });
    } catch (error) {
      console.error('Error archiving course:', error);
      toast.error('Failed to archive course');
    }
  };

  const openDeleteModal = (course) => {
    setDeleteModal({
      isOpen: true,
      courseId: course.id,
      courseName: course.courseName
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      courseId: null,
      courseName: ''
    });
  };

  const filteredCourses = courses.filter((course) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      course.courseId.toLowerCase().includes(searchTerm) ||
      course.courseName.toLowerCase().includes(searchTerm) ||
      course.description.toLowerCase().includes(searchTerm)
    );
  });

  // Calculate pagination
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
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
        <AdminHeader title="Course List" />

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
                  <tr key={course.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium hidden sm:table-cell">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                      {course.courseId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {course.courseName}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden">
                        {course.courseId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm line-clamp-2">
                        {course.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                          onClick={() => openDeleteModal(course)}
                          className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition duration-200"
                          title="Archive"
                        >
                          <i className="fas fa-archive"></i>
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
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan="5" className="px-6 py-2"></td>
                </tr>
              </tfoot>
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
            onClose={closeModal}
            mode={modalMode}
            currentCourse={currentCourse}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
            loading={isLoading}
            departments={departments}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={closeDeleteModal}
            onConfirm={() => handleDelete(deleteModal.courseId)}
            title="Archive Course"
            message={`Are you sure you want to archive "${deleteModal.courseName}"? This action can be undone later.`}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCourses;
