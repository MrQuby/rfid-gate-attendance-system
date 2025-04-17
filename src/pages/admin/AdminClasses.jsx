import React, { useState, useEffect } from 'react';
import { getClasses, addClass, updateClass, deleteClass, restoreClass, subscribeToClasses } from '../../api/classes';
import { getDepartments } from '../../api/departments';
import { getCourses } from '../../api/courses';
import { getStudentsByClass, subscribeToStudentsByClass } from '../../api/students';
import ClassModal from '../../components/modals/ClassModal';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';

const AdminClasses = () => {
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentClass, setCurrentClass] = useState({
    name: '',
    capacity: '',
    yearLevel: '',
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
        // Fetch departments
        const departmentsData = await getDepartments();
        const deptMap = {};
        departmentsData.forEach(dept => {
          deptMap[dept.id] = dept.name;
        });
        setDepartmentMap(deptMap);

        // Fetch courses
        const coursesData = await getCourses();
        const courseMap = {};
        coursesData.forEach(course => {
          courseMap[course.id] = {
            name: course.courseName,
            code: course.courseId
          };
        });
        setCourseMap(courseMap);
      } catch (error) {
        console.error('Error fetching reference data:', error);
        toast.error('Failed to load reference data');
      }
    };

    fetchDepartmentsAndCourses();

    // Clean up subscription when component unmounts
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (mode, classItem = null) => {
    setModalMode(mode);
    setCurrentClass(classItem || {
      name: '',
      capacity: '',
      yearLevel: '',
      departmentId: '',
      courseId: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentClass({
      name: '',
      capacity: '',
      yearLevel: '',
      departmentId: '',
      courseId: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentClass(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value, 10) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    }
  };

  const handleOpenDeleteModal = (classItem) => {
    setClassToDelete(classItem);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!classToDelete) return;

    try {
      await deleteClass(classToDelete.id);
      toast.success('Class archived successfully');
      setDeleteModalOpen(false);
      setClassToDelete(null);
    } catch (error) {
      console.error('Error archiving class:', error);
      toast.error('Failed to archive class');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setClassToDelete(null);
  };

  const handleReset = () => {
    setSearchQuery('');
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate remaining capacity
  const getRemainingCapacity = (classId, totalCapacity) => {
    const enrolled = enrollmentCounts[classId] || 0;
    return totalCapacity - enrolled;
  };

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredClasses = classes.filter((classItem) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      classItem.name.toLowerCase().includes(searchTerm) ||
      classItem.yearLevel.toLowerCase().includes(searchTerm) ||
      (departmentMap[classItem.departmentId] && departmentMap[classItem.departmentId].toLowerCase().includes(searchTerm)) ||
      (courseMap[classItem.courseId] && 
        (courseMap[classItem.courseId].name.toLowerCase().includes(searchTerm) || 
         courseMap[classItem.courseId].code.toLowerCase().includes(searchTerm)))
    );
  });

  // Calculate pagination
  const totalItems = filteredClasses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
        <AdminHeader title="Class Management" />
      
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
          <main className="w-full mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Year Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((classItem, index) => (
                  <tr 
                    key={classItem.id} 
                    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium hidden sm:table-cell">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {classItem.name}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden">
                        {classItem.yearLevel} - {courseMap[classItem.courseId]?.code || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm">{classItem.yearLevel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm">
                        {courseMap[classItem.courseId] 
                          ? `${courseMap[classItem.courseId].name} (${courseMap[classItem.courseId].code})` 
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm">
                        {departmentMap[classItem.departmentId] || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm">
                        <span className={`font-medium ${getRemainingCapacity(classItem.id, classItem.capacity) <= 5 ? 'text-amber-600' : ''} ${getRemainingCapacity(classItem.id, classItem.capacity) <= 0 ? 'text-red-600' : ''}`}>
                          {getRemainingCapacity(classItem.id, classItem.capacity)}
                        </span>
                        <span className="text-gray-500"> / {classItem.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No classes found
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan="7" className="px-6 py-2"></td>
                </tr>
              </tfoot>
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
        </div>
      </div>

      {/* Class Modal */}
      <ClassModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        currentClass={currentClass}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        departments={departmentMap}
        courses={courseMap}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDelete}
        title="Archive Class"
        message={`Are you sure you want to archive ${classToDelete?.name}? This class will be hidden from the system but can be restored later.`}
      />
    </div>
  );
};

export default AdminClasses;
