import Group from '../models/Group.js';
import User from '../models/User.js';
import { generateRandomCode } from '../utils/helpers.js';

export const createGroup = async (req, res) => {
  try {
    const { name, description, category, quizVisibility } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const code = generateRandomCode();

    const group = new Group({
      name,
      description,
      category: category || 'Tamil',
      quizVisibility: quizVisibility === 'public' ? 'public' : 'private',
      code,
      createdBy: req.user._id,
      mentors: [req.user._id],
      students: []
    });

    await group.save();

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: {
        id: group._id,
        name: group.name,
        code: group.code,
        description: group.description
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create group', error: error.message });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('mentors', 'firstName lastName email')
      .populate('students', 'firstName lastName email')
      .populate('quizzes', 'title description category');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch group', error: error.message });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Group code is required' });
    }

    const group = await Group.findOne({ code });

    if (!group) {
      return res.status(404).json({ message: 'Invalid group code' });
    }

    const userId = req.user._id.toString();
    const isMentor = req.user.role === 'mentor';

    if (isMentor) {
      // Mentors join as pending until group owner approves
      const alreadyMentor = group.mentors.some((id) => id.toString() === userId);
      const alreadyPending = group.pendingMentors.some((id) => id.toString() === userId);

      if (alreadyMentor) {
        return res.status(400).json({ message: 'You are already a mentor in this group' });
      }
      if (alreadyPending) {
        return res.status(400).json({ message: 'Your mentor request is already pending approval' });
      }

      group.pendingMentors.push(req.user._id);
      await group.save();

      return res.status(200).json({
        success: true,
        pendingMentorRequest: true,
        message: 'Your request to join as mentor has been sent to the group owner for approval'
      });
    }

    // Students join directly
    if (group.students.some((id) => id.toString() === userId)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    group.students.push(req.user._id);
    await group.save();

    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { groups: group._id } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Joined group successfully',
      group: { id: group._id, name: group.name, description: group.description }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join group', error: error.message });
  }
};

export const getPendingMentors = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('pendingMentors', 'firstName lastName email');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const uid = req.user._id.toString();
    const isOwner = group.createdBy.toString() === uid || group.mentors.some((id) => id.toString() === uid);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    return res.status(200).json({ success: true, pendingMentors: group.pendingMentors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending mentors', error: error.message });
  }
};

export const reviewMentorRequest = async (req, res) => {
  try {
    const { userId, action } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const uid = req.user._id.toString();
    if (group.createdBy.toString() !== uid && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the group owner can approve mentor requests' });
    }

    group.pendingMentors = group.pendingMentors.filter((id) => id.toString() !== userId);

    if (action === 'approve') {
      if (!group.mentors.some((id) => id.toString() === userId)) {
        group.mentors.push(userId);
      }
      await User.findByIdAndUpdate(userId, { role: 'mentor' });
    }

    await group.save();

    return res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Mentor approved' : 'Mentor request rejected'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to review mentor request', error: error.message });
  }
};

export const addStudentByEmail = async (req, res) => {
  try {
    const { studentEmail } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const uid = req.user._id.toString();
    const canManage = group.createdBy.toString() === uid || group.mentors.some((id) => id.toString() === uid) || req.user.role === 'admin';
    if (!canManage) return res.status(403).json({ message: 'Unauthorized' });

    const student = await User.findOne({ email: String(studentEmail || '').toLowerCase() });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (group.students.some((id) => id.toString() === student._id.toString())) {
      return res.status(400).json({ message: 'Student is already in this group' });
    }

    group.students.push(student._id);
    await group.save();
    await User.findByIdAndUpdate(student._id, { $push: { groups: group._id } });

    return res.status(200).json({ success: true, message: 'Student added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add student', error: error.message });
  }
};

export const removeStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const uid = req.user._id.toString();
    const canManage = group.createdBy.toString() === uid || group.mentors.some((id) => id.toString() === uid) || req.user.role === 'admin';
    if (!canManage) return res.status(403).json({ message: 'Unauthorized' });

    group.students = group.students.filter((id) => id.toString() !== studentId);
    await group.save();
    await User.findByIdAndUpdate(studentId, { $pull: { groups: group._id } });

    return res.status(200).json({ success: true, message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove student', error: error.message });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { createdBy: req.user._id },
        { mentors: req.user._id },
        { students: req.user._id }
      ]
    }).populate('mentors', 'firstName lastName').populate('students', 'firstName lastName');

    res.status(200).json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch groups', error: error.message });
  }
};

export const addMentor = async (req, res) => {
  try {
    const { groupId, mentorEmail } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group creator can add mentors' });
    }

    const mentor = await User.findOne({ email: mentorEmail });

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (group.mentors.includes(mentor._id)) {
      return res.status(400).json({ message: 'User is already a mentor' });
    }

    group.mentors.push(mentor._id);
    mentor.role = 'mentor';

    await group.save();
    await mentor.save();

    res.status(200).json({
      success: true,
      message: 'Mentor added successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add mentor', error: error.message });
  }
};

export const removeMentor = async (req, res) => {
  try {
    const { groupId, mentorId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const requesterId = req.user._id.toString();
    const isOwner = group.createdBy.toString() === requesterId;

    // Owner can remove directly; other mentors must go via admin
    if (isOwner || req.user.role === 'admin') {
      group.mentors = group.mentors.filter((m) => m.toString() !== mentorId);
      // Clear any pending removal request for this mentor too
      group.pendingMentorRemovals = (group.pendingMentorRemovals || []).filter(
        (r) => r.mentorId.toString() !== mentorId
      );
      await group.save();
      return res.status(200).json({ success: true, message: 'Mentor removed successfully' });
    }

    // Non-owner mentor: raise a removal request for admin approval
    const isMentorInGroup = group.mentors.some((m) => m.toString() === requesterId);
    if (!isMentorInGroup) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const alreadyRequested = (group.pendingMentorRemovals || []).some(
      (r) => r.mentorId.toString() === mentorId
    );
    if (alreadyRequested) {
      return res.status(400).json({ message: 'A removal request for this mentor is already pending admin review' });
    }

    group.pendingMentorRemovals = group.pendingMentorRemovals || [];
    group.pendingMentorRemovals.push({ mentorId, requestedBy: req.user._id });
    await group.save();

    return res.status(200).json({
      success: true,
      pendingAdminReview: true,
      message: 'Removal request submitted for admin review'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process removal', error: error.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.students = group.students.filter(s => s.toString() !== req.user._id.toString());
    await group.save();

    await User.findByIdAndUpdate(req.user._id, { $pull: { groups: groupId } });

    res.status(200).json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave group', error: error.message });
  }
};
