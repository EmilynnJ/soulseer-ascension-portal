import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

dotenv.config();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function createUsers() {
  try {
    console.log('Setting up SoulSeer user accounts...');

    // Create admin user
    try {
      const adminUser = await clerk.users.createUser({
        emailAddress: ['emilynnj14@gmail.com'],
        password: 'JayJas1423!',
        firstName: 'Emily',
        lastName: 'Admin',
        username: 'emily_admin',
        phoneNumber: ['+15551234567'],
        publicMetadata: {
          role: 'admin'
        },
        privateMetadata: {
          wallet_balance: 1000.00
        }
      });
      console.log('✅ Admin user created:', adminUser.id);
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  Admin user already exists');
      } else {
        console.error('❌ Error creating admin user:', error.errors || error.message || error);
      }
    }

    // Create reader user
    try {
      const readerUser = await clerk.users.createUser({
        emailAddress: ['emilynn992@gmail.com'],
        password: 'JayJas1423!',
        firstName: 'Emily',
        lastName: 'Reader',
        username: 'emily_reader',
        phoneNumber: ['+15551234568'],
        publicMetadata: {
          role: 'reader'
        },
        privateMetadata: {
          bio: 'Experienced psychic reader specializing in love, career, and spiritual guidance.',
          specialties: ['Tarot', 'Love Readings', 'Career Guidance', 'Spiritual Counseling'],
          experience_years: 5,
          rate_per_minute: 4.99,
          wallet_balance: 0.00
        }
      });
      console.log('✅ Reader user created:', readerUser.id);
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  Reader user already exists');
      } else {
        console.error('❌ Error creating reader user:', error.errors || error.message || error);
      }
    }

    console.log('🎉 User setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up users:', error);
    process.exit(1);
  }
}

createUsers();