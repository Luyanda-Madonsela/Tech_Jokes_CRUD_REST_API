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
      .prepare('SELECT id, username, is_admin FROM users WHERE id = ?')
      .get(authUser.userId);

    if (!currentUser || Number(currentUser.is_admin) !== 1) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const userId = Number(params.id);
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    if (userId === Number(currentUser.id)) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const targetUser = db
      .prepare('SELECT id, username, is_admin FROM users WHERE id = ?')
      .get(userId);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (Number(targetUser.is_admin) === 1) {
      return NextResponse.json({ error: 'Cannot delete another admin account' }, { status: 400 });
    }

    const deleteUserTx = db.transaction((id) => {
      db.prepare('DELETE FROM votes WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM votes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)').run(id);
      db.prepare('DELETE FROM posts WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });

    deleteUserTx(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
