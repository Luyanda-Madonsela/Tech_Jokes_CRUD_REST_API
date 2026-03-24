import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const postId = parseInt(params.id);
    const { voteType } = await request.json();
    
    if (!['up', 'down'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }
    
    // Check if post exists
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Check existing vote
    const existingVote = db.prepare('SELECT * FROM votes WHERE user_id = ? AND post_id = ?').get(user.userId, postId);
    
    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote (toggle off)
        db.prepare('DELETE FROM votes WHERE id = ?').run(existingVote.id);
        
        if (voteType === 'up') {
          db.prepare('UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?').run(postId);
        } else {
          db.prepare('UPDATE posts SET downvotes = downvotes - 1 WHERE id = ?').run(postId);
        }
        
        const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
        return NextResponse.json({ 
          upvotes: updatedPost.upvotes, 
          downvotes: updatedPost.downvotes,
          userVote: null 
        });
      } else {
        // Change vote
        db.prepare('UPDATE votes SET vote_type = ? WHERE id = ?').run(voteType, existingVote.id);
        
        if (voteType === 'up') {
          db.prepare('UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?').run(postId);
        } else {
          db.prepare('UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?').run(postId);
        }
        
        const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
        return NextResponse.json({ 
          upvotes: updatedPost.upvotes, 
          downvotes: updatedPost.downvotes,
          userVote: voteType 
        });
      }
    } else {
      // New vote
      db.prepare('INSERT INTO votes (user_id, post_id, vote_type) VALUES (?, ?, ?)').run(user.userId, postId, voteType);
      
      if (voteType === 'up') {
        db.prepare('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?').run(postId);
      } else {
        db.prepare('UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?').run(postId);
      }
      
      const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
      return NextResponse.json({ 
        upvotes: updatedPost.upvotes, 
        downvotes: updatedPost.downvotes,
        userVote: voteType 
      });
    }
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
