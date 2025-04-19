import React, { useState, useEffect } from 'react';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher, subscribeToTeachers } from '../../../api/teachers';
import { getDepartments, subscribeToDepartments } from '../../../api/departments';
import { getClasses, subscribeToClasses } from '../../../api/classes';
import { getCourses, subscribeToCourses } from '../../../api/courses';
import { toast } from 'react-toastify';
import TeacherModal from '../../modals/TeacherModal';
import DeleteConfirmationModal from '../../modals/DeleteConfirmationModal';
import Pagination from '../../common/Pagination';
import SearchBar from '../../common/SearchBar';

const TeacherContent = () => {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [currentTeacher, setCurrentTeacher] = useState({
    teacherId: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    courses: [],
    classes: [],
    profileImageURL: null
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentMap, setDepartmentMap] = useState({});
  const [classMap, setClassMap] = useState({});
  const [courseMap, setCourseMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribeTeachers = subscribeToTeachers((updatedTeachers) => {
      if (updatedTeachers) {
        setTeachers(updatedTeachers);
      }
    });

    const unsubscribeDepts = subscribeToDepartments((updatedDepartments) => {
      if (updatedDepartments) {
        setDepartments(updatedDepartments);
        
        // Create department map for display
        const deptMap = {};
        updatedDepartments.forEach(dept => {
          deptMap[dept.id] = dept.name;
        });
        setDepartmentMap(deptMap);
      }
    });

    const unsubscribeClasses = subscribeToClasses((updatedClasses) => {
      if (updatedClasses) {
        setClasses(updatedClasses);
        
        // Create class map for display
        const classMap = {};
        updatedClasses.forEach(cls => {
          classMap[cls.id] = { ...cls };
        });
        setClassMap(classMap);
      }
    });

    const unsubscribeCourses = subscribeToCourses((updatedCourses) => {
      if (updatedCourses) {
        setCourses(updatedCourses);
        
        // Create course map for display
        const courseMap = {};
        updatedCourses.forEach(course => {
          courseMap[course.id] = {
            name: course.title || course.courseName,
            code: course.code || course.courseId
          };
        });
        setCourseMap(courseMap);
      }
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeDepts();
      unsubscribeClasses();
      unsubscribeCourses();
    };
  }, []);

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || 
      teacher.email.toLowerCase().includes(query) || 
      teacher.teacherId.toLowerCase().includes(query) ||
      (departmentMap[teacher.department] && departmentMap[teacher.department].toLowerCase().includes(query));
  });

  // Pagination logic
  const indexOfLastTeacher = currentPage * itemsPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleOpenModal = (mode, teacher = null) => {
    setModalMode(mode);
    
    if (teacher) {
      setCurrentTeacher({
        ...teacher,
      });
    } else {
      setCurrentTeacher({
        teacherId: '',
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        courses: [],
        classes: [],
        profileImageURL: null
      });
    }
    
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTeacher(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modalMode === 'add') {
        await addTeacher(currentTeacher);
        toast.success('Teacher added successfully');
      } else if (modalMode === 'edit') {
        await updateTeacher(currentTeacher.id, currentTeacher);
        toast.success('Teacher updated successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting teacher:', error);
      toast.error('Failed to save teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (teacher) => {
    setTeacherToDelete(teacher);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setTeacherToDelete(null);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    
    try {
      await deleteTeacher(teacherToDelete.id);
      toast.success('Teacher archived successfully');
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error('Failed to archive teacher');
    }
  };

  // Helper function to display classes
  const getClassesDisplay = (classIds) => {
    if (!classIds || !classIds.length) return '-';
    
    return classIds
      .map(id => {
        const classItem = classMap[id];
        const course = courseMap[classItem?.courseId];
        if (classItem && course) {
          return `${course.code} ${classItem.name}`;
        }
        return '';
      })
      .filter(name => name)
      .join(', ');
  };

  // Helper function to get profile initials
  const getProfileInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  // Helper function to get background color based on name
  const getProfileColor = (firstName, lastName) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    const fullName = `${firstName}${lastName}`;
    if (!fullName) return colors[0];
    
    const charCodeSum = fullName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <SearchBar
            placeholder="Search Teachers"
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
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Teacher ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Classes
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTeachers.map((teacher, index) => (
              <tr key={teacher.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium hidden sm:table-cell">
                  {indexOfFirstTeacher + index + 1}
                </td>
                <td className="px-6 whitespace-nowrap">
                  <div className="flex items-center">
                    {teacher.profileImageURL ? (
                      <img 
                        src={teacher.profileImageURL} 
                        alt={`${teacher.firstName} ${teacher.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${getProfileColor(teacher.firstName, teacher.lastName)}`}>
                        {getProfileInitials(teacher.firstName, teacher.lastName)}
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden">
                        {teacher.teacherId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                  {teacher.teacherId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                  {teacher.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                  <div className="text-sm">
                    {departmentMap[teacher.department] || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                  <div className="text-sm">
                    {getClassesDisplay(teacher.classes)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition duration-200"
                      onClick={() => handleOpenModal('view', teacher)}
                      title="View"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2.5 py-1 rounded-lg transition duration-200"
                      onClick={() => handleOpenModal('edit', teacher)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition duration-200"
                      onClick={() => handleOpenDeleteModal(teacher)}
                      title="Archive"
                    >
                      <i className="fas fa-archive"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentTeachers.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No teachers found
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
      {filteredTeachers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={filteredTeachers.length}
        />
      )}

      {/* Teacher Modal */}
      <TeacherModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        teacher={currentTeacher}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        departments={departments}
        loading={loading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteTeacher}
        title="Archive Teacher"
        message={`Are you sure you want to archive ${teacherToDelete?.firstName} ${teacherToDelete?.lastName}?`}
        confirmButtonText="Archive"
      />
    </div>
  );
};

export default TeacherContent;
