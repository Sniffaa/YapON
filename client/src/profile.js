import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './style.css';

function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [username]);

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

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const roleColor = (role) => {
    if (role === 'owner') return { bg: '#4a3500', color: '#e8a838' };
    if (role === 'admin') return { bg: '#1a2e4a', color: '#6ab0f5' };
    return { bg: '#2a2a2a', color: '#888' };
  };

  return (
    <div className='fumb'>
      {/* Header */}
      <div className='mhku'>
        <h1 className='gzob' style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>YapON</h1>
        <button onClick={() => navigate('/')} style={{
          marginLeft: 'auto', backgroundColor: '#212121', border: '1px solid #555',
          color: '#fff', fontFamily: 'Montserrat', borderRadius: '10px',
          padding: '6px 16px', cursor: 'pointer', fontSize: '13px',
        }}>← Back</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 80px' }}>
        {loading && (
          <p style={{ color: '#888', fontFamily: 'Montserrat', textAlign: 'center', marginTop: '60px' }}>Loading...</p>
        )}

        {notFound && (
          <p style={{ color: '#666', fontFamily: 'Montserrat', textAlign: 'center', marginTop: '60px' }}>User not found.</p>
        )}

        {!loading && !notFound && profile && (
          <>
            {/* Profile card */}
            <div style={{
              backgroundColor: '#2e2e2e', border: '1px solid #3d3d3d',
              borderRadius: '14px', padding: '28px', marginBottom: '24px',
              maxWidth: '700px', margin: '0 auto 24px',
            }}>
              {/* Avatar + username */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {profile.avatar ? (
                    <img
                      src={`http://localhost:5000${profile.avatar}`}
                      alt='avatar'
                      style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3d3d3d' }}
                    />
                  ) : (
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      backgroundColor: '#212121', border: '2px solid #3d3d3d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '28px', fontFamily: 'Montserrat', fontWeight: 600, color: '#fff',
                    }}>
                      {profile.username[0].toUpperCase()}
                    </div>
                  )}
                  {/* Upload button — own profile only */}
                  {isOwnProfile && (
                    <label style={{
                      position: 'absolute', bottom: 0, right: 0,
                      backgroundColor: '#212121', border: '1px solid #555',
                      borderRadius: '50%', width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: '12px',
                    }}>
                      ✏️
                      <input type='file' accept='image/*' onChange={handleAvatarChange} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ color: '#fff', fontFamily: 'Montserrat', fontWeight: 600, fontSize: '20px' }}>
                      {profile.username}
                    </h2>
                    <span style={{
                      fontSize: '11px', padding: '2px 10px', borderRadius: '20px',
                      backgroundColor: roleColor(profile.role).bg,
                      color: roleColor(profile.role).color,
                    }}>
                      {profile.role}
                    </span>
                  </div>
                  <p style={{ color: '#666', fontFamily: 'Montserrat', fontSize: '12px', marginTop: '4px' }}>
                    Joined {formatDate(profile.created_at)}
                  </p>
                  {avatarUploading && <p style={{ color: '#888', fontFamily: 'Montserrat', fontSize: '12px', marginTop: '4px' }}>Uploading...</p>}
                  {avatarError && <p style={{ color: 'red', fontFamily: 'Montserrat', fontSize: '12px', marginTop: '4px' }}>{avatarError}</p>}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1, backgroundColor: '#252525', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <p style={{ color: '#fff', fontFamily: 'Montserrat', fontWeight: 600, fontSize: '22px' }}>{profile.post_count}</p>
                  <p style={{ color: '#666', fontFamily: 'Montserrat', fontSize: '12px' }}>Posts</p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#252525', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <p style={{ color: '#fff', fontFamily: 'Montserrat', fontWeight: 600, fontSize: '22px' }}>{profile.comment_count}</p>
                  <p style={{ color: '#666', fontFamily: 'Montserrat', fontSize: '12px' }}>Comments</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ color: '#aaa', fontFamily: 'Montserrat', fontSize: '13px' }}>Bio</p>
                  {isOwnProfile && !editingBio && (
                    <button onClick={() => setEditingBio(true)} style={{
                      background: 'none', border: 'none', color: '#6ab0f5',
                      fontFamily: 'Montserrat', fontSize: '12px', cursor: 'pointer',
                    }}>
                      {profile.bio ? 'Edit' : '+ Add bio'}
                    </button>
                  )}
                </div>

                {editingBio ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      value={bioInput}
                      onChange={e => setBioInput(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder='Write something about yourself...'
                      style={{
                        backgroundColor: '#212121', border: 'none', borderRadius: '8px',
                        color: '#fff', fontFamily: 'Montserrat', fontSize: '13px',
                        padding: '10px 12px', resize: 'vertical', outline: 'none',
                      }}
                    />
                    <p style={{ color: '#555', fontFamily: 'Montserrat', fontSize: '11px', textAlign: 'right' }}>
                      {bioInput.length}/500
                    </p>
                    {bioError && <p style={{ color: 'red', fontFamily: 'Montserrat', fontSize: '12px' }}>{bioError}</p>}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setEditingBio(false); setBioInput(profile.bio || ''); }} style={{
                        backgroundColor: '#212121', border: '1px solid #555', color: '#fff',
                        fontFamily: 'Montserrat', fontSize: '12px', borderRadius: '8px',
                        padding: '6px 16px', cursor: 'pointer',
                      }}>Cancel</button>
                      <button onClick={handleSaveBio} style={{
                        backgroundColor: '#fff', border: 'none', color: '#1e1e1e',
                        fontFamily: 'Montserrat', fontWeight: 600, fontSize: '12px',
                        borderRadius: '8px', padding: '6px 16px', cursor: 'pointer',
                      }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <p style={{
                    color: profile.bio ? '#ccc' : '#555',
                    fontFamily: 'Montserrat', fontSize: '14px', lineHeight: 1.6,
                  }}>
                    {profile.bio || (isOwnProfile ? 'No bio yet.' : 'This user has no bio.')}
                  </p>
                )}
              </div>
            </div>

            {/* Posts */}
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <h3 style={{ color: '#fff', fontFamily: 'Montserrat', fontWeight: 600, marginBottom: '14px', fontSize: '16px' }}>
                Posts by {profile.username}
              </h3>
              {posts.length === 0 && (
                <p style={{ color: '#555', fontFamily: 'Montserrat', fontSize: '13px' }}>No posts yet.</p>
              )}
              {posts.map(post => (
                <div key={post.id} style={{
                  backgroundColor: '#2e2e2e',
                  border: post.pinned ? '1px solid #e8a838' : '1px solid #3d3d3d',
                  borderRadius: '10px', padding: '14px 18px', marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#aaa', fontSize: '11px', fontFamily: 'Montserrat' }}>{post.category}</span>
                    <span style={{ color: '#666', fontSize: '11px', fontFamily: 'Montserrat' }}>{formatDate(post.created_at)}</span>
                  </div>
                  <p style={{ color: '#fff', fontFamily: 'Montserrat', fontWeight: 600, marginBottom: '6px' }}>{post.title}</p>
                  <p style={{ color: '#ccc', fontFamily: 'Montserrat', fontSize: '13px', lineHeight: 1.5 }}>{post.body}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className='byfd'>
        <p className='tcqu'>&copy; 2026 YapON. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Profile;