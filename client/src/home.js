import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './style.css';

const BASE_URL = 'http://localhost:5000';
const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const CATEGORIES = ['All Posts', 'Tech', 'Career', 'General', 'Health', 'Hobbies'];
const CAT_CLASSES = ['hujp', 'wkwm', 'jjvh', 'bobp', 'khsc', 'fqxw'];

/*Get Current Time & Date*/
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/*If User Is Marked As Banned Then It Will Deny Entry Into Site*/
axios.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === 'Your account has been banned.'
    ) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


const modalBtnStyle = (primary) => ({
  backgroundColor: primary ? '#fff' : '#212121',
  border: primary ? 'none' : '1px solid #555',
  color: primary ? '#1e1e1e' : '#fff',
  fontFamily: 'Montserrat', fontWeight: primary ? 600 : 400,
  borderRadius: '10px', padding: '8px 20px', cursor: 'pointer',
});

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({ post, isPrivileged, onDelete, onPin, onRefresh }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const [editError, setEditError] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUsername = localStorage.getItem('username');
  const isOwnPost = post.author === currentUsername;

/*Grabs Comments From Database*/
const fetchComments = async () => {
  setLoadingComments(true);
  try {
    const res = await axios.get(`${BASE_URL}/api/posts/${post.id}/comments`, {
      headers: authHeaders(token),
    });
    setComments(res.data.comments);
  } catch (err) {
    console.error('Failed to load comments', err);
  } finally {
    setLoadingComments(false);
  }
};

/*The Comments Section Unfold When Clicked */
const handleToggleComments = () => {
  if (!showComments) fetchComments();
  setShowComments(prev => !prev);
};

/*Lets The User Add Comments On Posts*/
const handlePostComment = async () => {
  if (!commentBody.trim()) return;
  try {
    await axios.post(
      `${BASE_URL}/api/posts/${post.id}/comments`,
      { body: commentBody },
      { headers: authHeaders(token) }
    );
    setCommentBody('');
    fetchComments();
  } catch (err) {
    console.error('Failed to post comment', err);
  }
};

/*If User Confirms To Delete Comment Then It Will Be Removed*/
const handleDeleteComment = async (commentId) => {
  if (!window.confirm('Delete this comment?')) return;
  try {
    await axios.delete(`${BASE_URL}/api/comments/${commentId}`, {
      headers: authHeaders(token),
    });
    fetchComments();
  } catch (err) {
    console.error('Failed to delete comment', err);
  }
};

/*Deletes The Users Post After Confirming*/
const handleDeleteOwnPost = async () => {
  if (!window.confirm('Delete your post?')) return;
  try {
    await axios.delete(`${BASE_URL}/api/posts/${post.id}/own`, {
      headers: authHeaders(token),
    });
    onRefresh();
  } catch {
    alert('Failed to delete post.');
  }
};

/*Allows User To Edit Their Own Post*/
const handleEditPost = async () => {
  setEditError('');
  if (!editTitle.trim() || !editBody.trim()) {
    setEditError('Title and body are required.');
    return;
  }
  try {
    await axios.patch(
      `${BASE_URL}/api/posts/${post.id}`,
      { title: editTitle, body: editBody },
      { headers: authHeaders(token) }
    );
    setShowEditModal(false);
    onRefresh();
  } catch (err) {
    setEditError(err.response?.data?.error || 'Failed to edit post.');
  }
};

/*Opens The Current Posts Title And Body*/
const openEditModal = () => {
  setEditTitle(post.title);
  setEditBody(post.body);
  setShowEditModal(true);
};

  return (
    <div className={post.pinned == 1 ? 'postcard pinned-card' : 'postcard'}>

      <div className='tsumi'>
        <div className='uwqnv'>
          <span className='kmsya'>{post.category}</span>
          {post.pinned === 1 && (
            <span className='edrvn'>📌 Pinned</span>
          )}
        </div>
        <div className='piwvu'>
          <span className='sdxtr'>{formatDate(post.created_at)}</span>
          {isPrivileged && (
            <>
              <button className='swrfp' onClick={() => onPin(post.id, post.pinned)} title='Pin'>📌</button>
              <button className='xpbif' onClick={() => onDelete(post.id)} title='Delete post'>🗑</button>
            </>
          )}
          {isOwnPost && (
            <button className='cjvyn' onClick={openEditModal} title='Edit post'>✏️</button>
          )}
          {isOwnPost && !isPrivileged && (
            <button className='fhwyi' onClick={handleDeleteOwnPost} title='Delete post'>🗑</button>
          )}
        </div>
      </div>

      <h3 className='mspje'>{post.title}</h3>
      <p className='crpgy'>{post.body}</p>
      {!!post.edited && (
        <p className='mwbcj'>(edited)</p>
      )}

      <div className='xgwbt'>
        {post.author_avatar ? (
          <img className='eawni' src={`${BASE_URL}${post.author_avatar}`} alt='avatar'/>
        ) : (

          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            backgroundColor: '#212121', border: '1px solid #3d3d3d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', color: '#fff', fontFamily: 'Montserrat', fontWeight: 600,
          }}>
            {post.author[0].toUpperCase()}
          </div>
        )}
        <p
          style={{ color: '#777', fontSize: '12px', fontFamily: 'Montserrat', cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${post.author}`)}
          onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.textDecoration = 'underline'; }}
          onMouseLeave={e => { e.target.style.color = '#777'; e.target.style.textDecoration = 'none'; }}
        >
          by {post.author}
        </p>
      </div>

      <button className='mxvfy' onClick={handleToggleComments}>
        {showComments ? '▲ Hide comments' : '▼ Comments'}
      </button>

      {showComments && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #3d3d3d', paddingTop: '12px' }}>
          {loadingComments && (
            <p style={{ color: '#666', fontFamily: 'Montserrat', fontSize: '12px' }}>Loading...</p>
          )}
          {!loadingComments && comments.length === 0 && (
            <p style={{ color: '#555', fontFamily: 'Montserrat', fontSize: '12px' }}>No comments yet.</p>
          )}
          {comments.map(comment => (
            <div key={comment.id} style={{
              backgroundColor: '#252525', borderRadius: '8px', padding: '10px 14px',
              marginBottom: '8px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: '10px',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#ccc', fontFamily: 'Montserrat', fontSize: '13px', lineHeight: 1.5 }}>{comment.body}</p>
                <p style={{ color: '#555', fontFamily: 'Montserrat', fontSize: '11px', marginTop: '4px' }}>
                  by {comment.author} · {formatDate(comment.created_at)}
                </p>
              </div>
              {(isPrivileged || comment.author === currentUsername) && (
                <button className='grcsu' onClick={() => handleDeleteComment(comment.id)}>🗑</button>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input value={commentBody} onChange={e => setCommentBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePostComment()} placeholder='Write a comment...' style={{flex: 1, backgroundColor: '#212121', border: 'none', borderRadius: '8px', color: '#fff', fontFamily: 'Montserrat', fontSize: '13px', padding: '8px 12px', outline: 'none',}}/>
            <button onClick={handlePostComment} style={modalBtnStyle(true)}>Post</button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#303030', borderRadius: '16px', padding: '30px',
            width: '500px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            <h2 style={{ color: '#fff', fontFamily: 'Montserrat', textAlign: 'center' }}>Edit Post</h2>
            {editError && (
              <p style={{ color: 'red', fontFamily: 'Montserrat', fontSize: '13px', textAlign: 'center' }}>{editError}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontFamily: 'Montserrat', fontSize: '13px' }}>Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                style={{ backgroundColor: '#212121', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: 'Montserrat', height: '36px', textIndent: '12px', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontFamily: 'Montserrat', fontSize: '13px' }}>Body</label>
              <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={5}
                style={{ backgroundColor: '#212121', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: 'Montserrat', padding: '12px', resize: 'vertical', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowEditModal(false); setEditError(''); }} style={modalBtnStyle(false)}>Cancel</button>
              <button onClick={handleEditPost} style={modalBtnStyle(true)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────

function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUsername = localStorage.getItem('username');
  const role = localStorage.getItem('role');
  const isPrivileged = role === 'owner' || role === 'admin';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postCategory, setPostCategory] = useState(CATEGORIES[1]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, []);

  const fetchPosts = useCallback(async (category = null) => {
    setLoading(true);
    try {
      const params = category && category !== 'All Posts' ? { category } : {};
      const res = await axios.get(`${BASE_URL}/api/posts`, {
        headers: authHeaders(token),
        params,
      });
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setIsSearching(false);
      fetchPosts(activeCategory);
      return;
    }
    setIsSearching(true);
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/search`, {
        headers: authHeaders(token),
        params: { q },
      });
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    const delay = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    if (!isSearching) fetchPosts(activeCategory);
  }, [activeCategory]);







