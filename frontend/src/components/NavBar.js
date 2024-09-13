// NavBar.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const NavBar = () => {
  const { user } = useAuth();

  return (
    <nav>
      {/* Other navbar items... */}
      {currentUser && <div>Hello, {user}!</div>}
    </nav>
  );
};

export default Navbar;
