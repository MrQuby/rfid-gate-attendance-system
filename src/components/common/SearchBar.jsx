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
    <div className={`flex gap-2 ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pl-10 pr-4 py-2 border rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClassName}`}
        />
        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      </div>
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
