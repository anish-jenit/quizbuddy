import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { groupAPI } from '../utils/api';
import { Card, Button, Loading, Alert, Input } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, UserMinus, Check, X } from 'lucide-react';

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const [mentorEmail, setMentorEmail] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isAddingMentor, setIsAddingMentor] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const loadGroup = async () => {
    try {
      const [groupRes, pendingRes] = await Promise.allSettled([
        groupAPI.getGroupById(id),
        groupAPI.getPendingMentors(id)
      ]);

      if (groupRes.status === 'fulfilled') setGroup(groupRes.value.data.group);
      else throw groupRes.reason;

      if (pendingRes.status === 'fulfilled') {
        setPendingMentors(pendingRes.value.data.pendingMentors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadGroup(); }, [id]);

  const userId = user?._id || user?.id;
  const isOwner = group && (
    (group.createdBy?._id || group.createdBy?.id || group.createdBy) === userId
  );
  const isMentorInGroup = group && (
    isOwner || (group.mentors || []).some((m) => (m._id || m.id || m) === userId)
  );
  const canManage = isMentorInGroup || user?.role === 'admin';

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const handleAddMentor = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setIsAddingMentor(true);
      await groupAPI.addMentor({ groupId: id, mentorEmail: mentorEmail.trim() });
      setMentorEmail('');
      flash('Mentor added successfully');
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add mentor');
    } finally {
      setIsAddingMentor(false);
    }
  };

  const handleRemoveMentor = async (mentorId) => {
    setError('');
    try {
      const res = await groupAPI.removeMentor({ groupId: id, mentorId });
      if (res.data?.pendingAdminReview) {
        flash('Removal request submitted for admin review');
      } else {
        flash('Mentor removed');
      }
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove mentor');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setIsAddingStudent(true);
      await groupAPI.addStudentByEmail(id, { studentEmail: studentEmail.trim() });
      setStudentEmail('');
      flash('Student added successfully');
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    setError('');
    try {
      await groupAPI.removeStudent(id, { studentId });
      flash('Student removed');
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove student');
    }
  };

  const handleReviewMentor = async (mentorUserId, action) => {
    setError('');
    try {
      await groupAPI.reviewMentorRequest(id, { userId: mentorUserId, action });
      flash(action === 'approve' ? 'Mentor approved and added to group' : 'Request rejected');
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review request');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold">Group Details</h1>
            <Button className="justify-center md:self-auto" variant="secondary" onClick={() => navigate('/groups')}>Back to Groups</Button>
          </div>

          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {actionMsg && <Alert type="success">{actionMsg}</Alert>}

          {group && (
            <>
              {/* Group info */}
              <Card>
                <h2 className="text-2xl font-semibold mb-2">{group.name}</h2>
                <p className="text-gray-600 mb-4">{group.description || 'No description'}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <p><span className="font-medium">Group Code:</span> <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{group.code || '-'}</span></p>
                  <p><span className="font-medium">Category:</span> {group.category || 'Tamil'}</p>
                  <p><span className="font-medium">Quizzes:</span> {group.quizzes?.length || 0}</p>
                </div>
                <p className="mt-4 text-sm text-gray-700">
                  <span className="font-medium">Quiz Access:</span> {(group.quizVisibility || 'private') === 'public'
                    ? ' Public to all students across QuizBuddy'
                    : ' Private to students who join this group'}
                </p>
              </Card>

              {/* Pending mentor requests — owner only */}
              {isOwner && pendingMentors.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold mb-3 text-amber-700">Pending Mentor Requests ({pendingMentors.length})</h3>
                  <div className="space-y-3">
                    {pendingMentors.map((m) => {
                      const mId = m._id || m.id;
                      return (
                        <div key={mId} className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium">{m.firstName} {m.lastName}</p>
                            <p className="text-sm text-gray-600">{m.email}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 md:justify-end">
                            <Button variant="success" size="sm" onClick={() => handleReviewMentor(mId, 'approve')}>
                              <Check size={14} /> Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleReviewMentor(mId, 'reject')}>
                              <X size={14} /> Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mentors */}
                <Card>
                  <h3 className="text-lg font-semibold mb-3">Mentors ({group.mentors?.length || 0})</h3>

                  {canManage && (
                    <form onSubmit={handleAddMentor} className="mb-4 flex flex-col gap-2 sm:flex-row">
                      <Input
                        className="w-full"
                        placeholder="mentor@email.com"
                        value={mentorEmail}
                        onChange={(e) => setMentorEmail(e.target.value)}
                        required
                      />
                      <Button type="submit" variant="primary" size="sm" className="justify-center sm:self-end" isLoading={isAddingMentor}>
                        <UserPlus size={14} />
                      </Button>
                    </form>
                  )}

                  {(group.mentors || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">No mentors assigned</p>
                  ) : (
                    <ul className="space-y-2">
                      {(group.mentors || []).map((mentor) => {
                        const mId = mentor._id || mentor.id || mentor;
                        const isCreator = (group.createdBy?._id || group.createdBy?.id || group.createdBy) === mId;
                        return (
                          <li key={mId} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-gray-700">
                              {mentor.firstName ? `${mentor.firstName} ${mentor.lastName}` : mId}
                              {isCreator && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Owner</span>}
                            </span>
                            {isOwner && !isCreator && (
                              <Button variant="danger" size="sm" onClick={() => handleRemoveMentor(mId)}>
                                <UserMinus size={12} /> Remove
                              </Button>
                            )}
                            {!isOwner && isMentorInGroup && mId !== userId && !isCreator && (
                              <Button variant="secondary" size="sm" onClick={() => handleRemoveMentor(mId)}>
                                Request Removal
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>

                {/* Students */}
                <Card>
                  <h3 className="text-lg font-semibold mb-3">Students ({group.students?.length || 0})</h3>

                  {canManage && (
                    <form onSubmit={handleAddStudent} className="mb-4 flex flex-col gap-2 sm:flex-row">
                      <Input
                        className="w-full"
                        placeholder="student@email.com"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                      />
                      <Button type="submit" variant="primary" size="sm" className="justify-center sm:self-end" isLoading={isAddingStudent}>
                        <UserPlus size={14} />
                      </Button>
                    </form>
                  )}

                  {(group.students || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">No students in this group</p>
                  ) : (
                    <ul className="space-y-2">
                      {(group.students || []).map((student) => {
                        const sId = student._id || student.id || student;
                        return (
                          <li key={sId} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-gray-700">
                              {student.firstName ? `${student.firstName} ${student.lastName}` : sId}
                            </span>
                            {canManage && (
                              <Button variant="danger" size="sm" onClick={() => handleRemoveStudent(sId)}>
                                <UserMinus size={12} /> Remove
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
