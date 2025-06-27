import { io, Socket } from 'socket.io-client';

export interface SessionData {
  id: string;
  client_id: string;
  reader_id: string;
  type: 'chat' | 'audio' | 'video';
  rate_per_minute: number;
  status: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  total_cost?: number;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice_candidate';
  data: any;
}

export interface BillingUpdate {
  sessionId: string;
  minutesCharged: number;
  totalCost: number;
  clientBalance: number;
}

export class WebRTCClient {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private isInitiator: boolean = false;

  // Event callbacks
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onMessageCallback: ((message: any) => void) | null = null;
  private onBillingUpdateCallback: ((update: BillingUpdate) => void) | null = null;
  private onSessionEndedCallback: ((data: any) => void) | null = null;
  private onConnectionStateCallback: ((state: string) => void) | null = null;

  private readonly iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: `turn:${import.meta.env.VITE_TURN_SERVERS || 'relay1.expressturn.com:3480'}`,
      username: import.meta.env.VITE_TURN_USERNAME || '',
      credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
    },
  ];

  constructor() {
    this.initializeSocket();
  }

  private async initializeSocket() {
    if (!user) return;

    this.userId = user.id;
    this.socket = io(import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5000', {
      auth: {
        userId: user.id
      }
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Session management
    this.socket.on('session_request', this.handleSessionRequest.bind(this));
    this.socket.on('session_response', this.handleSessionResponse.bind(this));
    this.socket.on('session_started', this.handleSessionStarted.bind(this));
    this.socket.on('session_ended', this.handleSessionEnded.bind(this));

    // WebRTC signaling
    this.socket.on('webrtc_signal', this.handleWebRTCSignal.bind(this));

    // Billing updates
    this.socket.on('billing_update', this.handleBillingUpdate.bind(this));

    // Chat messages
    this.socket.on('new_message', this.handleNewMessage.bind(this));

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      if (this.userId) {
        this.socket?.emit('join_user_room', this.userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  // Request a reading session
  async requestSession(readerId: string, sessionType: 'chat' | 'audio' | 'video', ratePerMinute: number): Promise<SessionData> {
    try {
      const response = await fetch('/api/sessions/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readerId,
          sessionType,
          ratePerMinute
        })
      });

      if (!response.ok) {
        throw new Error('Failed to request session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting session:', error);
      throw error;
    }
  }

  // Respond to session request (for readers)
  async respondToSession(sessionId: string, response: 'accept' | 'reject'): Promise<void> {
    try {
      const apiResponse = await fetch('/api/sessions/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          response
        })
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to respond to session');
      }
    } catch (error) {
      console.error('Error responding to session:', error);
      throw error;
    }
  }

  // Start WebRTC session
  async startSession(sessionId: string, isInitiator: boolean = false): Promise<void> {
    this.sessionId = sessionId;
    this.isInitiator = isInitiator;

    try {
      // Join session room
      this.socket?.emit('join_session_room', sessionId);

      // Initialize peer connection
      await this.initializePeerConnection();

      // Get user media
      await this.initializeLocalStream();

      // If initiator, create offer
      if (isInitiator) {
        await this.createOffer();
      }

      // Notify server that session is starting
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  private async initializePeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket && this.sessionId) {
        this.socket.emit('webrtc_signal', {
          sessionId: this.sessionId,
          signal: {
            type: 'ice_candidate',
            data: event.candidate
          }
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStreamCallback?.(this.remoteStream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'unknown';
      this.onConnectionStateCallback?.(state);
      
      if (state === 'disconnected' || state === 'failed') {
        this.handleConnectionLoss();
      }
    };

    // Handle data channel
    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
  }

  private async initializeLocalStream(): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: this.sessionId ? true : false // Only video for video sessions
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      this.onLocalStreamCallback?.(this.localStream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      // Create data channel for chat
      this.dataChannel = this.peerConnection.createDataChannel('chat');
      this.setupDataChannel(this.dataChannel);

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer through socket
      this.socket?.emit('webrtc_signal', {
        sessionId: this.sessionId,
        signal: {
          type: 'offer',
          data: offer
        }
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  private async createAnswer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer through socket
      this.socket?.emit('webrtc_signal', {
        sessionId: this.sessionId,
        signal: {
          type: 'answer',
          data: answer
        }
      });
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log('Data channel opened');
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onMessageCallback?.(message);
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };

    channel.onclose = () => {
      console.log('Data channel closed');
    };
  }

  // Send chat message
  sendMessage(content: string, type: string = 'text'): void {
    if (!this.sessionId || !this.socket) return;

    const message = {
      sessionId: this.sessionId,
      content,
      type,
      timestamp: new Date().toISOString()
    };

    // Send via data channel if available
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    }

    // Also send via socket as backup
    this.socket.emit('session_message', message);
  }

  // Toggle media devices
  toggleAudio(): boolean {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  toggleVideo(): boolean {
    if (!this.localStream) return false;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  // End session
  async endSession(): Promise<void> {
    try {
      if (this.sessionId) {
        const response = await fetch('/api/sessions/end', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: this.sessionId })
        });

        if (!response.ok) {
          console.error('Failed to end session on server');
        }
      }

      this.cleanup();
    } catch (error) {
      console.error('Error ending session:', error);
      this.cleanup();
    }
  }

  private cleanup(): void {
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Leave session room
    if (this.socket && this.sessionId) {
      this.socket.emit('leave_session_room', this.sessionId);
    }

    this.sessionId = null;
    this.isInitiator = false;
  }

  // Event handlers
  private handleSessionRequest(data: any): void {
    // Handle incoming session request (for readers)
    console.log('Session request received:', data);
  }

  private handleSessionResponse(data: any): void {
    // Handle session response (for clients)
    console.log('Session response received:', data);
  }

  private handleSessionStarted(data: any): void {
    console.log('Session started:', data);
  }

  private handleSessionEnded(data: any): void {
    console.log('Session ended:', data);
    this.onSessionEndedCallback?.(data);
    this.cleanup();
  }

  private async handleWebRTCSignal(data: { sessionId: string; fromUserId: string; signal: WebRTCSignal }): Promise<void> {
    if (data.sessionId !== this.sessionId) return;

    try {
      switch (data.signal.type) {
        case 'offer':
          await this.createAnswer(data.signal.data);
          break;
        case 'answer':
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(data.signal.data);
          }
          break;
        case 'ice_candidate':
          if (this.peerConnection) {
            await this.peerConnection.addIceCandidate(data.signal.data);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebRTC signal:', error);
    }
  }

  private handleBillingUpdate(data: BillingUpdate): void {
    this.onBillingUpdateCallback?.(data);
  }

  private handleNewMessage(message: any): void {
    this.onMessageCallback?.(message);
  }

  private handleConnectionLoss(): void {
    console.log('Connection lost, attempting to reconnect...');
    // Implement reconnection logic if needed
  }

  // Event subscription methods
  onLocalStream(callback: (stream: MediaStream) => void): void {
    this.onLocalStreamCallback = callback;
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  onMessage(callback: (message: any) => void): void {
    this.onMessageCallback = callback;
  }

  onBillingUpdate(callback: (update: BillingUpdate) => void): void {
    this.onBillingUpdateCallback = callback;
  }

  onSessionEnded(callback: (data: any) => void): void {
    this.onSessionEndedCallback = callback;
  }

  onConnectionState(callback: (state: string) => void): void {
    this.onConnectionStateCallback = callback;
  }

  // Wallet management
  async addFunds(amount: number, paymentMethodId: string): Promise<void> {
    try {
      const response = await fetch('/api/payments/wallet-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentMethodId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add funds');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  }

  // Get session messages
  async getSessionMessages(sessionId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        headers: {
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get session messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session messages:', error);
      throw error;
    }
  }

  // Get session history
  async getSessionHistory(limit: number = 20, offset: number = 0): Promise<SessionData[]> {
    try {
      const response = await fetch(`/api/sessions/history?limit=${limit}&offset=${offset}`, {
        headers: {
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get session history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session history:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const webrtcClient = new WebRTCClient();