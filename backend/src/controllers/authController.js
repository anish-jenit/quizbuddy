import User from '../models/User.js';
import { generateToken, hashPassword, comparePassword } from '../utils/helpers.js';

export const register = async (req, res) => {
  try {
    const { email, firstName, lastName, nickname, password, confirmPassword, registerAsTeacher } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);

    const isTeacherRequest = registerAsTeacher === true;

    user = new User({
      email,
      firstName,
      lastName,
      nickname: String(nickname || '').trim(),
      password: hashedPassword,
      role: 'student',
      approvalStatus: isTeacherRequest ? 'pending' : 'approved',
      requestedRole: isTeacherRequest ? 'mentor' : null,
      isEmailVerified: true // For MVP, skip email verification
    });

    await user.save();

    const token = generateToken(user._id);

    if (isTeacherRequest) {
      return res.status(201).json({
        success: true,
        message: 'Teacher registration submitted for admin approval',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          nickname: user.nickname,
          role: user.role,
          approvalStatus: user.approvalStatus,
          requestedRole: user.requestedRole
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        role: user.role,
        approvalStatus: user.approvalStatus,
        requestedRole: user.requestedRole
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.approvalStatus === 'pending' && user.requestedRole === 'mentor') {
      return res.status(403).json({ message: 'Teacher account pending admin approval' });
    }

    if (user.approvalStatus === 'rejected' && user.requestedRole === 'mentor') {
      return res.status(403).json({ message: 'Teacher request was rejected by admin' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        role: user.role,
        approvalStatus: user.approvalStatus,
        requestedRole: user.requestedRole
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('groups');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findById(req.user._id);
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

export const resetTeacherPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'Teacher account not found' });
    }

    const isTeacherAccount = user.role === 'mentor' || user.role === 'admin' || user.requestedRole === 'mentor';

    if (!isTeacherAccount) {
      return res.status(403).json({ message: 'This reset flow is only available for teacher accounts' });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};
