import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Get user profile and their posts
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user info
    const userInfo = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(user.userId);
    
    // Get user's posts (most recent first)
    const posts = db.prepare(`
      SELECT * FROM posts 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(user.userId);

    const postsWithTags = posts.map(post => ({
      ...post,
      tags: post.tags ? post.tags.split(',') : []
    }));

    return NextResponse.json({ user: userInfo, posts: postsWithTags });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// Update username
export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { username } = await request.json();

    if (!username || username.trim().length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    // Check if username is taken by another user
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, user.userId);
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, user.userId);

    const updatedUser = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(user.userId);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
