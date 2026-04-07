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

/*If user has token or role owner then navigate to home*/
useEffect(() => {
  if (!token || role !== 'owner') {
    navigate('/', { replace: true });
  }
}, []);

/*Grab all users and posts from the database once loaded in*/
useEffect(() => {
  fetchUsers();
  fetchPosts();
}, []);

/*Gets the user and logs under users state*/
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

/*Gets all the posts from database*/
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

/*Admin able to delete users*/
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

/*Owner can promote or demote users to admin role*/
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

/*Lets admins ban and unban users*/
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

/*Wipes entire database data*/
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

/*Deletes post from db*/
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

/*Gets current date and time*/
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
      <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>Users ({users.length})</button>
      <button style={tabStyle('posts')} onClick={() => setActiveTab('posts')}>Posts ({posts.length})</button>
      <button className='dboul' onClick={handleWipeDatabase}>⚠ Wipe Database</button>
    </div>

    {message && (
      <div className='tbrdw'>
    {message}

    <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', color: '#7ecb7e', cursor: 'pointer', fontSize: '16px' }}>×</button>
  </div>
)}






      <div className='nmeuf'>


        {activeTab === 'users' && (
          <div className='lvkfn'>
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

      <div className='utasw'>
        <p className='okjnq'>&copy; 2026 YapON. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Admin;