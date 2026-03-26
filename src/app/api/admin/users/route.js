import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
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

    const users = db
      .prepare('SELECT id, username, email, created_at, is_admin FROM users ORDER BY created_at DESC')
      .all();

    const posts = db
      .prepare('SELECT id, user_id, type, title, interest, created_at, upvotes, downvotes FROM posts ORDER BY created_at DESC')
      .all();

    const postsByUser = posts.reduce((acc, post) => {
      if (!acc[post.user_id]) acc[post.user_id] = [];
      acc[post.user_id].push(post);
      return acc;
    }, {});

    const usersWithPosts = users.map((user) => ({
      ...user,
      posts: postsByUser[user.id] || []
    }));

    return NextResponse.json({ users: usersWithPosts });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin dashboard data' }, { status: 500 });
  }
}
