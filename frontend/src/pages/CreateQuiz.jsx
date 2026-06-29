import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { groupAPI, quizAPI } from '../utils/api';
import { Card, Button, Input, Alert, Loading } from '../components/UI';
import { useAuth } from '../hooks/useAuth';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    timePerQuestion: 30,
    questionCount: 5,
    groupId: ''
  });
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const selectedGroup = groups.find((group) => (group._id || group.id) === formData.groupId);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const response = await groupAPI.getMyGroups();
        const allGroups = response.data?.groups || [];
        const myMentorGroups = allGroups.filter((group) => {
          const creatorId = group.createdBy?._id || group.createdBy?.id || group.createdBy;
          const mentorIds = (group.mentors || []).map((mentor) => mentor._id || mentor.id || mentor);
          const userId = user?._id || user?.id;
          return user?.role === 'admin' || creatorId === userId || mentorIds.includes(userId);
        });

        setGroups(myMentorGroups);
        if (myMentorGroups.length > 0) {
          setFormData((prev) => ({ ...prev, groupId: prev.groupId || (myMentorGroups[0]._id || myMentorGroups[0].id) }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load groups');
      } finally {
        setIsLoadingGroups(false);
      }
    };

    if (user) {
      loadGroups();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isMentor && !formData.groupId) {
      setError('Please select a group for this quiz.');
      return;
    }
    if ((selectedGroup?.quizVisibility || 'private') === 'public' && !formData.category) {
      setError('Choose a core genre for this public quiz.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await quizAPI.createQuiz({
        ...formData,
        timePerQuestion: Number(formData.timePerQuestion),
        groupId: formData.groupId || undefined
      });
      const quizId = response.data?.quiz?._id || response.data?.quiz?.id;

      if (!quizId) {
        throw new Error('Quiz created but missing quiz id');
      }

      setSuccess('Quiz created. Continue to add questions.');
      setTimeout(
        () =>
          navigate(`/quizzes/${quizId}/questions`, {
            state: {
              questionCount: Number(formData.questionCount),
              quizTitle: formData.title
            }
          }),
        400
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Create Quiz</h1>
            <p className="text-gray-600 mb-6">Mentor / Admin only</p>

            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            {isLoadingGroups && <Loading />}

            {!isLoadingGroups && isMentor && groups.length === 0 && (
              <Alert type="warning">You must be part of at least one group before creating a quiz.</Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Input
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Tamil Basics"
                required
              />

              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Short quiz description"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre {(selectedGroup?.quizVisibility || 'private') === 'public' ? '(required)' : '(optional for private quizzes)'}
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No genre</option>
                  <option value="Tamil">Tamil</option>
                  <option value="English">English</option>
                  <option value="Math">Math</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <Input
                label="Time Per Question (seconds)"
                type="number"
                min="10"
                max="300"
                name="timePerQuestion"
                value={formData.timePerQuestion}
                onChange={handleChange}
                required
              />

              <Input
                label="Number of Questions (Max 10)"
                type="number"
                min="1"
                max="10"
                name="questionCount"
                value={formData.questionCount}
                onChange={handleChange}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                <select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required={isMentor}
                  disabled={isLoadingGroups || groups.length === 0}
                >
                  {!formData.groupId && <option value="">Select a group</option>}
                  {groups.map((group) => {
                    const groupId = group._id || group.id;
                    return (
                      <option key={groupId} value={groupId}>
                        {group.name}
                      </option>
                    );
                  })}
                </select>
                {selectedGroup && (
                  <p className="text-xs text-gray-500 mt-2">
                    Quiz visibility follows this group setting: {(selectedGroup.quizVisibility || 'private') === 'public'
                      ? 'Public to all players'
                      : 'Private to members of this group'}.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" className="w-full justify-center sm:w-auto" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isLoadingGroups || (isMentor && groups.length === 0)}
                  className="w-full justify-center sm:w-auto"
                >
                  Create Quiz
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
