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
    const { hilarityLevel } = await request.json();
    const parsedLevel = Number(hilarityLevel);

    if (!Number.isInteger(parsedLevel) || parsedLevel < 1 || parsedLevel > 5) {
      return NextResponse.json({ error: 'Invalid hilarity level' }, { status: 400 });
    }

    const voteType = parsedLevel >= 3 ? 'up' : 'down';
    
    // Check if post exists
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Check existing vote
    const existingVote = db.prepare('SELECT * FROM votes WHERE user_id = ? AND post_id = ?').get(user.userId, postId);
    
    if (existingVote) {
      const existingLevel = Number(existingVote.hilarity_level || (existingVote.vote_type === 'up' ? 5 : 1));

      if (existingVote.vote_type === voteType && existingLevel === parsedLevel) {
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
          userVote: null,
          userHilarityLevel: null
        });
      } else {
        // Change vote and/or hilarity level
        db.prepare('UPDATE votes SET vote_type = ?, hilarity_level = ? WHERE id = ?').run(voteType, parsedLevel, existingVote.id);
        
        if (existingVote.vote_type !== voteType) {
          if (voteType === 'up') {
            db.prepare('UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?').run(postId);
          } else {
            db.prepare('UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?').run(postId);
          }
        }
        
        const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
        return NextResponse.json({ 
          upvotes: updatedPost.upvotes, 
          downvotes: updatedPost.downvotes,
          userVote: voteType,
          userHilarityLevel: parsedLevel
        });
      }
    } else {
      // New vote
      db.prepare('INSERT INTO votes (user_id, post_id, vote_type, hilarity_level) VALUES (?, ?, ?, ?)').run(user.userId, postId, voteType, parsedLevel);
      
      if (voteType === 'up') {
        db.prepare('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?').run(postId);
      } else {
        db.prepare('UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?').run(postId);
      }
      
      const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
      return NextResponse.json({ 
        upvotes: updatedPost.upvotes, 
        downvotes: updatedPost.downvotes,
        userVote: voteType,
        userHilarityLevel: parsedLevel
      });
    }
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
