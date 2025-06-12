# SoulSeer - Psychic Reading Platform

SoulSeer is a premium platform connecting spiritual readers with clients seeking guidance. The app embodies a mystical yet professional atmosphere while providing robust functionality for seamless spiritual consultations.

## Features

- **Custom WebRTC System**: End-to-end encrypted real-time communication for chat, audio, and video readings
- **Pay-Per-Minute Billing**: Secure Stripe integration for per-minute billing with automatic balance management
- **Live Streaming**: Readers can host live streams with virtual gifting capabilities
- **Role-Based Access**: Separate interfaces for clients, readers, and administrators
- **Marketplace**: Shop for digital and physical spiritual products
- **Community Features**: Forums and messaging system for spiritual discussions

## Tech Stack

- **Frontend**: React (Vite), TailwindCSS, TypeScript
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon)
- **Real-time Communication**: Custom WebRTC implementation
- **Payment Processing**: Stripe Connect
- **Authentication**: JWT-based auth system
- **Hosting**: [Your hosting provider]

## Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL database (or Neon account)
- Stripe account with Connect enabled
- TURN server credentials (for WebRTC NAT traversal)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/soulseer-ascension-portal.git
   cd soulseer-ascension-portal
   ```

2. Install dependencies:
   ```
   npm install
   cd server && npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your database connection string, Stripe keys, and other required variables

4. Run database migrations:
   ```
   cd server
   npm run migrate
   ```

5. Start the development server:
   ```
   # In the root directory
   npm run dev
   
   # In a separate terminal, start the backend
   cd server
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

## WebRTC Architecture

SoulSeer implements a custom WebRTC solution for real-time communication:

1. **Signaling**: Custom signaling server using WebSockets for exchanging SDP offers/answers and ICE candidates
2. **Media Handling**: Direct peer-to-peer connections for audio/video streaming
3. **NAT Traversal**: STUN/TURN server integration for reliable connections across networks
4. **Data Channels**: Secure text chat alongside audio/video
5. **Connection Recovery**: Automatic reconnection handling for dropped connections

## Billing System

The pay-per-minute billing system works as follows:

1. Clients pre-fund their account balance via Stripe
2. During readings, a timer tracks session duration
3. Every minute, the client's balance is decremented based on the reader's rate
4. 70% of the payment goes to the reader, 30% to the platform
5. Readers can cash out their earnings via Stripe Connect

## Deployment

[Include deployment instructions specific to your hosting environment]

## License

[Your license information]

## Acknowledgments

- [List any libraries, resources, or people you want to acknowledge]