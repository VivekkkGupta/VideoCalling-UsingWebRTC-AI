import {
    createContext,
    useContext,
    useMemo,
    useEffect,
    useState,
    useCallback,
  } from "react";
  
  export const PeerContext = createContext();
  
  export const usePeer = () => {
    return useContext(PeerContext);
  };
  
  export const PeerProvider = ({ children }) => {
    const [remoteStream, setRemoteStream] = useState(null);
    const peer = useMemo(
      () =>
        new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
              ],
            },
          ],
        }),
      []
    );
  
    const createOffer = async () => {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      return offer;
    };
  
    const createAnswer = async (offer) => {
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer(offer);
      await peer.setLocalDescription(answer);
      return answer;
    };
  
    const setRemoteAnswer = async (answer) => {
      await peer.setRemoteDescription(answer);
    };
  
    const sendStream = (stream) => {
      if (!stream) return;
      
      const senders = peer.getSenders();
      const tracks = stream.getTracks();
      
      for (const track of tracks) {
        // Check if a sender already exists for this track
        const senderExists = senders.some(sender => sender.track === track);
        if (!senderExists) {
          peer.addTrack(track, stream);
        }
      }
    };
    
  
    const handleRemoteStream = useCallback((event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    }, []);
    
  
    useEffect(() => {
      peer.addEventListener("track", handleRemoteStream);
  
      return () => {
        peer.removeEventListener("track", handleRemoteStream);
  
      };
    }, [handleRemoteStream, peer]);
  
    return (
      <PeerContext.Provider
        value={{
          peer,
          createOffer,
          createAnswer,
          setRemoteAnswer,
          sendStream,
          remoteStream,
        }}
      >
        {children}
      </PeerContext.Provider>
    );
  };
  