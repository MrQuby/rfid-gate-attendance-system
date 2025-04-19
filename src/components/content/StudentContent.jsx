import React, { useState, useEffect } from 'react';
import { getStudents, deleteStudent, subscribeToStudents, addStudent, updateStudent } from '../../api/students';
import { getDepartments, subscribeToDepartments } from '../../api/departments';
import { getClasses, subscribeToClasses } from '../../api/classes';
import { getCourses, subscribeToCourses } from '../../api/courses';
import { toast } from 'react-toastify';
import StudentModal from '../modals/StudentModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import Pagination from '../common/Pagination';
import SearchBar from '../common/SearchBar';

const StudentContent = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const [classMap, setClassMap] = useState({});
  const [courseMap, setCourseMap] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set up listeners for real-time updates
    const unsubscribeStudents = subscribeToStudents((updatedStudents) => {
      if (updatedStudents) {
        setStudents(updatedStudents);
        setTotalItems(updatedStudents.length);
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
        const clsMap = {};
        updatedClasses.forEach(cls => {
          clsMap[cls.id] = cls.name;
        });
        setClassMap(clsMap);
      }
    });

    const unsubscribeCourses = subscribeToCourses((updatedCourses) => {
      if (updatedCourses) {
        setCourses(updatedCourses);
        
        // Create course map for display
        const crsMap = {};
        updatedCourses.forEach(course => {
          crsMap[course.id] = course;
        });
        setCourseMap(crsMap);
      }
    });

    // Cleanup function to unsubscribe from listeners
    return () => {
      unsubscribeStudents();
      unsubscribeDepts();
      unsubscribeClasses();
      unsubscribeCourses();
    };
  }, []);

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || 
      student.email?.toLowerCase().includes(query) || 
      student.studentId?.toLowerCase().includes(query) ||
      student.rfidTag?.toLowerCase().includes(query) ||
      (departmentMap[student.department] && departmentMap[student.department].toLowerCase().includes(query));
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleOpenModal = (mode, student = null) => {
    setModalMode(mode);
    
    if (student) {
      setCurrentStudent({
        ...student
      });
    } else {
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
    }
    
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleInputChange = (field, value) => {
    setCurrentStudent({
      ...currentStudent,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (modalMode === 'add') {
        await addStudent(currentStudent);
        toast.success('Student added successfully');
      } else if (modalMode === 'edit') {
        await updateStudent(currentStudent.id, currentStudent);
        toast.success('Student updated successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting student:', error);
      toast.error('Failed to save student');
    } finally {
      setLoading(false);
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
    <div className="bg-white p-4 mt-4 rounded-md flex-1 m-4 mt-0">
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
              <tr key={student.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium hidden sm:table-cell">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="px-6 whitespace-nowrap">
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

      {/* Student Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        currentStudent={currentStudent}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        loading={loading}
        departments={departments}
        courses={courses}
        classes={classes}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Archive Student"
        message={`Are you sure you want to archive ${studentToDelete?.firstName} ${studentToDelete?.lastName}?`}
        confirmButtonText="Archive"
      />
    </div>
  );
};

export default StudentContent;
