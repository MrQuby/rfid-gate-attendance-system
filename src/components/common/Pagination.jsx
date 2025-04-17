import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems 
}) => {
  const pageNumbers = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-transparent px-4 py-3 sm:px-6">
      <div className="text-sm text-gray-700 mb-4 sm:mb-0">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
            ${currentPage === 1
              ? 'bg-gray-50/50 text-gray-400 cursor-not-allowed'
              : 'bg-white/50 text-gray-700 hover:bg-gray-50/75'} 
            border border-gray-300`}
        >
          <i className="fas fa-chevron-left mr-1"></i>
          Previous
        </button>

        <div className="hidden sm:flex space-x-2">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white/50 text-sm font-medium text-gray-700 hover:bg-gray-50/75 rounded-md"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
            </>
          )}

          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md
                ${currentPage === number
                  ? 'z-10 bg-blue-600/90 text-white border-blue-600'
                  : 'bg-white/50 text-gray-700 hover:bg-gray-50/75 border-gray-300'}`}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white/50 text-sm font-medium text-gray-700 hover:bg-gray-50/75 rounded-md"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
            ${currentPage === totalPages
              ? 'bg-gray-50/50 text-gray-400 cursor-not-allowed'
              : 'bg-white/50 text-gray-700 hover:bg-gray-50/75'} 
            border border-gray-300`}
        >
          Next
          <i className="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired
};

export default Pagination;
