import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './style.css';

function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (!token || role !== 'owner') {
      navigate('/', { replace: true });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchPosts();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This will also delete all their posts.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`User "${username}" deleted.`);
      fetchUsers();
      fetchPosts();
    } catch {
      setMessage('Failed to delete user.');
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await axios.patch(
        `http://localhost:5000/api/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Role updated to "${newRole}".`);
      fetchUsers();
    } catch {
      setMessage('Failed to update role.');
    }
  };

  const handleBanUser = async (id, currentlyBanned) => {
    const action = currentlyBanned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await axios.patch(
        `http://localhost:5000/api/users/${id}/ban`,
        { banned: !currentlyBanned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(currentlyBanned ? 'User unbanned.' : 'User banned.');
      fetchUsers();
    } catch {
      setMessage('Failed to update ban status.');
    }
  };

  const handleWipeDatabase = async () => {
    if (!window.confirm('WARNING: This will delete ALL posts, comments, and non-owner users. This cannot be undone. Are you sure?')) return;
    if (!window.confirm('Are you absolutely sure? This is irreversible.')) return;
    try {
      await axios.delete('http://localhost:5000/api/admin/wipe', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Database wiped successfully.');
      fetchUsers();
      fetchPosts();
    } catch {
      setMessage('Failed to wipe database.');
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Post deleted.');
      fetchPosts();
    } catch {
      setMessage('Failed to delete post.');
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const tabStyle = (tab) => ({
    backgroundColor: activeTab === tab ? '#1e1e1e' : '#2e2e2e',
    color: activeTab === tab ? '#fff' : '#aaa',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #e8a838' : '2px solid transparent',
    fontFamily: 'Montserrat',
    fontSize: '14px',
    padding: '12px 28px',
    cursor: 'pointer',
  });

  return (
    <div className='fumb'>
      {/* Header */}
      <div className='mhku'>
        <h1 className='gzob'>YapON — Admin Panel</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            marginLeft: 'auto',
            backgroundColor: '#212121',
            border: '1px solid #555',
            color: '#fff',
            fontFamily: 'Montserrat',
            borderRadius: '10px',
            padding: '6px 16px',
            cursor: 'pointer',
          }}
        >
          ← Back to Home
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', backgroundColor: '#2e2e2e', borderBottom: '2px solid #3d3d3d' }}>
        <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>
          Users ({users.length})
        </button>
        <button style={tabStyle('posts')} onClick={() => setActiveTab('posts')}>
          Posts ({posts.length})
        </button>
        <button
          onClick={handleWipeDatabase}
          style={{
            marginLeft: 'auto',
            backgroundColor: '#3a1a1a',
            border: 'none',
            borderLeft: '1px solid #3d3d3d',
            color: '#cc4444',
            fontFamily: 'Montserrat',
            fontSize: '13px',
            padding: '10px 20px',
            cursor: 'pointer',
          }}
        >
          ⚠ Wipe Database
        </button>
      </div>

      {/* Message bar */}
      {message && (
        <div style={{
          backgroundColor: '#2a3a2a',
          borderBottom: '1px solid #3d3d3d',
          padding: '10px 24px',
          color: '#7ecb7e',
          fontFamily: 'Montserrat',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {message}
          <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', color: '#7ecb7e', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* Users tab */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {users.map(user => (
              <div key={user.id} style={{
                backgroundColor: user.banned ? '#2a1a1a' : '#2e2e2e',
                border: user.banned ? '1px solid #cc4444' : '1px solid #3d3d3d',
                borderRadius: '10px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}>
                <div>
                  <p style={{ color: user.banned ? '#cc4444' : '#fff', fontFamily: 'Montserrat', fontWeight: 600, marginBottom: '4px' }}>
                    {user.username}
                    <span style={{
                      marginLeft: '10px',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      backgroundColor: user.role === 'owner' ? '#4a3500' : user.role === 'admin' ? '#1a2e4a' : '#2a2a2a',
                      color: user.role === 'owner' ? '#e8a838' : user.role === 'admin' ? '#6ab0f5' : '#888',
                    }}>
                      {user.role}
                    </span>
                    {user.banned === 1 && (
                      <span style={{
                        marginLeft: '8px', fontSize: '11px', padding: '2px 8px',
                        borderRadius: '20px', backgroundColor: '#3a1a1a', color: '#cc4444',
                      }}>
                        banned
                      </span>
                    )}
                  </p>
                  <p style={{ color: '#666', fontFamily: 'Montserrat', fontSize: '12px' }}>
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>

                {user.role !== 'owner' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleRoleChange(user.id, user.role)}
                      style={{
                        backgroundColor: user.role === 'admin' ? '#2a2a2a' : '#1a2e4a',
                        border: '1px solid #555',
                        color: user.role === 'admin' ? '#aaa' : '#6ab0f5',
                        fontFamily: 'Montserrat',
                        fontSize: '12px',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                    </button>
                    <button
                      onClick={() => handleBanUser(user.id, user.banned)}
                      style={{
                        backgroundColor: user.banned ? '#2a3a2a' : '#3a2a1a',
                        border: user.banned ? '1px solid #7ecb7e' : '1px solid #e8a838',
                        color: user.banned ? '#7ecb7e' : '#e8a838',
                        fontFamily: 'Montserrat',
                        fontSize: '12px',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      {user.banned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      style={{
                        backgroundColor: '#3a1a1a',
                        border: '1px solid #cc4444',
                        color: '#cc4444',
                        fontFamily: 'Montserrat',
                        fontSize: '12px',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {posts.length === 0 && (
              <p style={{ color: '#666', fontFamily: 'Montserrat', textAlign: 'center', marginTop: '40px' }}>
                No posts yet.
              </p>
            )}
            {posts.map(post => (
              <div key={post.id} style={{
                backgroundColor: '#2e2e2e',
                border: post.pinned ? '1px solid #e8a838' : '1px solid #3d3d3d',
                borderRadius: '10px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '20px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ color: '#aaa', fontSize: '11px', fontFamily: 'Montserrat' }}>{post.category}</span>
                    {post.pinned === 1 && <span style={{ color: '#e8a838', fontSize: '11px' }}>📌 Pinned</span>}
                  </div>
                  <p style={{ color: '#fff', fontFamily: 'Montserrat', fontWeight: 600, marginBottom: '4px' }}>{post.title}</p>
                  <p style={{ color: '#777', fontSize: '12px', fontFamily: 'Montserrat' }}>
                    by {post.author} · {formatDate(post.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  style={{
                    backgroundColor: '#3a1a1a',
                    border: '1px solid #cc4444',
                    color: '#cc4444',
                    fontFamily: 'Montserrat',
                    fontSize: '12px',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className='byfd'>
        <p className='tcqu'>&copy; 2026 YapON. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Admin;