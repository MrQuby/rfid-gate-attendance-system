import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import { getStudents, deleteStudent, subscribeToStudents, addStudent, updateStudent } from '../../api/students';
import { getDepartments, subscribeToDepartments } from '../../api/departments';
import { getCourses, subscribeToCourses } from '../../api/courses';
import { getClasses, subscribeToClasses } from '../../api/classes';
import { toast } from 'react-toastify';
import StudentModal from '../../components/modals/StudentModal';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';

const AdminStudents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentStudent, setCurrentStudent] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    course: '',
    class: '',
    rfidTag: '',
    profileImageURL: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [departmentMap, setDepartmentMap] = useState({});
  const [courseMap, setCourseMap] = useState({});
  const [classMap, setClassMap] = useState({});

  useEffect(() => {
    // Set up real-time listener for students
    const unsubscribeStudents = subscribeToStudents((updatedStudents) => {
      setStudents(updatedStudents);
    });

    // Set up real-time listener for departments
    const unsubscribeDepartments = subscribeToDepartments((updatedDepartments) => {
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

    // Set up real-time listener for courses
    const unsubscribeCourses = subscribeToCourses((updatedCourses) => {
      if (updatedCourses) {
        setCourses(updatedCourses);
        
        // Create course map for display
        const courseMap = {};
        updatedCourses.forEach(course => {
          courseMap[course.id] = {
            name: course.courseName,
            code: course.courseId
          };
        });
        setCourseMap(courseMap);
      }
    });

    // Set up real-time listener for classes
    const unsubscribeClasses = subscribeToClasses((updatedClasses) => {
      if (updatedClasses) {
        setClasses(updatedClasses);
        
        // Create class map for display
        const classMap = {};
        updatedClasses.forEach(cls => {
          classMap[cls.id] = cls.name;
        });
        setClassMap(classMap);
      }
    });

    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribeStudents();
      unsubscribeDepartments();
      unsubscribeCourses();
      unsubscribeClasses();
    };
  }, []);

  const filteredStudents = students.filter((student) => {
    const searchTerm = searchQuery.toLowerCase();
    const departmentName = departmentMap[student.department] || '';
    const courseInfo = courseMap[student.course] || {};
    const courseCode = courseInfo.code || '';
    const className = classMap[student.class] || '';
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    
    return (
      (student.studentId?.toLowerCase().includes(searchTerm) || '') ||
      (fullName.toLowerCase().includes(searchTerm)) ||
      (student.firstName?.toLowerCase().includes(searchTerm) || '') ||
      (student.lastName?.toLowerCase().includes(searchTerm) || '') ||
      (student.email?.toLowerCase().includes(searchTerm) || '') ||
      departmentName.toLowerCase().includes(searchTerm) ||
      courseCode.toLowerCase().includes(searchTerm) ||
      className.toLowerCase().includes(searchTerm) ||
      (student.rfidTag?.toLowerCase().includes(searchTerm) || '')
    );
  });

  // Calculate pagination
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleOpenModal = (mode, student = null) => {
    setModalMode(mode);
    setCurrentStudent(student || {
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      course: '',
      class: '',
      rfidTag: '',
      profileImageURL: null
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentStudent({
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      course: '',
      class: '',
      rfidTag: '',
      profileImageURL: null
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (modalMode === 'add') {
        await addStudent(currentStudent);
        toast.success('Student added successfully');
      } else if (modalMode === 'edit' && currentStudent.id) {
        await updateStudent(currentStudent.id, currentStudent);
        toast.success('Student updated successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error('Failed to save student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteModal = (student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;

    try {
      await deleteStudent(studentToDelete.id);
      toast.success('Student archived successfully');
      setDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error archiving student:', error);
      toast.error('Failed to archive student');
    }
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
    const charCodeSum = fullName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
        <AdminHeader title="Student Management" />
      
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
              </div>
            </div>

            <div className="flex gap-2">
              <SearchBar
                placeholder="Search Students"
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
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    RFID Tag
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((student, index) => (
                  <tr key={student.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium hidden sm:table-cell">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {student.profileImageURL ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img 
                              src={student.profileImageURL} 
                              alt={`${student.firstName} ${student.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${getProfileColor(student.firstName, student.lastName)}`}>
                            {getProfileInitials(student.firstName, student.lastName)}
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {classMap[student.class] || '-'}
                          </div>
                          <div className="text-xs text-gray-500 md:hidden">
                            {student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                      {departmentMap[student.department] || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                      {courseMap[student.course]?.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                      {student.rfidTag}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => handleOpenModal('view', student)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition duration-200"
                          title="View"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleOpenModal('edit', student)}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2.5 py-1 rounded-lg transition duration-200"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(student)}
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
                    <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan="9" className="px-6 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </main>

          {/* Pagination */}
          {filteredStudents.length > 0 && (
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

      {/* Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        currentStudent={currentStudent}
        onSubmit={handleSubmit}
        onChange={handleChange}
        loading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Archive Student"
        message={`Are you sure you want to archive ${studentToDelete?.firstName} ${studentToDelete?.lastName}? This student will be hidden from the system but can be restored later.`}
      />
    </div>
  );
};

export default AdminStudents;
