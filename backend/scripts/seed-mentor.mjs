import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/helpers.js';

dotenv.config();

const mentorEmail = process.env.SEED_MENTOR_EMAIL;
const mentorPassword = process.env.SEED_MENTOR_PASSWORD;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil-quiz';

if (!mentorEmail || !mentorPassword) {
  console.error('Missing SEED_MENTOR_EMAIL or SEED_MENTOR_PASSWORD');
  process.exit(1);
}

async function run() {
  await mongoose.connect(mongoUri);

  const hashedPassword = await hashPassword(mentorPassword);

  const existing = await User.findOne({ email: mentorEmail });

  if (existing) {
    existing.role = 'mentor';
    existing.approvalStatus = 'approved';
    existing.requestedRole = null;
    existing.password = hashedPassword;
    if (!existing.firstName) existing.firstName = 'Mock';
    if (!existing.lastName) existing.lastName = 'Mentor';
    existing.isEmailVerified = true;
    await existing.save();
    console.log(`Updated existing user as mentor: ${mentorEmail}`);
  } else {
    await User.create({
      email: mentorEmail,
      firstName: 'Mock',
      lastName: 'Mentor',
      password: hashedPassword,
      role: 'mentor',
      approvalStatus: 'approved',
      requestedRole: null,
      isEmailVerified: true,
    });
    console.log(`Created mentor user: ${mentorEmail}`);
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Failed to seed mentor user.');
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
