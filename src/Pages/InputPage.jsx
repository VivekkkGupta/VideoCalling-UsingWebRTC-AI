import React, { useEffect, useCallback } from "react";
import { useAppContext } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";

function InputPage() {
  const {
    userName,
    setUserName,
    userInterest,
    setUserInterest,
    rememberMe,
    setRememberMe
  } = useAppContext();

  const socket = useSocket();
  const navigate = useNavigate();

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('somegleUserData');
    if (savedData) {
      const { userName: savedName, userInterest: savedInterest, rememberMe: savedRemember } = JSON.parse(savedData);
      setUserName(savedName || '');
      setUserInterest(savedInterest || '');
      setRememberMe(savedRemember || false);
    }
  }, []);


  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (userName && userInterest) {
      // Save to localStorage if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem('somegleUserData', JSON.stringify({
          userName,
          userInterest,
          rememberMe
        }));
      } else {
        // Clear localStorage if rememberMe is unchecked
        localStorage.removeItem('somegleUserData');
      }
      
      // Emit socket event and continue with room join
      socket.emit("room:join", { email: userName, room: userInterest });
    }
  }, [socket, userName, userInterest, rememberMe]);


  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="w-full max-w-md mx-auto px-6 py-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-relaxed">
          Welcome To SOmegle
        </h1>
        <p className="text-gray-600 mt-2">Connect with like-minded people</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter Your Name"
            required
          />
        </div>
        
        <div>
          <label
            htmlFor="interest"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Interest
          </label>
          <input
            type="text"
            id="interest"
            value={userInterest}
            onChange={(e) => setUserInterest(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter Your Interest"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label
            htmlFor="remember"
            className="ml-2 text-sm text-gray-600"
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg"
        >
          Get Started
        </button>
      </form>
    </div>
  );
}

export default InputPage;
