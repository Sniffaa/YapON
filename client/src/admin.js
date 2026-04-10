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

// Redirect non-owners or unauthenticated users to home
useEffect(() => {
  if (!token || role !== 'owner') {
    navigate('/', { replace: true });
  }
}, []);

// Fetch users and posts on component mount
useEffect(() => {
  fetchUsers();
  fetchPosts();
}, []);

// Fetch all users from the server
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

// Fetch all posts from the server
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

// Confirm and delete a user, then refresh users and posts
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

// Toggle user role between admin and user, then refresh users
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

// Confirm and toggle user ban status, then refresh users
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

// Confirm and wipe entire database, then refresh users and posts
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

// Confirm and delete a post, then refresh posts
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

// Format ISO date to readable US date and time
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
  <div className='thxqa'>
    <div className='vuyqk'>
      <h1 className='sdgjp'>YapON — Admin Panel</h1>
      <button className='mslah' onClick={() => navigate('/')}>← Back to Home</button>
    </div>
    <div className='wkhis'>
      <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users ({users.length})</button>
      <button className={`tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts ({posts.length})</button>
      <button className='dboul' onClick={handleWipeDatabase}>⚠ Wipe Database</button>
    </div>
    {message && (
      <div className='tbrdw'>
    {message}
    <button className='cwkbd' onClick={() => setMessage('')}>×</button>
  </div>
)}
      <div className='nmeuf'>
        {activeTab === 'users' && (
          <div className='lvkfn'>
            {users.map(user => (
              <div key={user.id} className={`user-card${user.banned ? ' banned' : ''}`}>
                <div>
                  <p className="user-name">
                    {user.username}
                    <span className={`user-role-badge ${user.role}`}>{user.role}</span>
                    {user.banned === 1 && (
                    <span className="user-banned-badge">banned</span>
                    )}
                  </p>
                  <p className='sjiac'>Joined {formatDate(user.created_at)}</p>
                </div>
                {user.role !== 'owner' && (
                  <div className='wybpt'>
                    <button onClick={() => handleRoleChange(user.id, user.role)} className={`user-role-btn ${user.role === 'admin' ? 'admin' : ''}`}>
                      {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                    </button>
                    <button className={`enmoq ${user.banned ? 'enmoq--unbanned' : 'enmoq--banned'}`} onClick={() => handleBanUser(user.id, user.banned)}> {user.banned ? 'Unban' : 'Ban'}</button>
                    <button className='vcsiq' onClick={() => handleDeleteUser(user.id, user.username)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {activeTab === 'posts' && (
          <div className='vwoda'>
            {posts.length === 0 && (
              <p className='yhtav'>No posts yet.</p>
            )}
            {posts.map(post => (
              <div className={`agonx ${post.pinned ? 'agonx--pinned' : 'agonx--default'}`} key={post.id}>
                <div className='vicby'>
                  <div className='tpsau'>
                    <span className='wlmdv'>{post.category}</span>
                    {post.pinned === 1 && <span className='kcisg'>📌 Pinned</span>}
                  </div>
                  <p className='hejyp'>{post.title}</p>
                  <p className='tgumh'>by {post.author} · {formatDate(post.created_at)}</p>
                </div>
                <button className='tcwry' onClick={() => handleDeletePost(post.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className='dcxtq'>
        <p className='onwty'>&copy; 2026 YapON. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Admin;