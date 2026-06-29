import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { adminAPI } from '../utils/api';
import { Card, Button, Loading, Alert } from '../components/UI';
import { AlertCircle, Check, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [reportedQuestions, setReportedQuestions] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [reviewedTeachers, setReviewedTeachers] = useState([]);
  const [pendingMentorRemovals, setPendingMentorRemovals] = useState([]);
  const [reportedQuizzes, setReportedQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, reportsRes, quizReportsRes, pendingRes, reviewedRes, removalsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getReportedQuestions(),
        adminAPI.getReportedQuizzes(),
        adminAPI.getPendingTeacherRequests(),
        adminAPI.getReviewedTeacherRequests(),
        adminAPI.getPendingMentorRemovals()
      ]);
      setStats(statsRes.data.stats);
      setReportedQuestions(reportsRes.data.reportedQuestions);
      setReportedQuizzes(quizReportsRes.data.reportedQuizzes || []);
      setPendingTeachers(pendingRes.data.pendingRequests || []);
      setReviewedTeachers(reviewedRes.data.reviewedRequests || []);
      setPendingMentorRemovals(removalsRes.data.pendingRemovals || []);
    } catch (err) {
      setError('Failed to load admin data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveReport = async (questionId, action) => {
    try {
      await adminAPI.resolveReport({ questionId, action });
      await fetchAdminData();
    } catch (err) {
      setError('Failed to resolve report');
    }
  };

  const handleTeacherReview = async (userId, action) => {
    try {
      await adminAPI.reviewTeacherRequest({ userId, action });
      await fetchAdminData();
    } catch (err) {
      setError('Failed to review mentor request');
    }
  };

  const handleMentorRemovalReview = async (groupId, mentorId, action) => {
    try {
      await adminAPI.reviewMentorRemoval({ groupId, mentorId, action });
      await fetchAdminData();
    } catch (err) {
      setError('Failed to review mentor removal');
    }
  };

  const handleQuizReportReview = async (quizId, action) => {
    try {
      await adminAPI.reviewQuizReport({ quizId, action });
      await fetchAdminData();
    } catch (err) {
      setError('Failed to review quiz report');
    }
  };

  const handleQuizImport = async (event) => {
    event.preventDefault();
    if (!importFile) return;
    try {
      setIsImporting(true);
      setError(null);
      setImportMessage('');
      const csv = await importFile.text();
      const response = await adminAPI.importPublicQuizzes(csv);
      setImportMessage(response.data.message);
      setImportFile(null);
      event.target.reset();
      await fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import quiz CSV');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await adminAPI.downloadQuizImportTemplate();
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quiz-import-template.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download CSV template');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          {error && <div className="mb-6"><Alert type="error" onClose={() => setError(null)}>{error}</Alert></div>}

          <Card className="mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Bulk Upload Public Quizzes</h2>
                <p className="text-sm text-gray-600 max-w-2xl">
                  Upload a CSV with one row per multiple-choice question. Every public quiz must use one of five genres: Tamil, English, Math, Science, or History.
                </p>
              </div>
              <Button variant="secondary" onClick={downloadTemplate}>Download CSV Template</Button>
            </div>
            <form onSubmit={handleQuizImport} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                required
              />
              <Button type="submit" variant="primary" isLoading={isImporting} className="shrink-0 justify-center">
                Upload & Publish
              </Button>
            </form>
            {importMessage && <div className="mt-4"><Alert type="success">{importMessage}</Alert></div>}
          </Card>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </Card>
            <Card>
              <p className="text-gray-600 text-sm">Mentors</p>
              <p className="text-3xl font-bold">{stats?.totalMentors || 0}</p>
            </Card>
            <Card>
              <p className="text-gray-600 text-sm">Total Quizzes</p>
              <p className="text-3xl font-bold">{stats?.totalQuizzes || 0}</p>
            </Card>
            <Card>
              <p className="text-gray-600 text-sm">Reported Questions</p>
              <p className="text-3xl font-bold text-red-600">{stats?.reportedQuestions || 0}</p>
            </Card>
            <Card>
              <p className="text-gray-600 text-sm">Reported Quizzes</p>
              <p className="text-3xl font-bold text-red-600">{stats?.reportedQuizzes || 0}</p>
            </Card>
          </div>

          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Reported Quizzes</h2>

            {reportedQuizzes.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No reported quizzes</p>
            ) : (
              <div className="space-y-4">
                {reportedQuizzes.map((quiz) => (
                  <div key={quiz._id || quiz.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-lg">{quiz.title}</p>
                        <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p>Group: {quiz.group?.name || 'No group'}</p>
                          <p>Audience: {quiz.visibility === 'public' ? 'Public' : 'Private'}</p>
                          <p>Likes: {quiz.likeCount || 0} | Dislikes: {quiz.dislikeCount || 0} | Reports: {quiz.reportCount || 0}</p>
                          <p>Status: {quiz.moderationStatus === 'pending-review' ? 'Pending review' : quiz.moderationStatus === 'hidden' ? 'Hidden' : 'Approved'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button variant="success" size="sm" onClick={() => handleQuizReportReview(quiz._id || quiz.id, 'approve')}>
                          <Check size={16} /> Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleQuizReportReview(quiz._id || quiz.id, 'keep-hidden')}>
                          <Trash2 size={16} /> Keep Hidden
                        </Button>
                      </div>
                    </div>

                    {(quiz.reports || []).length > 0 && (
                      <div className="mt-4 space-y-2">
                        {quiz.reports.map((report, idx) => (
                          <div key={`${quiz._id || quiz.id}-report-${idx}`} className="text-sm bg-white p-3 rounded border border-red-100">
                            <p className="font-medium">{report.reason}</p>
                            {report.description && <p className="text-gray-600">{report.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Teacher Requests */}
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Mentor Requests</h2>

            {pendingTeachers.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No pending mentor requests</p>
            ) : (
              <div className="space-y-3">
                {pendingTeachers.map((teacher) => (
                  <div key={teacher._id || teacher.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold">{teacher.firstName} {teacher.lastName}</p>
                      <p className="text-sm text-gray-600">{teacher.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleTeacherReview(teacher._id || teacher.id, 'approve')}
                      >
                        <Check size={16} /> Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleTeacherReview(teacher._id || teacher.id, 'reject')}
                      >
                        <Trash2 size={16} /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Reviewed Teacher Requests */}
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Reviewed Mentor Requests</h2>

            {reviewedTeachers.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No reviewed mentor requests yet</p>
            ) : (
              <div className="space-y-3">
                {reviewedTeachers.map((teacher) => (
                  <div key={teacher._id || teacher.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold">{teacher.firstName} {teacher.lastName}</p>
                      <p className="text-sm text-gray-600">{teacher.email}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      teacher.approvalStatus === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {teacher.approvalStatus === 'approved' ? 'Accepted' : 'Rejected'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Mentor Removal Requests */}
          {pendingMentorRemovals.length > 0 && (
            <Card className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-amber-700">Pending Mentor Removal Requests ({pendingMentorRemovals.length})</h2>
              <div className="space-y-3">
                {pendingMentorRemovals.map((r, idx) => (
                  <div key={`${r.groupId}-${r.mentorId}-${idx}`} className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold">{r.mentorName} <span className="text-gray-500 font-normal text-sm">({r.mentorEmail})</span></p>
                      <p className="text-sm text-gray-600">Group: <span className="font-medium">{r.groupName}</span></p>
                      <p className="text-xs text-gray-500">Requested by: {r.requestedBy}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button variant="success" size="sm" onClick={() => handleMentorRemovalReview(r.groupId, r.mentorId, 'approve')}>
                        <Check size={16} /> Approve Removal
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleMentorRemovalReview(r.groupId, r.mentorId, 'reject')}>
                        <Trash2 size={16} /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reported Questions */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle size={24} className="text-red-600" />
              Reported Questions
            </h2>

            {reportedQuestions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reported questions</p>
            ) : (
              <div className="space-y-4">
                {reportedQuestions.map(question => (
                  <div key={question._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="font-semibold mb-2">{question.questionText}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Quiz: {question.quiz?.title}
                    </p>
                    
                    <div className="mb-4 space-y-2">
                      {question.reports?.map((report, idx) => (
                        <div key={idx} className="text-sm bg-white p-2 rounded border border-red-100">
                          <p className="font-medium">Report {idx + 1}: {report.reason}</p>
                          <p className="text-gray-600">{report.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleResolveReport(question._id, 'approve')}
                      >
                        <Check size={16} /> Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleResolveReport(question._id, 'delete')}
                      >
                        <Trash2 size={16} /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
