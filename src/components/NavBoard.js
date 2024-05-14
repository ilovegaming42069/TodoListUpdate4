import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage, db } from '../firebase/firebase-config';
import { doc, updateDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';

const NavBoard = ({ currentUser, setTheme, theme }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newProfilePic, setNewProfilePic] = useState(null);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleUsernameChange = async () => {
    try {
      // Update the user's display name in authentication
      await updateProfile(auth.currentUser, {
        displayName: newUsername,
      });

      // Update the username field in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        username: newUsername,
      });

      setNewUsername(''); // Clear input field after successful update
    } catch (error) {
      console.error('Error updating username:', error.message);
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    setNewProfilePic(file); // Store the selected file in state
  };

  const handleProfilePicUpload = async () => {
    if (!newProfilePic) return; // Ensure a file is selected
    const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
    try {
      await uploadBytes(storageRef, newProfilePic);
      const downloadURL = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL,
      });
      setNewProfilePic(null); // Clear the newProfilePic state after successful upload
    } catch (error) {
      console.error('Error updating profile picture:', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Cookies.remove('theme'); // Clear the theme cookie
      setTheme('light'); // Reset theme to default
      navigate('/login'); // Navigate to login page
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    Cookies.set('theme', newTheme); // Update the theme cookie
  };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, padding: '10px', zIndex: 1000 }}>
      <div onClick={toggleDropdown} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        {currentUser.photoURL ? (
          <img src={currentUser.photoURL} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }} />
        ) : (
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ccc', marginRight: '10px' }}></div>
        )}
        <span>{currentUser.displayName || 'No Name'}</span>
      </div>
      {dropdownOpen && (
        <div className="navboard-dropdown" style={{ position: 'absolute', right: 0, backgroundColor: theme === 'light' ? '#fff' : '#333', color: theme === 'light' ? '#000' : '#fff', boxShadow: '0px 0px 8px rgba(0,0,0,0.2)' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '10px', cursor: 'pointer' }}>
              <input
                type="text"
                placeholder="New Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <button onClick={handleUsernameChange}>Change Username</button>
            </li>
            <li style={{ padding: '10px', cursor: 'pointer' }}>
              <label htmlFor="profilePic">Change Profile Picture</label>
              <input type="file" id="profilePic" onChange={handleProfilePicChange} />
              <button onClick={handleProfilePicUpload}>Upload</button>
            </li>
            <li style={{ padding: '10px', cursor: 'pointer' }} onClick={toggleTheme}>
              Toggle Theme (Current: {theme === 'light' ? 'Light' : 'Dark'})
            </li>
            <li style={{ padding: '10px', cursor: 'pointer' }} onClick={handleLogout}>Logout</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default NavBoard;
