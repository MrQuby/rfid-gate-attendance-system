import React, { useState, useEffect } from 'react';
import { getDepartments, addDepartment, updateDepartment, deleteDepartment, restoreDepartment, subscribeToDepartments } from '../../api/departments';
import DepartmentModal from '../../components/modals/DepartmentModal';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentDepartment, setCurrentDepartment] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Initial fetch
    getDepartments()
      .then(data => {
        setDepartments(data);
      })
      .catch(error => {
        console.error('Error fetching departments:', error);
        toast.error('Failed to fetch departments');
      });

    // Set up real-time listener
    const unsubscribe = subscribeToDepartments((updatedDepartments) => {
      setDepartments(updatedDepartments);
    });

    // Clean up subscription when component unmounts
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (mode, department = null) => {
    setModalMode(mode);
    setCurrentDepartment(department || { name: '', code: '', description: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentDepartment({ name: '', code: '', description: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDepartment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalMode === 'add') {
        await addDepartment(currentDepartment);
        toast.success('Department added successfully');
      } else if (modalMode === 'edit') {
        await updateDepartment(currentDepartment.id, currentDepartment);
        toast.success('Department updated successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting department:', error);
      toast.error('Failed to save department');
    }
  };

  const handleOpenDeleteModal = (department) => {
    setDepartmentToDelete(department);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;

    try {
      await deleteDepartment(departmentToDelete.id);
      toast.success('Department archived successfully');
      setDeleteModalOpen(false);
      setDepartmentToDelete(null);
    } catch (error) {
      console.error('Error archiving department:', error);
      toast.error('Failed to archive department');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  const handleReset = () => {
    setSearchQuery('');
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredDepartments = departments.filter((department) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      department.name.toLowerCase().includes(searchTerm) ||
      department.code.toLowerCase().includes(searchTerm) ||
      department.description.toLowerCase().includes(searchTerm)
    );
  });

  // Calculate pagination
  const totalItems = filteredDepartments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
        <AdminHeader title="Department Management" />
      
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <h1 className="hidden md:block text-lg font-semibold">All Departments</h1>
              </div>
            </div>

            <div className="flex gap-2">
              <SearchBar
                placeholder="Search Departments"
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
                    Department Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Code
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
                {currentItems.map((department, index) => (
                  <tr 
                    key={department.id} 
                    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium hidden sm:table-cell">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {department.name}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden">
                        {department.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm">
                        {department.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm">
                        {department.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => handleOpenModal('view', department)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition duration-200"
                          title="View"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleOpenModal('edit', department)}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2.5 py-1 rounded-lg transition duration-200"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(department)}
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
                      No departments found
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
          {filteredDepartments.length > 0 && (
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

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        currentDepartment={currentDepartment}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDelete}
        title="Archive Department"
        message={`Are you sure you want to archive the department '${departmentToDelete?.name}'? The department will be hidden but can be restored later.`}
      />
    </div>
  );
};

export default AdminDepartments;
