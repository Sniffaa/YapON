const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make uploads folder if it doesn't exist
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// Multer config — save to /uploads, only allow images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected');
});

// ── Middleware ────────────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  db.query('SELECT banned FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: 'User not found' });
    if (results[0].banned) return res.status(403).json({ error: 'Your account has been banned.' });
    next();
  });
}

function adminMiddleware(req, res, next) {
  const allowed = ['owner', 'admin'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

function ownerMiddleware(req, res, next) {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

// ── Register ──────────────────────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    username = username.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY')
            return res.status(400).json({ error: 'Username already exists' });
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Registered successfully' });
      }
    );
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  let { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  username = username.toLowerCase();

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.banned) return res.status(403).json({ error: 'Your account has been banned.' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, username: user.username, role: user.role });
  });
});

// ── Posts ─────────────────────────────────────────────────────────────────────

app.get('/api/posts', authMiddleware, (req, res) => {
  const { category } = req.query;

  let query = `
    SELECT p.id, p.title, p.body, p.category, p.created_at, p.pinned, p.edited, u.username AS author, u.avatar AS author_avatar
    FROM posts p
    JOIN users u ON u.id = p.author_id
  `;
  const params = [];

  if (category && category !== 'All Posts') {
    query += ' WHERE p.category = ?';
    params.push(category);
  }

  query += ' ORDER BY p.pinned DESC, p.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch posts' });
    res.json({ posts: results });
  });
});

app.post('/api/posts', authMiddleware, (req, res) => {
  const { title, body, category } = req.body;
  const author_id = req.user.id;

  if (!title || !body)
    return res.status(400).json({ error: 'Title and body are required' });

  const safeCategory = category || 'General';

  db.query(
    'INSERT INTO posts (title, body, author_id, category) VALUES (?, ?, ?, ?)',
    [title, body, author_id, safeCategory],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to create post' });
      res.status(201).json({
        message: 'Post created',
        post: { id: result.insertId, title, body, category: safeCategory, author_id }
      });
    }
  );
});

app.delete('/api/posts/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.query('DELETE FROM posts WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete post' });
    res.json({ message: 'Post deleted' });
  });
});

app.patch('/api/posts/:id/pin', authMiddleware, adminMiddleware, (req, res) => {
  const { pinned } = req.body;
  db.query('UPDATE posts SET pinned = ? WHERE id = ?', [pinned ? 1 : 0, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update post' });
    res.json({ message: 'Post updated' });
  });
});

// ── Comments ──────────────────────────────────────────────────────────────────

