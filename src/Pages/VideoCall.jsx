import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../contexts/AppContext";
import ChatPanel from "../components/ChatPanel";
import ActionButtons from "../components/ActionButtons";
import { useSocket } from "../contexts/SocketContext";
import peer from "../contexts/Peer";
import ReactPlayer from "react-player";

function VideoCall() {
  const [firstUser, setFirstUser] = useState(false);
  const { userName, userInterest, chat } = useAppContext();
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [remoteEmail, setRemoteEmail] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, connected

  const handleUserJoined = useCallback(async ({ email, id }) => {
    try {
      setLoading(true);
      setError(null);

      setRemoteSocketId(id);
      setRemoteEmail(email);
      setFirstUser(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const offer = await peer.getOffer();

      await socket.emit("user:call", { to: id, fromEmail: userName, offer });

      setMyStream(stream);

      setCallStatus("calling");
    } catch (err) {
      setError(err.message || "Failed to start call");
      console.error("Call error:", err);
    } finally {
      setLoading(false);
    }
  }, [userName, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, fromEmail, offer }) => {
      try {
        setLoading(true);
        setError(null);

        setRemoteSocketId(from);
        setRemoteEmail(fromEmail);
        setFirstUser(false);

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setMyStream(stream);

        const ans = await peer.getAnswer(offer);

        socket.emit("call:accepted", { to: from, ans });
        setCallStatus("connected");
      } catch (err) {
        setError(err.message || "Failed to accept call");
        console.error("Incoming call error:", err);
      } finally {
        setLoading(false);
      }
    },
    [socket]
  );

  const sendStreams = useCallback(async () => {
    if (!myStream) {
      setError("No local stream available");
      return;
    }
    if (!peer.peer) {
      console.error("Peer connection not initialized");
      return;
    }
    try {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    } catch (err) {
      setError(err.message || "Failed to send media streams");
      console.error("Send streams error:", err);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(async ({ from, ans }) => {
    try {
      await peer.setLocalDescription(ans);
      
      setCallStatus("connected");

      // if (!firstUser) {
      //   console.log("Second user - automatically sending streams");
      //   await sendStreams();
      // }
    } catch (err) {
      setError(err.message || "Failed to establish connection");
      console.error("Call acceptance error:", err);
    }
  }, [sendStreams, firstUser]);

  const handleNegoNeeded = useCallback(async () => {
    console.log("negotiationneeded event triggered");
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    if (!peer.peer) {
      console.error("Peer connection not initialized");
      return;
    }
    const peerInstance = peer.peer;
    peerInstance.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peerInstance.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ from, ans }) => {
    await peer.setLocalDescription(ans);
    console.log("Final Negotiation done");
    socket.emit("peer:nego:completed", { to: from });
  }, []);

  const handleTrackEvent = useCallback((ev) => {
    const remoteStream = ev.streams[0];
    console.log("🎥 Received remote track:", ev.track.kind);
    setRemoteStream(remoteStream);
  }, []);

  const sendTracksToOtherUser = useCallback(() => {
    sendStreams();
  }, [sendStreams]);


  useEffect(() => {
    if (!peer.peer) {
      console.error("Peer connection not initialized");
      return;
    }
    const peerInstance = peer.peer;
    peerInstance.addEventListener("track", handleTrackEvent);
    return () => {
      peerInstance.removeEventListener("track", handleTrackEvent);
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };

  }, [handleTrackEvent]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("peer:nego:completedsendtracks", sendTracksToOtherUser);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("peer:nego:completedsendtracks", sendTracksToOtherUser);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    sendTracksToOtherUser,
  ]);

  useEffect(() => {
    if (!peer.peer) {
      console.error("Peer connection not initialized");
      return;
    }
    if (
      remoteEmail &&
      remoteSocketId &&
      peer.peer.localDescription &&
      peer.peer.remoteDescription
    ) {
      console.log("remoteEmail : ", remoteEmail);
      console.log("remoteSocketId : ", remoteSocketId);
      console.log("localDescription : ", peer.peer.localDescription);
      console.log("remoteDescription : ", peer.peer.remoteDescription);
      console.log("--------------------------");
      if (myStream) {
        sendStreams();
      }
    }
  }, [
    remoteEmail,
    remoteSocketId,
    peer.peer.localDescription,
    peer.peer.remoteDescription,
    myStream,
    firstUser,
  ]);


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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-14rem)]">
              {/* Local video */}
              <div className="relative bg-gray-800 rounded-xl w-full aspect-video shadow-lg overflow-hidden">
                {myStream ? (
                  <>
                    <div className="absolute inset-0">
                      <video ref={(video) => video && (video.srcObject = myStream)} 
                      autoPlay muted 
                      className="w-full h-full object-cover" />


                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full">
                      <p className="text-white text-sm font-medium">
                        {userName} (You)
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-white font-medium">
                        Camera will be enabled Once Someone Joins
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        waiting for someone to join...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Remote video */}
              <div className="relative bg-gray-800 rounded-xl w-full aspect-video shadow-lg overflow-hidden">
                {remoteStream ? (
                  <>
                    <div className="absolute inset-0">
                      <video ref={(video) => video && (video.srcObject = remoteStream)}
                        autoPlay muted
                        className="w-full h-full object-cover" />


                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full">
                      <p className="text-white text-sm font-medium">
                        Remote User
                      </p>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-500 text-sm font-medium">
                          Connected
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                    <div className="text-center px-4">
                      {error ? (
                        <div className="text-red-500 mb-4">
                          <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-red-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <p className="font-semibold">{error}</p>
                          <button
                            onClick={() => {
                              setError(null);
                              setLoading(false);
                              setCallStatus("idle");
                            }}
                            className="mt-2 text-sm underline hover:text-red-400"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : loading ? (
                        <div className="animate-pulse">
                          <div className="w-16 h-16 bg-indigo-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-indigo-500 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </div>
                          <p className="text-white font-medium">
                            Connecting...
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Please wait
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="animate-pulse mb-3">
                            <div className="w-16 h-16 bg-gray-700/50 rounded-full mx-auto flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                                />
                              </svg>
                            </div>
                          </div>
                          <p className="font-semibold text-white">
                            {callStatus === "calling"
                              ? "Calling..."
                              : "Waiting for connection..."}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Looking for someone with similar interests
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
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
        <div className="px-4 py-2 bg-gray-100/90 backdrop-blur-sm">
          <p className="text-sm text-gray-600">
            Connected as: <span className="font-semibold">{userName}</span>
          </p>
          <p className="text-sm text-gray-600">
            Interest: <span className="font-semibold">{userInterest}</span>
          </p>
          <p className="text-sm text-gray-600">
            <button
              onClick={sendStreams}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Send Streams
            </button>
          </p>
        </div>

        {/* Action buttons */}
        <ActionButtons />
      </div>
    </div>
  );
}

export default VideoCall;
