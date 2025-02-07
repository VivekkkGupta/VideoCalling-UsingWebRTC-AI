import React from "react";
import { useAppContext } from "../contexts/AppContext";
import VideoView from "../components/VideoView";
import ChatPanel from "../components/ChatPanel";
import ActionButtons from "../components/ActionButtons";
import { useSocket } from "../contexts/Socket";
import { useEffect, useCallback } from "react";

function VideoCall() {
  const { userName, userInterest, chat } = useAppContext();
  const { socket } = useSocket();
  const { createOffer, createAnswer } = usePeer();

  const handleUserJoined = useCallback(
    async ({ emailId }) => {
      const offer = await createOffer();
      socket.emit("callUser", { emailId, offer });
      setRemoteEmailId(emailId);
    },
    [socket]
  );

  const handleInComingCall = useCallback(
    async ({ from, offer }) => {
      const answer = await createAnswer(offer);
      socket.emit("callAccepted", { emailId: from, answer });
      setRemoteEmailId(from);
    },
    [socket]
  );
  

  useEffect(() => {
    socket.on("userJoined", handleUserJoined);
    socket.on("inComingCall", handleInComingCall);
    return () => {
      socket.off("userJoined", handleUserJoined);
      socket.off("inComingCall", handleInComingCall);
    };

  }, [socket]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main content area */}
        <div
          className={`flex-1 min-h-0 transition-all duration-300 ease-in-out
          ${chat ? "lg:w-[70%] h-[60%] lg:h-full" : "w-full h-full"}`}
        >
          {/* Video grid */}
          <div className="h-full p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Local video */}
              <div className="bg-gray-800 rounded-lg w-full h-full flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="font-semibold">{userName}</p>
                  <p className="text-sm text-gray-400">You</p>
                </div>
              </div>

              {/* Remote video */}
              <div className="bg-gray-800 rounded-lg w-full h-full flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="font-semibold">Waiting...</p>
                  <p className="text-sm text-gray-400">
                    Looking for someone with similar interests
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat panel */}
        {chat && (
          <div
            className={`transition-all duration-300 ease-in-out
            ${chat ? "h-[40%] lg:h-full lg:w-[30%]" : "h-0 lg:w-0"} 
            border-t lg:border-l border-gray-200 bg-white`}
          >
            <ChatPanel />
          </div>
        )}
      </div>

      {/* Bottom info and controls */}
      <div className="mt-auto">
        {/* User info display */}
        <div className="px-4 py-2 bg-gray-100">
          <p className="text-sm text-gray-600">
            Connected as: <span className="font-semibold">{userName}</span>
          </p>
          <p className="text-sm text-gray-600">
            Interest: <span className="font-semibold">{userInterest}</span>
          </p>
        </div>

        {/* Action buttons */}
        <ActionButtons />
      </div>
    </div>
  );
}

export default VideoCall;