const handleCategoryClick = (cat) => {
  setSearchQuery('');
  setIsSearching(false);
  setActiveCategory(cat);
};





const handleCreatePost = async () => {
  setError('');
  if (!postTitle.trim() || !postBody.trim()) {
    setError('Title and body are required.');
    return;
  }
  try {
    await axios.post(
      `${BASE_URL}/api/posts`,
      { title: postTitle, body: postBody, category: postCategory },
      { headers: authHeaders(token) }
    );
    setShowModal(false);
    setPostTitle('');
    setPostBody('');
    setPostCategory(CATEGORIES[1]);
    fetchPosts(activeCategory);
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to create post.');
  }
};





const handleDeletePost = async (id) => {
  if (!window.confirm('Delete this post?')) return;
  try {
    await axios.delete(`${BASE_URL}/api/posts/${id}`, { headers: authHeaders(token) });
    fetchPosts(activeCategory);
  } catch {
    alert('Failed to delete post.');
  }
};





const handlePinPost = async (id, currentlyPinned) => {
  try {
    await axios.patch(
      `${BASE_URL}/api/posts/${id}/pin`,
      { pinned: !currentlyPinned },
      { headers: authHeaders(token) }
    );
    fetchPosts(activeCategory);
  } catch {
    alert('Failed to pin post.');
  }
};




