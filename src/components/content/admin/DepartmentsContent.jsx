import React, { useState, useEffect } from 'react';
import { getDepartments, addDepartment, updateDepartment, deleteDepartment, restoreDepartment, subscribeToDepartments } from '../../../api/departments';
import DepartmentModal from '../../modals/DepartmentModal';
import DeleteConfirmationModal from '../../modals/DeleteConfirmationModal';
import { toast } from 'react-toastify';
import Pagination from '../../common/Pagination';
import SearchBar from '../../common/SearchBar';

const DepartmentsContent = () => {
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentDepartment, setCurrentDepartment] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set up real-time listener
    const unsubscribe = subscribeToDepartments((updatedDepartments) => {
      setDepartments(updatedDepartments);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenModal = (mode, dept = null) => {
    setModalMode(mode);
    
    if (dept) {
      setCurrentDepartment({
        ...dept
      });
    } else {
      setCurrentDepartment({
        name: '',
        code: '',
        description: ''
      });
    }
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDepartment(prev => ({
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
        await addDepartment(currentDepartment);
        toast.success('Department added successfully');
      } else if (modalMode === 'edit') {
        await updateDepartment(currentDepartment.id, currentDepartment);
        toast.success('Department updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error submitting department:', error);
      toast.error('Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (department) => {
    setDepartmentToDelete(department);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;
    
    try {
      await deleteDepartment(departmentToDelete.id);
      toast.success('Department deleted successfully');
      setDeleteModalOpen(false);
      setDepartmentToDelete(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  // Filter departments based on search query
  const filteredDepartments = departments.filter(department => {
    const query = searchQuery.toLowerCase();
    return (
      department.name.toLowerCase().includes(query) ||
      department.code.toLowerCase().includes(query) ||
      (department.description && department.description.toLowerCase().includes(query))
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);

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

      {/* Departments Table */}
      <main className="w-full mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Description
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((department, index) => (
              <tr key={department.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {indexOfFirstItem + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {department.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {department.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                  {department.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
          totalPages={Math.ceil(filteredDepartments.length / itemsPerPage)}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={filteredDepartments.length}
        />
      )}

      {/* Department Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        department={currentDepartment}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        loading={loading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete the department "${departmentToDelete?.name}"?`}
        confirmButtonText="Delete"
      />
    </div>
  );
};

export default DepartmentsContent;
