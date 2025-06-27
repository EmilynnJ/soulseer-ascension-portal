import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Neon database configuration
const neonConfig = {
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

// Create  client
  process.env._URL,
  process.env._ANON_KEY
);

// Create Neon pool for direct SQL operations
export const neonPool = new Pool(neonConfig);

// Test database connection
export const testNeonConnection = async () => {
  try {
    const client = await neonPool.connect();
    console.log('Successfully connected to Neon database');
    client.release();
  } catch (error) {
    console.error('Error connecting to Neon database:', error);
    throw error;
  }
};

// Initialize enhanced database schema for SoulSeer
export const initSoulSeerDatabase = async () => {
  const client = await neonPool.connect();
  try {
    await client.query('BEGIN');
    
    // Create enhanced profiles table with roles and psychic-specific fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        display_name VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        profile_image TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'client',
        bio TEXT,
        specialties TEXT[],
        languages TEXT[] DEFAULT ARRAY['English'],
        timezone VARCHAR(50),
        phone VARCHAR(20),
        date_of_birth DATE,
        
        -- Reader-specific fields
        chat_rate INTEGER, -- cents per minute
        audio_rate INTEGER, -- cents per minute
        video_rate INTEGER, -- cents per minute
        is_available BOOLEAN DEFAULT FALSE,
        rating_avg DECIMAL(3,2) DEFAULT 0.0,
        total_reviews INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0,
        experience_years INTEGER,
        verification_status VARCHAR(20) DEFAULT 'pending',
        
        -- Client-specific fields
        balance DECIMAL(10,2) DEFAULT 0.00,
        
        -- Status fields
        status VARCHAR(20) DEFAULT 'offline', -- online, offline, busy
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_role CHECK (role IN ('client', 'reader', 'admin')),
        CONSTRAINT valid_status CHECK (status IN ('online', 'offline', 'busy')),
        CONSTRAINT valid_verification CHECK (verification_status IN ('pending', 'verified', 'rejected'))
      )
    `);

    // Create reading sessions table with enhanced fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        reader_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        session_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        rate_per_minute INTEGER NOT NULL,
        
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER DEFAULT 0,
        total_cost DECIMAL(10,2) DEFAULT 0.00,
        
        -- Session management
        room_id VARCHAR(255),
        connection_established BOOLEAN DEFAULT FALSE,
        last_heartbeat TIMESTAMP WITH TIME ZONE,
        
        -- Review and rating
        client_rating INTEGER,
        reader_rating INTEGER,
        client_review TEXT,
        reader_review TEXT,
        
        -- Notes and transcripts
        session_notes TEXT,
        chat_transcript JSONB,
        
        -- Metadata
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_session_type CHECK (session_type IN ('chat', 'audio', 'video')),
        CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
        CONSTRAINT valid_rating CHECK (client_rating BETWEEN 1 AND 5 AND reader_rating BETWEEN 1 AND 5)
      )
    `);

    // Create billing_transactions table for Stripe integration
    await client.query(`
      CREATE TABLE IF NOT EXISTS billing_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        transaction_type VARCHAR(30) NOT NULL,
        status VARCHAR(20) NOT NULL,
        
        -- Stripe fields
        stripe_payment_intent_id VARCHAR(255),
        stripe_charge_id VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        
        -- Billing details
        billing_interval_start TIMESTAMP WITH TIME ZONE,
        billing_interval_end TIMESTAMP WITH TIME ZONE,
        minutes_billed INTEGER,
        
        -- Metadata
        description TEXT,
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('session_payment', 'wallet_deposit', 'wallet_withdrawal', 'refund', 'gift_purchase', 'product_purchase')),
        CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'))
      )
    `);

    // Create live_streams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_streams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reader_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        viewer_count INTEGER DEFAULT 0,
        max_viewers INTEGER DEFAULT 0,
        
        -- Stream settings
        is_premium BOOLEAN DEFAULT FALSE,
        entry_price DECIMAL(10,2) DEFAULT 0.00,
        allow_gifts BOOLEAN DEFAULT TRUE,
        
        -- Scheduling
        scheduled_start TIMESTAMP WITH TIME ZONE,
        actual_start TIMESTAMP WITH TIME ZONE,
        actual_end TIMESTAMP WITH TIME ZONE,
        
        -- Stream data
        stream_key VARCHAR(255),
        room_id VARCHAR(255),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_stream_status CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled'))
      )
    `);

    // Create virtual_gifts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS virtual_gifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT,
        price DECIMAL(10,2) NOT NULL,
        animation_url TEXT,
        rarity VARCHAR(20) DEFAULT 'common',
        
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
      )
    `);

    // Create gift_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gift_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        gift_id UUID REFERENCES virtual_gifts(id) ON DELETE CASCADE,
        stream_id UUID REFERENCES live_streams(id) ON DELETE SET NULL,
        
        quantity INTEGER DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        message TEXT,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table for marketplace
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(50),
        type VARCHAR(20) NOT NULL,
        
        -- Product content
        image_url TEXT,
        digital_content_url TEXT,
        downloadable BOOLEAN DEFAULT FALSE,
        
        -- Inventory
        stock_quantity INTEGER,
        unlimited_stock BOOLEAN DEFAULT TRUE,
        
        -- Status
        is_active BOOLEAN DEFAULT TRUE,
        featured BOOLEAN DEFAULT FALSE,
        
        -- Metadata
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_product_type CHECK (type IN ('digital', 'physical', 'service'))
      )
    `);

    // Create messages table for chat system
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        
        -- Media attachments
        attachment_url TEXT,
        attachment_type VARCHAR(50),
        
        -- Status
        read_at TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        
        -- Metadata
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'file', 'system', 'gift_notification'))
      )
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        
        -- Reference information
        reference_type VARCHAR(50),
        reference_id UUID,
        
        -- Status
        read_at TIMESTAMP WITH TIME ZONE,
        action_url TEXT,
        
        -- Metadata
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_notification_type CHECK (type IN ('session_request', 'session_accepted', 'session_completed', 'payment_received', 'stream_starting', 'gift_received', 'system'))
      )
    `);

    // Create WebRTC signaling table
    await client.query(`
      CREATE TABLE IF NOT EXISTS webrtc_signals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE,
        from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        
        signal_type VARCHAR(50) NOT NULL,
        signal_data JSONB NOT NULL,
        processed BOOLEAN DEFAULT FALSE,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_signal_type CHECK (signal_type IN ('offer', 'answer', 'ice_candidate', 'connection_state'))
      )
    `);

    // Create indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reading_sessions_client_id ON reading_sessions(client_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reading_sessions_reader_id ON reading_sessions(reader_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reading_sessions_status ON reading_sessions(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_live_streams_reader_id ON live_streams(reader_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_webrtc_signals_session_id ON webrtc_signals(session_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_billing_transactions_session_id ON billing_transactions(session_id)');

    await client.query('COMMIT');
    console.log('SoulSeer database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing SoulSeer database:', error);
    throw error;
  } finally {
    client.release();
  }
};