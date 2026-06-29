import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { challengeAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Alert, Button, Card, Input, Loading } from '../components/UI';

const Challenge = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, guestLogin, isLoading: isAuthLoading } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadChallenge = async () => {
    try {
      setIsLoading(true);
      const response = await challengeAPI.get(code);
      setChallenge(response.data.challenge);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load challenge');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadChallenge(); }, [code]);

  const joinAndStart = async (event) => {
    event.preventDefault();
    try {
      setIsJoining(true);
      setError('');
      if (!user) await guestLogin(nickname);
      await challengeAPI.accept(code);
      navigate(`/quiz/${challenge.quiz.id}?challenge=${code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join challenge');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading || isAuthLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <Card className="mx-auto max-w-2xl">
        <Button variant="secondary" size="sm" onClick={() => navigate('/')}>Home</Button>
        <h1 className="mt-5 text-3xl font-bold text-blue-700">Friend Challenge</h1>
        {error && <div className="mt-5"><Alert type="error">{error}</Alert></div>}

        {challenge && (
          <>
            <div className="mt-5 rounded-xl bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">{challenge.quiz.category} · {challenge.quiz.difficulty}</p>
              <h2 className="mt-1 text-2xl font-bold">{challenge.quiz.title}</h2>
              <p className="mt-2 text-sm text-gray-600">Challenge code: <span className="font-mono font-semibold">{challenge.code}</span></p>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="font-semibold">Players</h3>
              {challenge.participants.map((participant, index) => (
                <div key={`${participant.nickname}-${index}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <p className="font-medium">{participant.nickname}{participant.isCreator ? ' (Challenger)' : ''}</p>
                    <p className="text-xs capitalize text-gray-500">{participant.status.replace('-', ' ')}</p>
                  </div>
                  {participant.status === 'completed' && (
                    <div className="text-right">
                      <p className="font-bold text-blue-700">{Number(participant.percentageScore || 0).toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{participant.duration}s</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {challenge.winner && (
              <Alert type="success">
                {challenge.winner.isTie ? 'It is a tie!' : `${challenge.winner.nickname} wins the challenge!`}
              </Alert>
            )}

            {challenge.status !== 'completed' && (
              <form onSubmit={joinAndStart} className="mt-6 space-y-4">
                {!user && (
                  <Input
                    label="Your guest nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    minLength={2}
                    maxLength={40}
                    placeholder="Quiz Challenger"
                    required
                  />
                )}
                <Button type="submit" variant="primary" isLoading={isJoining} className="w-full justify-center">
                  {user ? 'Start Challenge Quiz' : 'Join as Guest & Start'}
                </Button>
              </form>
            )}

            <Button variant="secondary" className="mt-4 w-full justify-center" onClick={loadChallenge}>Refresh Results</Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default Challenge;
