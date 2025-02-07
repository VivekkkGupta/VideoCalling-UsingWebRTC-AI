import React, { createContext, useState, useContext } from 'react';
import data from "../database/data.json";

const AppContext = createContext();

export function AppProvider({ children }) {
  // User information states
  const [userName, setUserName] = useState('');
  const [userInterest, setUserInterest] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Video call control states
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(false);
  const [chat, setChat] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  // User data state
  const [users, setUsers] = useState(data.users);

  const values = {
    // User information
    userName,
    setUserName,
    userInterest,
    setUserInterest,
    rememberMe,
    setRememberMe,
    
    // Video call controls
    mic,
    setMic,
    camera,
    setCamera,
    chat,
    setChat,
    speaker,
    setSpeaker,
    
    // User data
    users,
    setUsers,
  };

  return <AppContext.Provider value={values}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
