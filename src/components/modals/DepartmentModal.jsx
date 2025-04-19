import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const DepartmentModal = ({ 
  isOpen, 
  onClose, 
  mode, 
  department, 
  onSubmit, 
  onChange,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 max-w-lg w-full mx-2">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-blue-900">
              {mode === 'add' ? 'Add New Department' : 
               mode === 'edit' ? 'Edit Department' : 'Department Details'}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {mode === 'add' ? 'Create a new department in the system' : 
               mode === 'edit' ? 'Modify existing department details' : 'View department information'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <i className="fas fa-times text-gray-500 text-xl"></i>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="py-4 space-y-4">
          {/* Department Name Field */}
          <div className="grid grid-cols-1 gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Department Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-building text-gray-400"></i>
              </div>
              <input
                type="text"
                name="name"
                value={department.name || ''}
                onChange={onChange}
                disabled={mode === 'view' || loading}
                placeholder="Enter department name"
                className={`pl-10 w-full rounded-lg border ${
                  mode === 'view' 
                    ? 'bg-gray-50 text-gray-500' 
                    : 'bg-white hover:border-gray-400 focus:border-blue-500'
                } border-gray-300 shadow-sm p-2.5 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                required
              />
            </div>
          </div>

          {/* Department Code Field */}
          <div className="grid grid-cols-1 gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Department Code
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-code text-gray-400"></i>
              </div>
              <input
                type="text"
                name="code"
                value={department.code || ''}
                onChange={onChange}
                disabled={mode === 'view' || loading}
                placeholder="Enter department code"
                className={`pl-10 w-full rounded-lg border ${
                  mode === 'view' 
                    ? 'bg-gray-50 text-gray-500' 
                    : 'bg-white hover:border-gray-400 focus:border-blue-500'
                } border-gray-300 shadow-sm p-2.5 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                required
              />
            </div>
          </div>

          {/* Description Field */}
          <div className="grid grid-cols-1 gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                <i className="fas fa-align-left text-gray-400"></i>
              </div>
              <textarea
                name="description"
                value={department.description || ''}
                onChange={onChange}
                disabled={mode === 'view' || loading}
                placeholder="Enter department description"
                rows="3"
                className={`pl-10 w-full rounded-lg border ${
                  mode === 'view' 
                    ? 'bg-gray-50 text-gray-500' 
                    : 'bg-white hover:border-gray-400 focus:border-blue-500'
                } border-gray-300 shadow-sm p-2.5 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 
                hover:bg-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg 
                  shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                  transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

DepartmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['add', 'edit', 'view']).isRequired,
  department: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default DepartmentModal;