/*strips token, username, and role. Then after it redirects the user to the login page*/
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  navigate('/login');
};





  return (
    <div className='nbjfx'>
      <div className='yklwm'>
        <h1 className='hlbmi'>YapON</h1>
        <span className='gjfmq'>
          Logged in as{' '}
        <span className='mlvhn' onClick={() => navigate(`/profile/${currentUsername}`)}>
          {currentUsername}
        </span>
        </span>
        <button className='dvxcn' onClick={logout}>
          Logout
        </button>
      </div>

      <div className='qtwpc'>
        <div className='kltxb'>
          <p className='hrywg'>Browse</p>
          {CATEGORIES.map((cat, i) => (
            <button key={cat} className={`${CAT_CLASSES[i]}${activeCategory === cat && !isSearching ? ' rkbva' : ''}`} onClick={() => handleCategoryClick(cat)}>
              {cat}
            </button>
          ))}
          {role === 'owner' && (
          <button className='rfeqg' onClick={() => navigate('/admin')}>Admin Panel</button>
          )}
        </div>

        <div className='dstko'>
          <div className='vtkwm'>
            <p className='yngxf'>{activeCategory || 'All Posts'}</p>
            <button className='jxdmy' onClick={() => setShowModal(true)}>+ Create Post</button>
          </div>

          <div className='hbnmw'>
            {loading && (
              <p className='fidgy'>Loading posts...</p>
            )}
            {!loading && posts.length === 0 && (
              <p className='ndviy'>No posts yet. Be the first to post!</p>
            )}
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isPrivileged={isPrivileged}
                onDelete={handleDeletePost}
                onPin={handlePinPost}
                onRefresh={() => fetchPosts(activeCategory)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className='utasw'>
        <p className='okjnq'>&copy; 2026 YapON. All rights reserved.</p>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#303030', borderRadius: '16px', padding: '30px',
            width: '500px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            <h2 style={{ color: '#fff', fontFamily: 'Montserrat', textAlign: 'center' }}>Create Post</h2>
            {error && (
              <p style={{ color: 'red', fontFamily: 'Montserrat', fontSize: '13px', textAlign: 'center' }}>{error}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontFamily: 'Montserrat', fontSize: '13px' }}>Category</label>
              <select value={postCategory} onChange={e => setPostCategory(e.target.value)}
                style={{ backgroundColor: '#212121', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: 'Montserrat', height: '36px', padding: '0 12px', outline: 'none' }}>
                {CATEGORIES.filter(c => c !== 'All Posts').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontFamily: 'Montserrat', fontSize: '13px' }}>Title</label>
              <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder='Post title...'
                style={{ backgroundColor: '#212121', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: 'Montserrat', height: '36px', textIndent: '12px', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontFamily: 'Montserrat', fontSize: '13px' }}>Body</label>
              <textarea value={postBody} onChange={e => setPostBody(e.target.value)} placeholder='Write your post...' rows={5}
                style={{ backgroundColor: '#212121', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: 'Montserrat', padding: '12px', resize: 'vertical', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button onClick={() => { setShowModal(false); setError(''); }} style={modalBtnStyle(false)}>Cancel</button>
              <button onClick={handleCreatePost} style={modalBtnStyle(true)}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;