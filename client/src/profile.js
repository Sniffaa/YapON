import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './style.css';

function Profile() {

const navigate = useNavigate();
const { username } = useParams();
const [profile, setProfile] = useState(null);
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);
const [notFound, setNotFound] = useState(false);
const [editingBio, setEditingBio] = useState(false);
const [bioInput, setBioInput] = useState('');
const [bioError, setBioError] = useState('');
const [avatarUploading, setAvatarUploading] = useState(false);
const [avatarError, setAvatarError] = useState('');
const token = localStorage.getItem('token');
const currentUsername = localStorage.getItem('username');
const isOwnProfile = currentUsername === username;

/*If no user token is found then redirect to login page*/
useEffect(() => {
  if (!token) navigate('/login', { replace: true });
}, []);

/*Grabs users posts and bio*/
useEffect(() => {
  fetchProfile();
}, [username]);

/*Get users profile*/
const fetchProfile = async () => {
  setLoading(true);
  setNotFound(false);
  try {
    const res = await axios.get(`http://localhost:5000/api/profile/${username}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProfile(res.data.user);
    setPosts(res.data.posts);
    setBioInput(res.data.user.bio || '');
  } catch (err) {
    if (err.response?.status === 404) setNotFound(true);
  } finally {
    setLoading(false);
  }
};

/*Store users bio to database*/
const handleSaveBio = async () => {
  setBioError('');
  try { 
    await axios.patch(
      'http://localhost:5000/api/profile/bio',
      { bio: bioInput },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setEditingBio(false);
    fetchProfile();
  } catch (err) {
    setBioError(err.response?.data?.error || 'Failed to save bio.');
  }
};

/*Allows user to upload a pfp*/
const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setAvatarError('');
  setAvatarUploading(true);
  const formData = new FormData();
  formData.append('avatar', file);
  try {
    await axios.post('http://localhost:5000/api/profile/avatar', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    fetchProfile();
  } catch (err) {
    setAvatarError(err.response?.data?.error || 'Failed to upload avatar.');
  } finally {
    setAvatarUploading(false);
  }
};

/*Orders time and date that is given*/
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/*Colors for specific roles*/
const roleColor = (role) => {
  if (role === 'owner') return { bg: '#4a3500', color: '#e8a838' };
  if (role === 'admin') return { bg: '#1a2e4a', color: '#6ab0f5' };
  return { bg: '#2a2a2a', color: '#888' };
};

return (
  <div className='emrlh'>
    <div className='isrpg'>
      <div className='jgdyb'>
        <h1 className='awcxd' onClick={() => navigate('/')}>YapON</h1>
        <button className='rngmv' onClick={() => navigate('/')}>← Back</button>
      </div>
    </div>
    <div className='ximga'>
      {loading && (
        <p className='wlqhi'>Loading...</p>
      )}
        {notFound && (
          <p className='wbvya'>User not found.</p>
        )}
        {!loading && !notFound && profile && (
      <>
            <div className='pkmjr'>
              <div className='tmrgj'>
                <div className='naygh'>
                  {profile.avatar ? (

                    <img className='jqbya' src={`http://localhost:5000${profile.avatar}`} alt='avatar' style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3d3d3d' }}/>
                  ) : (
                    <div className='lfisd'>{profile.username[0].toUpperCase()}</div>
                  )}
                  {isOwnProfile && (
                    <label className='vbexu'>
                      <input className='xlnoh' type='file' accept='image/*' onChange={handleAvatarChange}/>
                    </label>
                  )}
                </div>
                <div>
                  <div className='wjvgr'>
                    <h2 className='dajcr'>{profile.username}</h2>
                    <span className={`profile-role-badge ${profile.role}`}>{profile.role}</span>
                  </div>
                  <p className='fpvjs'>Joined {formatDate(profile.created_at)}</p>
                  {avatarUploading && <p className='pkmsq'>Uploading...</p>}
                  {avatarError && <p className='ifxjo'>{avatarError}</p>}
                </div>
              </div>
              <div className='dxtne'>
                <div className='wdkqy'>
                  <p className='npsad'>{profile.post_count}</p>
                  <p className='vhlmw'>Posts</p>
                </div>
                <div className='fgwsk'>
                  <p className='mkscj'>{profile.comment_count}</p>
                  <p className='blrom'>Comments</p>
                </div>
              </div>

              <div>
                <div className='osujt'>
                  <p className='xlpmh'>Bio</p>
                  {isOwnProfile && !editingBio && (
                    <button className='tbipo' onClick={() => setEditingBio(true)}>{profile.bio ? 'Edit' : '+ Add bio'}</button>
                  )}
                </div>

                {editingBio ? (
                  <div className='lncwq'>
                    <textarea className='oreiw' value={bioInput} onChange={e => setBioInput(e.target.value)} maxLength={500} rows={3} placeholder='Write something...'/>
                    <p className='hrfni'>{bioInput.length}/500</p>
                    {bioError && <p className='dcwyp'>{bioError}</p>}
                    <div className='pmdsn'>
                      <button className='vqhgu' onClick={() => { setEditingBio(false); setBioInput(profile.bio || ''); }}>Cancel</button>
                      <button className='nqrfs' onClick={handleSaveBio}>Save</button>
                    </div>
                  </div>
                ) : (
                  <p className={`frpuv ${profile.bio ? 'has-bio' : ''}`}>
                    {profile.bio || (isOwnProfile ? 'No bio yet.' : 'This user has no bio.')}
                  </p>
                )}
              </div>
            </div>
            <div className='ruiyl'>
              <h3 className='neird'>Posts by {profile.username}</h3>
              {posts.length === 0 && (
                <p className='plute'>No posts yet.</p>
              )}
              {posts.map(post => (
                <div className={`profile-post-card ${post.pinned ? 'pinned' : ''}`} key={post.id}>

                  <div className='jvyup'>
                    <span className='sxgkc'>{post.category}</span>
                    <span className='yjekw'>{formatDate(post.created_at)}</span>
                  </div>
                  <p className='tfdnj'>{post.title}</p>
                  <p className='kiwja'>{post.body}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className='rjoeq'>
        <p className='pdbym'>&copy; 2026 YapON. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Profile;