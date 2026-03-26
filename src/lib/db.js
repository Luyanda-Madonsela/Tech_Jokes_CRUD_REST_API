import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { mkdirSync, existsSync } from 'fs';

const defaultDbPath = path.join(process.cwd(), 'data', 'crackagag.db');
const dbPath = process.env.DB_PATH || defaultDbPath;

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('joke', 'clip')),
    title TEXT NOT NULL,
    content TEXT,
    media TEXT,
    interest TEXT NOT NULL,
    tags TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    edited INTEGER DEFAULT 0,
    edited_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
  CREATE INDEX IF NOT EXISTS idx_posts_interest ON posts(interest);
  CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(upvotes DESC);
  CREATE INDEX IF NOT EXISTS idx_votes_user_post ON votes(user_id, post_id);
`);

// Add edited columns if they don't exist (migration)
try {
  db.exec('ALTER TABLE posts ADD COLUMN edited INTEGER DEFAULT 0');
} catch (e) { /* column already exists */ }
try {
  db.exec('ALTER TABLE posts ADD COLUMN edited_at DATETIME');
} catch (e) { /* column already exists */ }
try {
  db.exec('ALTER TABLE votes ADD COLUMN hilarity_level INTEGER DEFAULT 5');
} catch (e) { /* column already exists */ }
try {
  db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
} catch (e) { /* column already exists */ }

// Ensure techguy always has admin rights
db.prepare('UPDATE users SET is_admin = 1 WHERE username = ?').run('techguy');

// Seed sample data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  
  db.prepare(`
    INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)
  `).run('techguy', 'techguy@example.com', hashedPassword, 1);
  
  db.prepare(`
    INSERT INTO users (username, email, password) VALUES (?, ?, ?)
  `).run('codewizard', 'codewizard@example.com', hashedPassword);

  // Add sample posts
  const samplePosts = [
    {
      user_id: 1,
      type: 'joke',
      title: 'Why do programmers prefer dark mode?',
      content: 'Because light attracts bugs! Just like my code after midnight when I think I can fix "one small thing" before bed.',
      interest: 'Programming',
      tags: 'programming,code'
    },
    {
      user_id: 2,
      type: 'joke',
      title: 'The best thing about a Boolean',
      content: 'The best thing about a Boolean is that even if you\'re wrong, you\'re only off by a bit.',
      interest: 'Programming',
      tags: 'programming,code'
    },
    {
      user_id: 1,
      type: 'joke',
      title: 'Cyber Security Expert\'s Password',
      content: 'A cyber security expert changed his password to "incorrect" so whenever he forgets it, the computer will say "Your password is incorrect".',
      interest: 'Cyber Security',
      tags: 'cybersecurity,password'
    },
    {
      user_id: 2,
      type: 'joke',
      title: 'AI taking over',
      content: 'My boss asked if I was worried about AI taking my job. I said no, I\'ve been training AI for years by clicking on traffic lights and crosswalks.',
      interest: 'AI/ Machine Learning',
      tags: 'ai,machinelearning'
    }
  ];

  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, type, title, content, interest, tags, upvotes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  samplePosts.forEach((post, index) => {
    insertPost.run(post.user_id, post.type, post.title, post.content, post.interest, post.tags, Math.floor(Math.random() * 15000));
  });
}

export default db;
