class PeerService {
    constructor() {
      if (!this.peer) {
        this.peer = new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:global.stun.twilio.com:3478",
              ],
            },
          ],
        });
      }
    }
  
    async getOffer() {
      if (this.peer) {
        try {
          const offer = await this.peer.createOffer();
          await this.peer.setLocalDescription(new RTCSessionDescription(offer));
          return offer;
        } catch (err) {
          console.error('Error creating offer:', err);
          throw err;
        }
      }
    }
  
    async getAnswer(offer) {
      if (this.peer) {
        try {
          if (this.peer.signalingState !== "stable") {
            console.log("Resetting peer connection");
            await this.peer.setLocalDescription({ type: "rollback" });
          }
          await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await this.peer.createAnswer();
          await this.peer.setLocalDescription(new RTCSessionDescription(answer));
          return answer;
        } catch (err) {
          console.error('Error creating answer:', err);
          throw err;
        }
      }
    }
  
    async setLocalDescription(ans) {
      if (this.peer) {
        try {
          if (this.peer.signalingState === "stable") {
            console.log("Connection already stable, skipping");
            return;
          }
          await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
        } catch (err) {
          console.error('Error setting remote description:', err);
          throw err;
        }
      }
    }
  }
  
  export default new PeerService();