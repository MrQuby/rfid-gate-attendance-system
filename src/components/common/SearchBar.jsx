import React from 'react';
import PropTypes from 'prop-types';

/**
 * A reusable search bar component
 */
const SearchBar = ({ 
  placeholder = 'Search...',
  value, 
  onChange, 
  className = '',
  inputClassName = ''
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <i className="fas fa-search absolute left-3 z-10 text-gray-400 pointer-events-none"></i>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-500 transition-colors ${inputClassName}`}
      />
    </div>
  );
};

SearchBar.propTypes = {
  /** Placeholder text for the search input */
  placeholder: PropTypes.string,
  /** Current search value */
  value: PropTypes.string.isRequired,
  /** Function to call when search value changes */
  onChange: PropTypes.func.isRequired,
  /** Additional className for the container */
  className: PropTypes.string,
  /** Additional className for the input */
  inputClassName: PropTypes.string
};

export default SearchBar;
