import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { challengeAPI, quizAPI } from '../utils/api';
import { Card, Button, Loading, Alert, Modal } from '../components/UI';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Share2, ThumbsUp, ThumbsDown, Flag, Globe, Lock } from 'lucide-react';

const CORE_GENRES = [
  { name: 'Tamil', description: 'Language and culture' },
  { name: 'English', description: 'Vocabulary and grammar' },
  { name: 'Math', description: 'Numbers and reasoning' },
  { name: 'Science', description: 'Nature and discovery' },
  { name: 'History', description: 'People and places' }
];

const Quizzes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isMentorOrAdmin = user?.role === 'mentor' || user?.role === 'admin';
  const requestedGenre = searchParams.get('genre') || '';
  const selectedGenre = CORE_GENRES.some((genre) => genre.name === requestedGenre) ? requestedGenre : '';
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState(isMentorOrAdmin ? 'newest' : 'mostLiked');
  const [challenge, setChallenge] = useState(null);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const challengeUrl = challenge ? `${window.location.origin}/challenge/${challenge.code}` : '';

  const createChallenge = async (quizId) => {
    try {
      setIsCreatingChallenge(true);
      setError(null);
      const response = await challengeAPI.create(quizId);
      setChallenge(response.data.challenge);
      setCopyMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create challenge');
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  const copyChallengeLink = async () => {
    await navigator.clipboard.writeText(challengeUrl);
    setCopyMessage('Challenge link copied!');
  };

  const shareQuizOnWhatsApp = (quiz, quizId) => {
    const appUrl = window.location.origin;
    const text = `📝 Quiz: *${quiz.title}*\n${quiz.description ? quiz.description + '\n' : ''}\nGenre: ${quiz.category || 'Not set'} | Difficulty: ${quiz.difficulty}\n\nTake the quiz here:\n${appUrl}/quiz/${quizId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const fetchQuizzes = async () => {
    if (!isMentorOrAdmin && !selectedGenre) {
      setQuizzes([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const response = await quizAPI.getQuizzes(
        isMentorOrAdmin
          ? { sortBy }
          : { isPublished: 'true', category: selectedGenre, sortBy }
      );
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
  }, [isMentorOrAdmin, selectedGenre, sortBy]);

  if (isLoading) return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {isMentorOrAdmin ? 'Manage Quizzes' : selectedGenre ? `${selectedGenre} Quizzes` : 'Choose a Genre'}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {isMentorOrAdmin
                  ? 'Browse by popularity, visibility, and moderation status.'
                  : selectedGenre
                    ? `Showing public quizzes tagged ${selectedGenre}.`
                    : 'Select a genre to discover its public quizzes.'}
              </p>
            </div>
            {(isMentorOrAdmin || selectedGenre) && <div className="w-full md:max-w-xs">
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
            </div>}
          </div>

          {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}

          {!isMentorOrAdmin && !selectedGenre ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_GENRES.map((genre) => (
                <button
                  key={genre.name}
                  type="button"
                  onClick={() => setSearchParams({ genre: genre.name })}
                  className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <span className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Core Genre</span>
                  <h2 className="text-xl font-bold text-gray-900">{genre.name}</h2>
                  <p className="mt-2 text-sm text-gray-600">{genre.description}</p>
                  <p className="mt-5 font-medium text-blue-600">View quizzes →</p>
                </button>
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <Card className="text-center">
              <p className="text-gray-500">No public {selectedGenre} quizzes available yet.</p>
              {!isMentorOrAdmin && (
                <Button variant="secondary" className="mt-4" onClick={() => setSearchParams({})}>Choose Another Genre</Button>
              )}
            </Card>
          ) : (
            <>
            {!isMentorOrAdmin && (
              <Button variant="secondary" className="mb-6" onClick={() => setSearchParams({})}>← All Genres</Button>
            )}
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
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/quiz/${quizId}`)}
                        className="w-full justify-center"
                      >
                        Start Quiz
                      </Button>
                      {user?.isGuest && quiz.visibility === 'public' && (
                        <Button
                          variant="success"
                          size="sm"
                          isLoading={isCreatingChallenge}
                          onClick={() => createChallenge(quizId)}
                          className="w-full justify-center"
                        >
                          Challenge a Friend
                        </Button>
                      )}
                    </div>
                  )}
                  </div>
                </Card>
              );})}
            </div>
            </>
          )}
        </div>
      </div>
      <Modal isOpen={!!challenge} onClose={() => setChallenge(null)} title="Challenge Created">
        {challenge && (
          <div className="space-y-4">
            <p className="text-gray-700">Share this link with one friend. They can choose a guest nickname and take the same quiz.</p>
            <div className="break-all rounded-lg bg-gray-100 p-3 text-sm font-mono">{challengeUrl}</div>
            {copyMessage && <Alert type="success">{copyMessage}</Alert>}
            <Button variant="secondary" className="w-full justify-center" onClick={copyChallengeLink}>Copy Challenge Link</Button>
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => navigate(`/quiz/${challenge.quiz.id}?challenge=${challenge.code}`)}
            >
              Start My Challenge
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Quizzes;
