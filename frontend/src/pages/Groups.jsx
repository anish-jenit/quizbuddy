import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { groupAPI } from '../utils/api';
import { Card, Button, Input, Modal, Alert, Loading } from '../components/UI';
import { Plus, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const shareGroupOnWhatsApp = (group) => {
  const code = group.code || group._id || group.id;
  const name = group.name || 'a group';
  const text = `🎓 Join *${name}* on QuizBuddy!\n\nUse this group code to join:\n*${code}*\n\nOpen the app → Groups → Join Group → enter the code above.`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};

const Groups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMentorOrAdmin = user?.role === 'mentor' || user?.role === 'admin';
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', quizVisibility: 'private' });
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await groupAPI.getMyGroups();
      setGroups(response.data.groups);
    } catch (err) {
      setError('Failed to load groups');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupAPI.createGroup(formData);
      setFormData({ name: '', description: '', quizVisibility: 'private' });
      setShowCreateModal(false);
      await fetchGroups();
    } catch (err) {
      setError('Failed to create group');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    try {
      await groupAPI.joinGroup({ code: joinCode });
      setJoinCode('');
      setShowJoinModal(false);
      await fetchGroups();
    } catch (err) {
      setError('Invalid group code');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Groups</h1>
              <p className="mt-2 text-sm text-gray-500">Create groups, manage members, and control quiz visibility for each group.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="primary"
                className="justify-center"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} /> Create Group
              </Button>
              <Button 
                variant="secondary"
                className="justify-center"
                onClick={() => setShowJoinModal(true)}
              >
                Join Group
              </Button>
            </div>
          </div>

          {error && <div className="mb-6"><Alert type="error" onClose={() => setError(null)}>{error}</Alert></div>}

          {groups.length === 0 ? (
            <Card className="text-center">
              <p className="text-gray-500">You haven't joined or created any groups yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map(group => (
                <Card key={group._id} className="flex h-full flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                    <p className="min-h-[40px] text-sm leading-6 text-gray-600">{group.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    <p><span className="font-medium text-gray-900">Players:</span> {group.students?.length || 0}</p>
                    <p><span className="font-medium text-gray-900">Mentors:</span> {group.mentors?.length || 0}</p>
                    <p><span className="font-medium text-gray-900">Quizzes:</span> {group.quizzes?.length || 0}</p>
                    <p><span className="font-medium text-gray-900">Quiz Access:</span> {(group.quizVisibility || 'private') === 'public' ? 'Public to all players' : 'Private to this group'}</p>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 border-t border-gray-100 pt-4">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate(`/groups/${group._id || group.id}`)}
                      className="w-full justify-center"
                    >
                      View Group
                    </Button>
                    {isMentorOrAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => shareGroupOnWhatsApp(group)}
                        className="w-full justify-center"
                      >
                        <Share2 size={14} /> Share via WhatsApp
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Create Group Modal */}
          <Modal 
            isOpen={showCreateModal} 
            onClose={() => setShowCreateModal(false)}
            title="Create New Group"
          >
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <Input
                label="Group Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                as="textarea"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Access for This Group</label>
                <select
                  value={formData.quizVisibility}
                  onChange={(e) => setFormData({ ...formData, quizVisibility: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="private">Private: only players in this group can attempt quizzes</option>
                  <option value="public">Public: all players can see and attempt quizzes from this group</option>
                </select>
              </div>
              <Button type="submit" variant="primary" className="w-full justify-center">
                Create Group
              </Button>
            </form>
          </Modal>

          {/* Join Group Modal */}
          <Modal 
            isOpen={showJoinModal} 
            onClose={() => setShowJoinModal(false)}
            title="Join Group"
          >
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <Input
                label="Group Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter group code"
                required
              />
              <Button type="submit" variant="primary" className="w-full justify-center">
                Join Group
              </Button>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Groups;
