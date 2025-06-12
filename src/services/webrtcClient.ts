import { supabase } from '@/lib/supabase';

// Define types
export type WebRTCSignal = {
  type: string;
  data: any;
};

export type WebRTCSession = {
  sessionId: string;
  readerId: string;
  clientId: string;
  status: 'pending' | 'connecting' | 'active' | 'completed';
  rate: number;
};

export type ICEServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

class WebRTCClient {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private iceServers: ICEServer[] = [];
  private sessionId: string | null = null;
  private userId: string | null = null;
  private peerId: string | null = null;
  private isReader: boolean = false;
  private pollingInterval: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  // Event callbacks
  private onTrackCallbacks: ((stream: MediaStream) => void)[] = [];
  private onDataChannelMessageCallbacks: ((message: any) => void)[] = [];
  private onConnectionStateChangeCallbacks: ((state: RTCPeerConnectionState) => void)[] = [];
  private onIceCandidateCallbacks: ((candidate: RTCIceCandidate | null) => void)[] = [];
  private onDisconnectCallbacks: (() => void)[] = [];
  
  constructor() {
    this.initializeIceServers();
  }
  
  // Initialize ICE servers from environment or fetch from server
  private async initializeIceServers() {
    try {
      // Try to get ICE servers from environment
      const envIceServers = process.env.WEBRTC_ICE_SERVERS;
      if (envIceServers) {
        this.iceServers = JSON.parse(envIceServers);
      } else {
        // Fetch from server
        const response = await fetch('/api/webrtc/ice-servers');
        const data = await response.json();
        this.iceServers = data.iceServers;
      }
    } catch (error) {
      console.error('Error initializing ICE servers:', error);
      // Fallback to default STUN servers
      this.iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];
    }
  }
  
  // Initialize a WebRTC session
  public async initialize(
    sessionId: string,
    userId: string,
    peerId: string,
    isReader: boolean
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.peerId = peerId;
    this.isReader = isReader;
    
    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });
    
    // Set up remote stream
    this.remoteStream = new MediaStream();
    
    // Set up event handlers
    this.setupPeerConnectionEvents();
    
    // Start polling for signals
    this.startSignalPolling();
    
    return this;
  }
  
  // Set up peer connection event handlers
  private setupPeerConnectionEvents() {
    if (!this.peerConnection) return;
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'candidate',
          data: event.candidate
        });
        
        this.onIceCandidateCallbacks.forEach(callback => callback(event.candidate));
      }
    };
    
    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      
      this.onConnectionStateChangeCallbacks.forEach(callback => {
        if (state) callback(state);
      });
      
      if (state === 'disconnected' || state === 'failed') {
        this.handleDisconnection();
      } else if (state === 'connected') {
        // Reset reconnect attempts when connected
        this.reconnectAttempts = 0;
      }
    };
    
    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream?.addTrack(track);
      });
      
      if (this.remoteStream) {
        this.onTrackCallbacks.forEach(callback => callback(this.remoteStream!));
      }
    };
    
    // Handle data channel
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };
  }
  
  // Set up data channel event handlers
  private setupDataChannel() {
    if (!this.dataChannel) return;
    
    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onDataChannelMessageCallbacks.forEach(callback => callback(message));
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };
    
    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
    };
    
    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }
  
  // Start polling for WebRTC signals
  private startSignalPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = window.setInterval(async () => {
      try {
        await this.pollSignals();
      } catch (error) {
        console.error('Error polling signals:', error);
      }
    }, 1000);
  }
  
  // Poll for pending signals
  private async pollSignals() {
    if (!this.sessionId || !this.userId) return;
    
    try {
      const response = await fetch(`/api/webrtc/signals/${this.sessionId}`);
      const data = await response.json();
      
      if (data.signals && data.signals.length > 0) {
        for (const signal of data.signals) {
          await this.handleSignal(signal);
        }
      }
    } catch (error) {
      console.error('Error polling signals:', error);
    }
  }
  
  // Handle incoming signal
  private async handleSignal(signal: { type: string; data: any }) {
    if (!this.peerConnection) return;
    
    try {
      const { type, data } = signal;
      
      switch (type) {
        case 'offer':
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          await this.sendSignal({
            type: 'answer',
            data: answer
          });
          break;
          
        case 'answer':
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
          break;
          
        case 'candidate':
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }
  
  // Send WebRTC signal to peer
  private async sendSignal(signal: WebRTCSignal) {
    if (!this.sessionId || !this.peerId) return;
    
    try {
      await fetch('/api/webrtc/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          toUserId: this.peerId,
          signal
        }),
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  }
  
  // Initialize local media stream
  public async initializeLocalStream(constraints: MediaStreamConstraints = { audio: true, video: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Add tracks to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }
      
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }
  
  // Create an offer as initiator
  public async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    try {
      // Create data channel for chat
      this.dataChannel = this.peerConnection.createDataChannel('soulseer-chat');
      this.setupDataChannel();
      
      // Create offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      // Send offer to peer
      await this.sendSignal({
        type: 'offer',
        data: offer
      });
      
      // Update session status
      await this.updateSessionStatus('connecting', {
        clientSdp: this.isReader ? undefined : JSON.stringify(offer),
        readerSdp: this.isReader ? JSON.stringify(offer) : undefined
      });
      
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }
  
  // Update session status
  private async updateSessionStatus(status: string, additionalData: any = {}) {
    if (!this.sessionId) return;
    
    try {
      await fetch(`/api/webrtc/sessions/${this.sessionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          ...additionalData
        }),
      });
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  }
  
  // Handle disconnection
  private handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Try to reconnect after a delay
      setTimeout(() => {
        this.restartIce();
      }, 1000 * this.reconnectAttempts);
    } else {
      console.log('Max reconnect attempts reached, ending call');
      this.onDisconnectCallbacks.forEach(callback => callback());
    }
  }
  
  // Restart ICE connection
  private async restartIce() {
    if (!this.peerConnection) return;
    
    try {
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      await this.sendSignal({
        type: 'offer',
        data: offer
      });
    } catch (error) {
      console.error('Error restarting ICE:', error);
      this.onDisconnectCallbacks.forEach(callback => callback());
    }
  }
  
  // Send data through data channel
  public sendData(message: any) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Data channel not ready');
      return false;
    }
    
    try {
      this.dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending data:', error);
      return false;
    }
  }
  
  // Clean up resources
  public cleanup() {
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Clear remote stream
    this.remoteStream = null;
    
    // Reset state
    this.sessionId = null;
    this.userId = null;
    this.peerId = null;
    this.reconnectAttempts = 0;
  }
  
  // Event registration methods
  public onTrack(callback: (stream: MediaStream) => void) {
    this.onTrackCallbacks.push(callback);
    // If we already have a remote stream, call the callback immediately
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
  }
  
  public onDataChannelMessage(callback: (message: any) => void) {
    this.onDataChannelMessageCallbacks.push(callback);
  }
  
  public onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallbacks.push(callback);
    // If we already have a connection state, call the callback immediately
    if (this.peerConnection) {
      callback(this.peerConnection.connectionState);
    }
  }
  
  public onIceCandidate(callback: (candidate: RTCIceCandidate | null) => void) {
    this.onIceCandidateCallbacks.push(callback);
  }
  
  public onDisconnect(callback: () => void) {
    this.onDisconnectCallbacks.push(callback);
  }
  
  // Getters
  public getLocalStream() {
    return this.localStream;
  }
  
  public getRemoteStream() {
    return this.remoteStream;
  }
  
  public getConnectionState() {
    return this.peerConnection?.connectionState || 'closed';
  }
  
  public getIceConnectionState() {
    return this.peerConnection?.iceConnectionState || 'closed';
  }
  
  public getSignalingState() {
    return this.peerConnection?.signalingState || 'closed';
  }
}

// Create singleton instance
export const webrtcClient = new WebRTCClient();

export default webrtcClient;