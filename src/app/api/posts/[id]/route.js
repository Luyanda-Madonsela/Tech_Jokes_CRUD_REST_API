import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Update a post
export async function PUT(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const postId = parseInt(params.id);
    const { title, content, interest } = await request.json();

    // Check if post exists and belongs to user
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post.user_id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to edit this post' }, { status: 403 });
    }

    // Update post with edited flag
    db.prepare(`
      UPDATE posts 
      SET title = ?, content = ?, interest = ?, edited = 1, edited_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title || post.title, content || post.content, interest || post.interest, postId);

    const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

    return NextResponse.json({
      ...updatedPost,
      tags: updatedPost.tags ? updatedPost.tags.split(',') : []
    });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// Delete a post
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const postId = parseInt(params.id);

    // Check if post exists and belongs to user
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post.user_id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
    }

    // Delete votes first (foreign key constraint)
    db.prepare('DELETE FROM votes WHERE post_id = ?').run(postId);
    // Delete post
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
