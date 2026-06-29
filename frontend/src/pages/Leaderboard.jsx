import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { responseAPI, quizAPI } from '../utils/api';
import { Card, Loading, Alert } from '../components/UI';
import { Trophy } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzesAndLeaderboard = async () => {
      try {
        setIsLoading(true);
        const quizzesRes = await quizAPI.getQuizzes({ isPublished: 'true' });
        const fetchedQuizzes = quizzesRes.data.quizzes || [];
        setQuizzes(fetchedQuizzes);

        if (fetchedQuizzes.length === 0) {
          setLeaderboard([]);
          return;
        }

        const initialQuizId = fetchedQuizzes[0]._id;
        setSelectedQuizId(initialQuizId);

        try {
          const leaderboardRes = await responseAPI.getLeaderboard({
            quizId: initialQuizId,
            period: 'all-time'
          });
          setLeaderboard(leaderboardRes.data.leaderboard || []);
        } catch (lbErr) {
          // 404 means no one has attempted yet — not a real error
          if (lbErr.response?.status !== 404) {
            setError(lbErr.response?.data?.message || 'Failed to load leaderboard');
          }
          setLeaderboard([]);
        }
      } catch (err) {
        setError('Failed to load quizzes');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzesAndLeaderboard();
  }, []);

  const handleQuizChange = async (quizId) => {
    if (!quizId) return;

    try {
      setIsLoading(true);
      setError(null);
      setSelectedQuizId(quizId);
      const response = await responseAPI.getLeaderboard({ quizId, period: 'all-time' });
      setLeaderboard(response.data.leaderboard || []);
    } catch (err) {
      setLeaderboard([]);
      // 404 just means no one has attempted this quiz yet
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load leaderboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold">
            <Trophy size={32} className="text-yellow-500" />
            Leaderboard
          </h1>

          {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}

          <Card className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Quiz</label>
            <select
              value={selectedQuizId}
              onChange={(e) => handleQuizChange(e.target.value)}
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg"
            >
              {quizzes.length === 0 ? (
                <option value="">No published quizzes available</option>
              ) : (
                quizzes.map((quiz) => (
                  <option key={quiz._id} value={quiz._id}>
                    {quiz.title}
                  </option>
                ))
              )}
            </select>
          </Card>

          <Card>
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-500">No scores yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Average Score</th>
                      <th className="text-left py-3 px-4 font-semibold">Attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={entry._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-lg text-blue-600">#{entry.rank || index + 1}</span>
                        </td>
                        <td className="py-3 px-4">
                          {entry.student?.nickname || `${entry.student?.firstName || ''} ${entry.student?.lastName || ''}`.trim()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold">{entry.averageScore?.toFixed(1) || 0}%</span>
                        </td>
                        <td className="py-3 px-4">{entry.attemptCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
