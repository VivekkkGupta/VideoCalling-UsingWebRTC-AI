import React from "react";
import {
  Camera,
  CameraIcon,
  CameraOffIcon,
  MessageCircleMore,
  MessageCircleOff,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeOff,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useNavigate } from 'react-router-dom';

function ActionButtons() {
  const {
    mic, setMic,
    camera, setCamera,
    chat, setChat,
    speaker, setSpeaker
  } = useAppContext();

  const navigate = useNavigate();

  const handleEndCall = () => {
    // Reset states
    setMic(false);
    setCamera(false);
    setChat(false);
    setSpeaker(false);
    navigate('/');
  };

  return (
    <div className="p-4 bg-white border-t flex justify-center gap-4">
      <button
        onClick={() => setMic(!mic)}
        className={`p-3 rounded-full ${mic ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span className="sr-only">Toggle Microphone</span>
        {mic ? (
          <MicOff className="text-gray-700" />
        ) : (
          <Mic className="text-gray-700" />
        )}
      </button>

      <button
        onClick={() => setCamera(!camera)}
        className={`p-3 rounded-full ${camera ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span className="sr-only">Toggle Camera</span>
        {camera ? (
          <CameraOffIcon className="text-gray-700" />
        ) : (
          <Camera className="text-gray-700" />
        )}
      </button>

      <button
        onClick={() => setChat(!chat)}
        className={`p-3 rounded-full ${chat ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span className="sr-only">Toggle Chat</span>
        {chat ? (
          <MessageCircleOff className="text-gray-700" />
        ) : (
          <MessageCircleMore className="text-gray-700" />
        )}
      </button>

      <button
        onClick={() => setSpeaker(!speaker)}
        className={`p-3 rounded-full ${speaker ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span className="sr-only">Toggle Speaker</span>
        {speaker ? (
          <VolumeOff className="text-gray-700" />
        ) : (
          <Volume2 className="text-gray-700" />
        )}
      </button>

      <button
        onClick={handleEndCall}
        className="p-3 rounded-full bg-red-500 text-white"
      >
        End Call
      </button>
    </div>
  );
}

export default ActionButtons;
