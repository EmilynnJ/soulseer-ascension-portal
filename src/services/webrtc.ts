import { supabase } from '@/lib/supabase';

type RTCSession = {
  peerConnection: RTCPeerConnection;
  localStream: MediaStream | null;
  remoteStream: MediaStream;
  dataChannel: RTCDataChannel | null;
};

export class WebRTCService {
  private static instance: WebRTCService;
  private session: RTCSession | null = null;
  private onTrackCallbacks: ((stream: MediaStream) => void)[] = [];
  private onDataChannelMessageCallbacks: ((message: any) => void)[] = [];
  private onDisconnectCallbacks: (() => void)[] = [];
  private readonly iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:relay1.expressturn.com:3480',
        username: process.env.TURN_USERNAME || '',
        credential: process.env.TURN_CREDENTIAL || '',
      },
    ],
  };

  private constructor() {}

  public static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService();
    }
    return WebRTCService.instance;
  }

  public async initializeLocalStream(constraints: MediaStreamConstraints = { audio: true, video: true }) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.session) {
        this.session.localStream = stream;
      } else {
        this.session = {
          peerConnection: new RTCPeerConnection(this.iceServers),
          localStream: stream,
          remoteStream: new MediaStream(),
          dataChannel: null,
        };
        this.setupPeerConnection();
      }
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  private setupPeerConnection() {
    if (!this.session) return;

    const { peerConnection, localStream } = this.session;

    // Add local stream tracks to peer connection
    localStream?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.session?.remoteStream.addTrack(track);
      });
      this.onTrackCallbacks.forEach((callback) => callback(this.session!.remoteStream));
    };

    // Handle data channel
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setupDataChannel(dataChannel);
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        this.cleanup();
        this.onDisconnectCallbacks.forEach(callback => callback());
      }
    };
  }

  private setupDataChannel(dataChannel: RTCDataChannel) {
    if (!this.session) return;
    
    this.session.dataChannel = dataChannel;
    
    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onDataChannelMessageCallbacks.forEach(callback => callback(message));
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.cleanup();
    };
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    try {
      // Create data channel for chat and control messages
      const dataChannel = this.session.peerConnection.createDataChannel('soulseer');
      this.setupDataChannel(dataChannel);

      const offer = await this.session.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await this.session.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  public async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    try {
      await this.session.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.session.peerConnection.createAnswer();
      await this.session.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  public async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }
    await this.session.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }

  public addIceCandidate(candidate: RTCIceCandidateInit): void {
    if (!this.session) {
      throw new Error('Session not initialized');
    }
    this.session.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  public onTrack(callback: (stream: MediaStream) => void): void {
    this.onTrackCallbacks.push(callback);
  }

  public onDataChannelMessage(callback: (message: any) => void): void {
    this.onDataChannelMessageCallbacks.push(callback);
  }

  public onDisconnect(callback: () => void): void {
    this.onDisconnectCallbacks.push(callback);
  }

  public sendData(message: any): void {
    if (!this.session?.dataChannel || this.session.dataChannel.readyState !== 'open') {
      console.error('Data channel not ready');
      return;
    }
    this.session.dataChannel.send(JSON.stringify(message));
  }

  public cleanup(): void {
    if (this.session) {
      this.session.peerConnection.close();
      this.session.localStream?.getTracks().forEach(track => track.stop());
      this.session.remoteStream.getTracks().forEach(track => track.stop());
      this.session = null;
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.session?.localStream || null;
  }

  public getRemoteStream(): MediaStream | null {
    return this.session?.remoteStream || null;
  }

  public isConnected(): boolean {
    return this.session?.peerConnection.connectionState === 'connected';
  }
}

export const webrtcService = WebRTCService.getInstance();
