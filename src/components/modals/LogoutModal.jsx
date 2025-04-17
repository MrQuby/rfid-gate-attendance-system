import React from 'react';
import PropTypes from 'prop-types';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
      <div className="bg-white rounded-2xl p-6 relative z-10 w-[320px] shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 mb-4">
            <div className="bg-red-100 rounded-full p-2.5">
              <svg className="h-9 w-9 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Confirm Logout</h2>
          <p className="text-gray-600 text-base mb-6">Are you sure you want to logout?</p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg text-base font-semibold border border-gray-300 text-gray-700 hover:bg-gray-200 bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 text-white py-2.5 px-4 rounded-lg text-base font-semibold hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

LogoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default LogoutModal;
