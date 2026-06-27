import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Card, Button, Loading, Alert, Input, Modal } from '../components/UI';
import { groupAPI, quizAPI, responseAPI } from '../utils/api';
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react';

const QuizAttempt = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responseId, setResponseId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [selectedOption, setSelectedOption] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState('');

  // group-join gate
  const [requiresGroupJoin, setRequiresGroupJoin] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [isReactionSaving, setIsReactionSaving] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Incorrect answers');
  const [reportDescription, setReportDescription] = useState('');

  const startAttempt = async () => {
    setIsLoading(true);
    setError('');
    setRequiresGroupJoin(false);

    try {
      const [quizRes, startRes] = await Promise.all([
        quizAPI.getQuizById(quizId),
        responseAPI.startQuiz({ quizId, isGroupAttempt: false })
      ]);

      setQuiz(quizRes.data.quiz);
      setQuestions(startRes.data.questions || []);
      setResponseId(startRes.data.quizResponse?.id || '');
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresGroupJoin) {
        // Load quiz title for display even if blocked
        try {
          const quizRes = await quizAPI.getQuizById(quizId);
          setQuiz(quizRes.data.quiz);
        } catch (_) {}
        setRequiresGroupJoin(true);
      } else {
        setError(data?.message || 'Failed to start quiz');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startAttempt();
  }, [quizId]);

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setJoinError('');

    if (!groupCode.trim()) {
      setJoinError('Please enter the group code shared by your mentor.');
      return;
    }

    try {
      setIsJoining(true);
      await groupAPI.joinGroup({ code: groupCode.trim() });
      setGroupCode('');
      // After joining, retry starting the quiz
      await startAttempt();
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Invalid group code. Please check with your mentor.');
    } finally {
      setIsJoining(false);
    }
  };

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);

  const applyQuizUpdate = (nextQuiz) => {
    if (nextQuiz) setQuiz(nextQuiz);
  };

  const resetInput = () => {
    setSelectedOption('');
    setSelectedAnswer('');
  };

  const submitCurrent = async () => {
    if (!currentQuestion || !responseId) return;

    const needsOption = currentQuestion.questionType === 'multiple-choice';
    const needsText = currentQuestion.questionType !== 'multiple-choice';

    if (needsOption && !selectedOption) {
      setError('Please select an option before submitting');
      return;
    }

    if (needsText && !selectedAnswer.trim()) {
      setError('Please enter/select an answer before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await responseAPI.submitAnswer({
        responseId,
        questionId: currentQuestion._id,
        selectedOption: needsOption ? selectedOption : undefined,
        selectedAnswer: needsText ? selectedAnswer : selectedOption,
        timeSpent: 0
      });

      const isLastQuestion = currentIndex === questions.length - 1;

      if (isLastQuestion) {
        const completionRes = await responseAPI.completeQuiz(responseId);
        setResult(completionRes.data.result);
      } else {
        setCurrentIndex((prev) => prev + 1);
        resetInput();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (value) => {
    if (!quiz) return;

    try {
      setIsReactionSaving(true);
      const nextValue = quiz.currentUserReaction === value ? 'clear' : value;
      const response = await quizAPI.reactToQuiz(quizId, { value: nextValue });
      applyQuizUpdate(response.data?.quiz);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reaction');
    } finally {
      setIsReactionSaving(false);
    }
  };

  const handleReportQuiz = async (e) => {
    e.preventDefault();
    try {
      setIsReporting(true);
      const response = await quizAPI.reportQuiz(quizId, {
        reason: reportReason,
        description: reportDescription.trim()
      });
      applyQuizUpdate(response.data?.quiz);
      setShowReportModal(false);
      setReportDescription('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report quiz');
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) return <Loading />;

  // ── Group join gate ──────────────────────────────────────────────────
  if (requiresGroupJoin) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Navbar />
          <div className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-md mx-auto">
              <h1 className="text-2xl font-bold mb-2">Join Group to Attempt Quiz</h1>
              {quiz?.title && (
                <p className="mb-1 text-gray-600">Quiz: <span className="font-semibold">{quiz.title}</span></p>
              )}
              <p className="text-gray-500 text-sm mb-6">
                This quiz is only available to members of its group. Enter the group code your mentor shared with you.
              </p>

              {joinError && <div className="mb-4"><Alert type="error">{joinError}</Alert></div>}

              <form onSubmit={handleJoinGroup} className="space-y-4 mt-4">
                <Input
                  label="Group Code"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                  placeholder="e.g. ABC12345"
                  required
                />
                <Button type="submit" variant="primary" isLoading={isJoining} className="w-full justify-center">
                  Join Group & Start Quiz
                </Button>
              </form>

              <Button
                variant="secondary"
                className="w-full justify-center mt-3"
                onClick={() => navigate('/quizzes')}
              >
                Back to Quizzes
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────

  if (isLoading) return <Loading />;

  if (result) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Navbar />
          <div className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-3">Quiz Completed</h1>
              <p className="text-gray-600 mb-8">{quiz?.title}</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-2xl font-bold">{result.totalScore}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className="text-2xl font-bold">{Number(result.percentageScore || 0).toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Correct</p>
                  <p className="text-2xl font-bold">{result.correctAnswers}/{result.totalQuestions}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-2xl font-bold">{result.duration}s</p>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
                <Button variant="primary" onClick={() => navigate('/leaderboard')}>View Leaderboard</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Navbar />
          <div className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-2xl mx-auto text-center">
              <h1 className="text-2xl font-bold mb-4">No questions available</h1>
              <Button variant="secondary" onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="max-w-3xl mx-auto">
            <div className="mb-6 border-b border-gray-100 pb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Question {currentIndex + 1} of {questions.length}
                  </p>
                  <h1 className="text-2xl font-bold">{quiz?.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1">Likes: {quiz?.likeCount || 0}</span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1">Dislikes: {quiz?.dislikeCount || 0}</span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1">Reports: {quiz?.reportCount || 0}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                <Button
                  variant={quiz?.currentUserReaction === 'like' ? 'success' : 'secondary'}
                  size="sm"
                  disabled={isReactionSaving}
                  className="justify-center"
                  onClick={() => handleReaction('like')}
                >
                  <ThumbsUp size={14} /> Like
                </Button>
                <Button
                  variant={quiz?.currentUserReaction === 'dislike' ? 'danger' : 'secondary'}
                  size="sm"
                  disabled={isReactionSaving}
                  className="justify-center"
                  onClick={() => handleReaction('dislike')}
                >
                  <ThumbsDown size={14} /> Dislike
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-center"
                  onClick={() => setShowReportModal(true)}
                >
                  <Flag size={14} /> Report Quiz
                </Button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4">
                <Alert type="error" onClose={() => setError('')}>{error}</Alert>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{currentQuestion.questionText}</h2>

              {currentQuestion.questionType === 'multiple-choice' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt, idx) => (
                    <button
                      key={`${opt.text}-${idx}`}
                      type="button"
                      onClick={() => setSelectedOption(opt.text)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedOption === opt.text
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.questionType === 'true-false' && (
                <div className="flex gap-3">
                  <Button
                    variant={selectedAnswer === 'true' ? 'primary' : 'secondary'}
                    onClick={() => setSelectedAnswer('true')}
                  >
                    True
                  </Button>
                  <Button
                    variant={selectedAnswer === 'false' ? 'primary' : 'secondary'}
                    onClick={() => setSelectedAnswer('false')}
                  >
                    False
                  </Button>
                </div>
              )}

              {currentQuestion.questionType === 'short-answer' && (
                <Input
                  label="Your Answer"
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="Type your answer"
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="primary" isLoading={isSubmitting} className="justify-center" onClick={submitCurrent}>
                {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Submit & Next'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Quiz">
        <form onSubmit={handleReportQuiz} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Incorrect answers">Incorrect answers</option>
              <option value="Poor quality">Poor quality</option>
              <option value="Off-topic">Off-topic</option>
              <option value="Inappropriate content">Inappropriate content</option>
            </select>
          </div>
          <Input
            label="Details"
            as="textarea"
            rows="4"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder="Tell the admin what seems wrong with this quiz"
          />
          <Button type="submit" variant="danger" className="w-full justify-center" isLoading={isReporting}>
            Submit Report
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default QuizAttempt;
