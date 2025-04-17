import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const SuccessModal = ({ isOpen, title, message, onContinue, autoCloseTime = 2 }) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseTime);

  useEffect(() => {
    let timer;
    if (isOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            onContinue();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, timeLeft, onContinue]);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(autoCloseTime);
    }
  }, [isOpen, autoCloseTime]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-25"></div>
      <div className="bg-white rounded-2xl p-6 relative z-10 transform transition-transform duration-300 scale-100 w-[320px] shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 mb-2">
            <div className="bg-[#00C853] rounded-full p-2.5">
              <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1.5">{title}</h2>
          <p className="text-gray-600 text-base mb-4">{message}</p>
          <button
            onClick={onContinue}
            className="w-full bg-[#00C853] text-white py-2.5 px-4 rounded-lg text-base font-semibold hover:bg-[#00B84D] transition-colors"
          >
            Continue ({timeLeft}s)
          </button>
        </div>
      </div>
    </div>
  );
};

SuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onContinue: PropTypes.func.isRequired,
  autoCloseTime: PropTypes.number,
};

export default SuccessModal;