app.get('/api/posts/:id/comments', authMiddleware, (req, res) => {
  db.query(
    `SELECT c.id, c.body, c.created_at, u.username AS author
     FROM comments c
     JOIN users u ON u.id = c.author_id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch comments' });
      res.json({ comments: results });
    }
  );
});

app.post('/api/posts/:id/comments', authMiddleware, (req, res) => {
  const { body } = req.body;
  const author_id = req.user.id;
  const post_id = req.params.id;

  if (!body || !body.trim())
    return res.status(400).json({ error: 'Comment cannot be empty' });

  db.query(
    'INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)',
    [post_id, author_id, body],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to post comment' });
      res.status(201).json({ message: 'Comment posted', id: result.insertId });
    }
  );
});

app.delete('/api/comments/:id', authMiddleware, (req, res) => {
  const isPrivileged = ['owner', 'admin'].includes(req.user.role);

  if (isPrivileged) {
    db.query('DELETE FROM comments WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete comment' });
      res.json({ message: 'Comment deleted' });
    });
  } else {
    db.query(
      'DELETE FROM comments WHERE id = ? AND author_id = ?',
      [req.params.id, req.user.id],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to delete comment' });
        if (result.affectedRows === 0)
          return res.status(403).json({ error: 'You can only delete your own comments' });
        res.json({ message: 'Comment deleted' });
      }
    );
  }
});

// ── Search ────────────────────────────────────────────────────────────────────

app.get('/api/search', authMiddleware, (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json({ posts: [] });

  const term = `%${q.trim()}%`;

  db.query(
    `SELECT p.id, p.title, p.body, p.category, p.created_at, p.pinned, u.username AS author, u.avatar AS author_avatar
     FROM posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.title LIKE ? OR p.body LIKE ?
     ORDER BY p.pinned DESC, p.created_at DESC`,
    [term, term],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Search failed' });
      res.json({ posts: results });
    }
  );
});

// ── Profile ───────────────────────────────────────────────────────────────────

app.get('/api/profile/:username', authMiddleware, (req, res) => {
  const username = req.params.username.toLowerCase();

  db.query(
    'SELECT id, username, role, bio, avatar, created_at FROM users WHERE username = ?',
    [username],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length === 0) return res.status(404).json({ error: 'User not found' });

      const user = results[0];

      db.query(
        `SELECT p.id, p.title, p.body, p.category, p.created_at, p.pinned
         FROM posts p WHERE p.author_id = ?
         ORDER BY p.created_at DESC`,
        [user.id],
        (err, posts) => {
          if (err) return res.status(500).json({ error: 'Database error' });

          db.query(
            'SELECT COUNT(*) AS count FROM comments WHERE author_id = ?',
            [user.id],
            (err, commentResult) => {
              if (err) return res.status(500).json({ error: 'Database error' });

              res.json({
                user: {
                  username: user.username,
                  role: user.role,
                  bio: user.bio,
                  avatar: user.avatar,
                  created_at: user.created_at,
                  post_count: posts.length,
                  comment_count: commentResult[0].count,
                },
                posts,
              });
            }
          );
        }
      );
    }
  );
});

app.patch('/api/profile/bio', authMiddleware, (req, res) => {
  const { bio } = req.body;
  if (bio && bio.length > 500)
    return res.status(400).json({ error: 'Bio must be under 500 characters' });

  db.query(
    'UPDATE users SET bio = ? WHERE id = ?',
    [bio || null, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update bio' });
      res.json({ message: 'Bio updated' });
    }
  );
});

// Upload avatar
app.post('/api/profile/avatar', authMiddleware, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `/uploads/${req.file.filename}`;

    db.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarUrl, req.user.id],
      (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save avatar' });
        res.json({ message: 'Avatar updated', avatar: avatarUrl });
      }
    );
  });
});

// ── Users (owner only) ────────────────────────────────────────────────────────

app.get('/api/users', authMiddleware, ownerMiddleware, (req, res) => {
  db.query('SELECT id, username, role, banned, created_at FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json({ users: results });
  });
});

app.delete('/api/users/:id', authMiddleware, ownerMiddleware, (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete user' });
    res.json({ message: 'User deleted' });
  });
});

app.patch('/api/users/:id/role', authMiddleware, ownerMiddleware, (req, res) => {
  const { role } = req.body;
  const allowed = ['admin', 'user'];
  if (!allowed.includes(role))
    return res.status(400).json({ error: 'Invalid role' });

  db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update role' });
    res.json({ message: 'Role updated' });
  });
});

app.patch('/api/users/:id/ban', authMiddleware, ownerMiddleware, (req, res) => {
  const { banned } = req.body;
  db.query('UPDATE users SET banned = ? WHERE id = ?', [banned ? 1 : 0, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update ban status' });
    res.json({ message: banned ? 'User banned' : 'User unbanned' });
  });
});

// ── Wipe Database (owner only) ────────────────────────────────────────────────

app.delete('/api/admin/wipe', authMiddleware, ownerMiddleware, (req, res) => {
  db.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
    if (err) return res.status(500).json({ error: 'Failed to disable key checks' });
    db.query('DELETE FROM comments', (err) => {
      if (err) return res.status(500).json({ error: 'Failed to wipe comments' });
      db.query('DELETE FROM posts', (err) => {
        if (err) return res.status(500).json({ error: 'Failed to wipe posts' });
        db.query("DELETE FROM users WHERE role != 'owner'", (err) => {
          if (err) return res.status(500).json({ error: 'Failed to wipe users' });
          db.query('SET FOREIGN_KEY_CHECKS = 1', () => {
            res.json({ message: 'Database wiped' });
          });
        });
      });
    });
  });
});

const PORT = process.env.PORT || 5000;

// Edit own post
app.patch('/api/posts/:id', authMiddleware, (req, res) => {
  const { title, body } = req.body;
  if (!title || !body)
    return res.status(400).json({ error: 'Title and body are required' });

  db.query(
    'SELECT author_id FROM posts WHERE id = ?',
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length === 0) return res.status(404).json({ error: 'Post not found' });
      if (results[0].author_id !== req.user.id)
        return res.status(403).json({ error: 'You can only edit your own posts' });

      db.query(
        'UPDATE posts SET title = ?, body = ?, edited = 1 WHERE id = ?',
        [title, body, req.params.id],
        (err) => {
          if (err) return res.status(500).json({ error: 'Failed to edit post' });
          res.json({ message: 'Post updated' });
        }
      );
    }
  );
});

// Delete own post
app.delete('/api/posts/:id/own', authMiddleware, (req, res) => {
  db.query(
    'SELECT author_id FROM posts WHERE id = ?',
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length === 0) return res.status(404).json({ error: 'Post not found' });
      if (results[0].author_id !== req.user.id)
        return res.status(403).json({ error: 'You can only delete your own posts' });

      db.query('DELETE FROM posts WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete post' });
        res.json({ message: 'Post deleted' });
      });
    }
  );
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));