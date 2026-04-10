import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './style.css';

const BASE_URL = 'http://localhost:5000';
const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });
const CATEGORIES = ['All Posts', 'Tech', 'Career', 'General', 'Health', 'Hobbies'];
const CAT_CLASSES = ['hujp', 'wkwm', 'jjvh', 'bobp', 'khsc', 'fqxw'];

// Format ISO date to readable string with date and time
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Intercept responses: log out if account is banned
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

function PostCard({ post, isPrivileged, onDelete, onPin, onRefresh }) {

const navigate = useNavigate();
const [showComments, setShowComments] = useState(false);
const [comments, setComments] = useState([]);
const [commentBody, setCommentBody] = useState('');
const [loadingComments, setLoadingComments] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [editTitle, setEditTitle] = useState(post.title);
const [editBody, setEditBody] = useState(post.body);
const [editError, setEditError] = useState('');
const token = localStorage.getItem('token');
const currentUsername = localStorage.getItem('username');
const isOwnPost = post.author === currentUsername;

// Fetch comments for the current post
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

// Toggle comments visibility and fetch if opening
const handleToggleComments = () => {
  if (!showComments) fetchComments();
  setShowComments(prev => !prev);
};

// Post a new comment and refresh comments
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

// Confirm and delete a comment, then refresh
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

// Confirm and delete user's own post, then refresh
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

// Update post and refresh on success
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

// Open edit modal with current post data
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
          <div className='reowj'>
            {post.author[0].toUpperCase()}
          </div>
        )}
        <p className='aqdri' onClick={() => navigate(`/profile/${post.author}`)} onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.textDecoration = 'underline'; }} onMouseLeave={e => { e.target.style.color = '#777'; e.target.style.textDecoration = 'none'; }}>
          by {post.author}
        </p>
      </div>
      <button className='mxvfy' onClick={handleToggleComments}>
        {showComments ? '▲ Hide comments' : '▼ Comments'}
      </button>
      {showComments && (
        <div className='enrfv'>
          {loadingComments && (
            <p className='weqik'>Loading...</p>
          )}
          {!loadingComments && comments.length === 0 && (
            <p className='jciyt'>No comments yet.</p>
          )}
          {comments.map(comment => (
            <div className='gokpd' key={comment.id}>
              <div className='wkpvc'>
                <p className='vnwxd'>{comment.body}</p>
                <p className='otvhs'>by {comment.author} · {formatDate(comment.created_at)}</p>
              </div>
              {(isPrivileged || comment.author === currentUsername) && (
                <button className='grcsu' onClick={() => handleDeleteComment(comment.id)}>🗑</button>
              )}
            </div>
          ))}
          <div className='rbxfv'>
            <input className='fvmwp' value={commentBody} onChange={e => setCommentBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePostComment()} placeholder='Write a comment...'/>
            <button className="modal-btn primary" onClick={handlePostComment}>Post</button>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className='dohwu'>
          <div className='keolb'>
            <h2 className='rnhpw'>Edit Post</h2>
            {editError && (
              <p className='dopgf'>{editError}</p>
            )}
            <div className='cnsfj'>
              <label className='vcauh'>Title</label>
              <input className='nevdg' value={editTitle} onChange={e => setEditTitle(e.target.value)}/>
            </div>
            <div className='cekaq'>
              <label className='qwbco'>Body</label>
              <textarea className='dmtau' value={editBody} onChange={e => setEditBody(e.target.value)} rows={5}/>
            </div>
            <div className='mlaoc'>
              <button className="modal-btn" onClick={() => { setShowEditModal(false); setEditError(''); }}>Cancel</button>
              <button className="modal-btn primary" onClick={handleEditPost}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

// Redirect unauthenticated users to the login page on mount
useEffect(() => {
  if (!token) navigate('/login', { replace: true });
}, []);

// Fetch posts, optionally filtered by category
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

// Search posts or reset to category if query is empty
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

// Debounce search input: triggers handleSearch after 300ms of inactivity
useEffect(() => {
  const delay = setTimeout(() => handleSearch(searchQuery), 300);
  // Clear timeout if searchQuery changes before the delay expires
  return () => clearTimeout(delay);
}, [searchQuery]);

// Re-fetch posts when activeCategory changes, provided a search is not in progress
useEffect(() => {
  if (!isSearching) fetchPosts(activeCategory);
}, [activeCategory]);

// Reset search and set active category
const handleCategoryClick = (cat) => {
  setSearchQuery('');
  setIsSearching(false);
  setActiveCategory(cat);
};

// Create a new post and refresh list
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

// Confirm and delete post, then refresh list
const handleDeletePost = async (id) => {
  if (!window.confirm('Delete this post?')) return;
  try {
    await axios.delete(`${BASE_URL}/api/posts/${id}`, { headers: authHeaders(token) });
    fetchPosts(activeCategory);
  } catch {
    alert('Failed to delete post.');
  }
};

// Toggle post pin status and refresh posts
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

// Clear auth data and redirect to login
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
            <button className={`${CAT_CLASSES[i]}${activeCategory === cat && !isSearching ? ' rkbva' : ''}`} key={cat} onClick={() => handleCategoryClick(cat)}>
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
        <div className='frtlq'>
          <div className='isqto'>
            <h2 className='yfrkw'>Create Post</h2>
            {error && (
              <p className='nfeiu'>{error}</p>
            )}
            <div className='blonf'>
              <label className='cflxr'>Category</label>
              <select className='pqaue' value={postCategory} onChange={e => setPostCategory(e.target.value)}>
                {CATEGORIES.filter(c => c !== 'All Posts').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className='gemai'>
              <label className='ilegu'>Title</label>
              <input className='ancrh' value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder='Post title...'/>
            </div>
            <div className='itvos'>
              <label className='xluao'>Body</label>
              <textarea className='emwlh' value={postBody} onChange={e => setPostBody(e.target.value)} placeholder='Write your post...' rows={5}/>
            </div>
            <div className='kewbi'>
              <button className="modal-btn" onClick={() => { setShowModal(false); setError(''); }}>Cancel</button>
              <button className="modal-btn primary" onClick={handleCreatePost}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;