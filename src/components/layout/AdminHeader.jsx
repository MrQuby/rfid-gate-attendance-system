import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const AdminHeader = ({ title }) => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = React.useState(null);
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    let unsubscribe = () => {};
    if (user) {
      // Set up real-time listener for user data
      const userRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }, (error) => {
        console.error('Error listening to user data:', error);
      });
    }
    
    // Clean up the listener when component unmounts or user changes
    return () => unsubscribe();
  }, [user]);

  // Use userData directly if available
  const displayName = userData ? `${userData.firstName} ${userData.lastName}` : '';
  const userRole = userData?.role || 'Admin';
  const avatarInitial = displayName.charAt(0) || (userData?.email?.charAt(0) || '');

  return (
    <header className="flex items-center justify-between p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="text-gray-600 hover:text-blue-600 focus:outline-none">
            <i className="fas fa-bell text-xl"></i>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-xs text-gray-500">{userRole}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
            {avatarInitial}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
