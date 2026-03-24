import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'joke';
    const interest = searchParams.get('interest');
    const sort = searchParams.get('sort') || 'trending';
    
    let query = 'SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.type = ?';
    const params = [type];
    
    if (interest) {
      query += ' AND p.interest = ?';
      params.push(interest);
    }
    
    if (sort === 'trending') {
      query += ' ORDER BY p.created_at DESC';
    } else if (sort === 'top') {
      query += ' ORDER BY p.upvotes DESC';
    }
    
    const posts = db.prepare(query).all(...params);
    
    // Get user votes if authenticated
    const user = getUserFromRequest(request);
    let userVotes = {};
    
    if (user) {
      const votes = db.prepare('SELECT post_id, vote_type FROM votes WHERE user_id = ?').all(user.userId);
      votes.forEach(v => {
        userVotes[v.post_id] = v.vote_type;
      });
    }
    
    const postsWithVotes = posts.map(post => ({
      ...post,
      tags: post.tags ? post.tags.split(',') : [],
      userVote: userVotes[post.id] || null
    }));
    
    return NextResponse.json(postsWithVotes);
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const { type, title, content, media, interest, tags } = await request.json();
    
    if (!type || !title || !interest) {
      return NextResponse.json({ error: 'Type, title, and interest are required' }, { status: 400 });
    }
    
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags || '';
    
    const result = db.prepare(`
      INSERT INTO posts (user_id, type, title, content, media, interest, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user.userId, type, title, content || '', media || '', interest, tagsString);
    
    const newPost = db.prepare('SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json({
      ...newPost,
      tags: newPost.tags ? newPost.tags.split(',') : []
    }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
