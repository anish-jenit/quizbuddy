import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { quizAPI } from '../utils/api';
import { Card, Button, Loading, Alert } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Share2, ThumbsUp, ThumbsDown, Flag, Globe, Lock } from 'lucide-react';

const Quizzes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMentorOrAdmin = user?.role === 'mentor' || user?.role === 'admin';
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState(isMentorOrAdmin ? 'newest' : 'mostLiked');

  const shareQuizOnWhatsApp = (quiz, quizId) => {
    const appUrl = window.location.origin;
    const text = `📝 Quiz: *${quiz.title}*\n${quiz.description ? quiz.description + '\n' : ''}\nGenre: ${quiz.category || 'Not set'} | Difficulty: ${quiz.difficulty}\n\nTake the quiz here:\n${appUrl}/quiz/${quizId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const response = await quizAPI.getQuizzes(isMentorOrAdmin ? { sortBy } : { isPublished: 'true', sortBy });
      setQuizzes(response.data.quizzes || []);
    } catch (err) {
      setError('Failed to load quizzes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (quizId) => {
    try {
      setError(null);
      await quizAPI.publishQuiz(quizId);
      await fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish quiz');
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [isMentorOrAdmin, sortBy]);

  if (isLoading) return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{isMentorOrAdmin ? 'Manage Quizzes' : 'Available Quizzes'}</h1>
              <p className="mt-2 text-sm text-gray-500">Browse by popularity, visibility, and moderation status.</p>
            </div>
            <div className="w-full md:max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="mostLiked">Most liked</option>
                <option value="newest">Newest</option>
                <option value="title">Title</option>
                <option value="mostDisliked">Most disliked</option>
              </select>
            </div>
          </div>

          {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}

          {quizzes.length === 0 ? (
            <Card className="text-center">
              <p className="text-gray-500">No quizzes available yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map(quiz => {
                const quizId = quiz._id || quiz.id;
                const creatorId =
                  typeof quiz.createdBy === 'object'
                    ? (quiz.createdBy?._id || quiz.createdBy?.id)
                    : quiz.createdBy;
                const canManage = user?.role === 'admin' || (user?.role === 'mentor' && creatorId === (user?._id || user?.id));

                return (
                <Card key={quizId} className="flex h-full flex-col hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{quiz.title}</h3>
                    <p className="min-h-[40px] text-sm leading-6 text-gray-600">{quiz.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    <p><span className="font-medium text-gray-900">Genre:</span> {quiz.category || 'Not set (private only)'}</p>
                    <p><span className="font-medium text-gray-900">Difficulty:</span> {quiz.difficulty}</p>
                    <p><span className="font-medium text-gray-900">Questions:</span> {quiz.questions?.length || 0}/10</p>
                    <p><span className="font-medium text-gray-900">Audience:</span> {quiz.visibility === 'public' ? 'Public to all players' : 'Private to the tagged group'}</p>
                    {quiz.group?.name && <p><span className="font-medium text-gray-900">Group:</span> {quiz.group.name}</p>}
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={quiz.isPublished ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>
                        {quiz.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </p>
                    {isMentorOrAdmin && quiz.moderationStatus !== 'approved' && (
                      <p>
                        <span className="font-medium">Moderation:</span>{' '}
                        <span className="text-red-700 font-semibold">{quiz.moderationStatus === 'pending-review' ? 'Hidden pending admin review' : 'Hidden by admin'}</span>
                      </p>
                    )}
                  </div>

                  <div className="mb-5 mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1"><ThumbsUp size={13} /> {quiz.likeCount || 0}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1"><ThumbsDown size={13} /> {quiz.dislikeCount || 0}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1"><Flag size={13} /> {quiz.reportCount || 0}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">{quiz.visibility === 'public' ? <Globe size={13} /> : <Lock size={13} />}{quiz.visibility === 'public' ? 'Public' : 'Private'}</span>
                  </div>

                  <div className="mt-auto">
                  {isMentorOrAdmin ? (
                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/quizzes/${quizId}/questions`, { state: { questionCount: 5, quizTitle: quiz.title } })}
                        className="w-full justify-center"
                      >
                        Add / Edit Questions
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePublish(quizId)}
                        disabled={quiz.isPublished || !canManage}
                        className="w-full justify-center"
                      >
                        {quiz.isPublished ? 'Published' : 'Publish Quiz'}
                      </Button>
                      {quiz.isPublished && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => shareQuizOnWhatsApp(quiz, quizId)}
                          className="w-full justify-center gap-1"
                        >
                          <Share2 size={14} /> Share via WhatsApp
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/quiz/${quizId}`)}
                      className="w-full justify-center"
                    >
                      Start Quiz
                    </Button>
                  )}
                  </div>
                </Card>
              );})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
