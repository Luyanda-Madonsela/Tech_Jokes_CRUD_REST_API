import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUser = db
      .prepare('SELECT id, is_admin FROM users WHERE id = ?')
      .get(authUser.userId);

    if (!currentUser || Number(currentUser.is_admin) !== 1) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const postId = Number(params.id);
    if (!Number.isInteger(postId)) {
      return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
    }

    const post = db
      .prepare('SELECT id, user_id, title FROM posts WHERE id = ?')
      .get(postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM votes WHERE post_id = ?').run(postId);
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    return NextResponse.json({ success: true, postId: post.id, userId: post.user_id });
  } catch (error) {
    console.error('Admin delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
