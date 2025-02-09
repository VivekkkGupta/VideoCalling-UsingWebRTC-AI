import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../contexts/AppContext";
import ChatPanel from "../components/ChatPanel";
import ActionButtons from "../components/ActionButtons";
import { useSocket } from "../contexts/SocketContext";
import peer from "../contexts/Peer";
import VideoPlayer from "../components/VideoPlayer";

function VideoCall() {
  const socket = useSocket();
 
  const { userName, userInterest, chat,setUserName, setUserInterest } = useAppContext();
  const [firstUser, setFirstUser] = useState(false);
  const [streamsSent, setStreamsSent] = useState(false);

  const [negoCompleted, setNegoCompleted] = useState(false);
  const [negoCompletedUser2, setNegoCompletedUser2] = useState(false);


  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [remoteEmail, setRemoteEmail] = useState(null);
 
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, connected

  //Get user data from local storage
  useEffect(() => {
    if (localStorage.getItem("somegleUserData")) {
      const { userInterest, userName } = JSON.parse(
        localStorage.getItem("somegleUserData")
      )
      setUserName(userName);
      setUserInterest(userInterest);
    }
  }, []);

  //Stop stream utility function
  const stopStream = () => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
    }
  };

  //Initialize stream utility function
  const initializeStream = async () => {
    // console.log("Initializing stream on component mount");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      // console.log("Got initial stream:", stream);
      setMyStream(stream);
    } catch (err) {
      console.error("Initial media access error:", err);
      setError(err.message || "Failed to access camera/microphone");
    }
  };

  //Initialize stream on component mount
  useEffect(() => {
    initializeStream();
    return () => {
      stopStream();
    };
  }, []);

  const handleMyStream = useCallback(
    async ({ email, id }) => {
      if (!myStream) {
        // Only get new stream if we don't have one
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          setMyStream(stream);
        } catch (err) {
          setError(err.message || "Failed to access camera/microphone");
        }
      }
    },
    [myStream]
  );

  const handleUserJoined = useCallback(
    async ({ email, id }) => {
      try {
        setLoading(true);
        setError(null);

        setRemoteSocketId(id);
        setRemoteEmail(email);
        setFirstUser(true);

        await handleMyStream({ email, id });

        const offer = await peer.getOffer();

        await socket.emit("user:call", { to: id, fromEmail: userName, offer });

        setCallStatus("calling");
 
      } catch (err) {
        setError(err.message || "Failed to start call");
        console.error("Call error:", err);
      } finally {
        setLoading(false);
      }
    },
    [userName, socket]
  );

  const handleIncommingCall = useCallback(
    async ({ from, fromEmail, offer }) => {
      try {
        setLoading(true);
        setError(null);

        setRemoteSocketId(from);
        setRemoteEmail(fromEmail);
        setFirstUser(false);

        await handleMyStream({ email: fromEmail, id: from });

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
      console.log("sendStreams : ", myStream);
      await peer.addStream(myStream);
      // No need to emit any additional events - negotiationneeded will trigger automatically
    } catch (err) {
      setError(err.message || "Failed to send media streams");
      console.error("Send streams error:", err);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    async ({ from, ans }) => {
      try {
        await peer.setLocalDescription(ans);
        setCallStatus("connected");
        // Automatically send streams after connection is established
        await sendStreams();
      } catch (err) {
        setError(err.message || "Failed to establish connection");
        console.error("Call acceptance error:", err);
      }
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    // console.log("negotiationneeded event triggered");
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
    },[socket]
  );


  const handleNegoNeedFinal = useCallback(async ({ from, ans }) => {
    socket.emit("peer:nego:completedsendtracks", { to: from });
    await peer.setLocalDescription(ans);
    console.log("Final Negotiation done");
    setNegoCompleted(true);
  }, [socket]);

  const sendTracksToOtherUser = useCallback(async ({ from }) => {
    console.log("sendTracksToOtherUser : ", from);
    setNegoCompleted(true)
  }, [socket]);


  useEffect(() => {
    if (negoCompleted) { // Only send streams once

      // console.log("Sending streams after negotiation completion");
      sendStreams();
    }
  }, [negoCompleted, sendStreams]);
  

  const handleTrackEvent = useCallback((ev) => {
    const remoteStream = ev.streams[0];
    console.log("🎥 Received remote track:", ev.track.kind);
    setRemoteStream(remoteStream);
  }, []);

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
    socket.on("setmystream", handleMyStream);
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("peer:nego:completedsendtracks", sendTracksToOtherUser);

    return () => {
      socket.off("setmystream", handleMyStream);
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("peer:nego:completedsendtracks", sendTracksToOtherUser);
      stopStream();
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    sendTracksToOtherUser,
    handleMyStream,
  ]);

  // useEffect(() => {
  //   if (!peer.peer) {
  //     console.error("Peer connection not initialized");
  //     return;
  //   }
  //   if (
  //     remoteEmail &&
  //     remoteSocketId &&
  //     peer.peer.localDescription &&
  //     peer.peer.remoteDescription
  //   ) {
  //     console.log("remoteEmail : ", remoteEmail);
  //     console.log("remoteSocketId : ", remoteSocketId);
  //     console.log("localDescription : ", peer.peer.localDescription);
  //     console.log("remoteDescription : ", peer.peer.remoteDescription);
  //     console.log("--------------------------");
  //   }
  // }, [
  //   remoteEmail,
  //   remoteSocketId,
  //   peer.peer.localDescription,
  //   peer.peer.remoteDescription,
  //   myStream,
  //   firstUser,
  // ]);

  return (
    <div className="h-full w-full rounded-2xl flex flex-col bg-gray-900">
      {/* Status Bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">Connected as:</span>
          <span className="text-sm font-medium text-white">{userName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              remoteSocketId ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <span className="text-sm text-gray-300">
            {remoteSocketId ? "Connected" : "Waiting for connection"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Videos Container */}
        <div className={`flex-1 min-h-0 ${chat ? "lg:w-2/3" : "w-full"}`}>
          <div className="h-full p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[calc(100vh-10rem)]">
              {/* Local Video */}
              <div className="w-full h-full min-h-0">
                <VideoPlayer
                  stream={myStream}
                  userName={userName}
                  isLocal={true}
                />
                {error && (
                  <div className="text-red-500 text-sm mt-2">{error},</div>
                )}
              </div>

              {/* Remote Video */}
              <div className="w-full h-full min-h-0">
                <VideoPlayer
                  stream={remoteStream}
                  userName={remoteEmail || "Remote User"}
                  isLocal={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {chat && (
          <div className="lg:w-1/3 h-[40vh] lg:h-full border-t lg:border-l border-gray-700">
            <ChatPanel />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-3">
        <div className="flex justify-center">
          <ActionButtons />
        </div>
      </div>
    </div>
  );
}

export default VideoCall;
