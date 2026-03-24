# CRACK-A-GAG - Tech Jokes App PRD

## Original Problem Statement
Build a tech jokes app called CRACK-A-GAG with UI matching provided design images. Implement SQLite database for data persistence.

## User Requirements
1. **Content Types**: Both Jokes (with images) and Clips (with videos)
2. **User Authentication**: Required login to post content
3. **Voting System**: Persistent per-user vote tracking (prevent duplicates)
4. **Media Storage**: Base64 encoding in SQLite database
5. **UI Design**: Must look identical to provided images

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## User Personas
1. **Tech Enthusiast** - Browses and votes on tech jokes/clips
2. **Content Creator** - Registers to post jokes and clips

## Core Features Implemented
- [x] Dark theme UI matching design exactly
- [x] CRACK-A-GAG header with logo and emoji
- [x] Sidebar navigation (Trending, Top Ranked, Interests)
- [x] 12 Interest categories for filtering
- [x] Jokes/Clips tab switching
- [x] Post cards with image placeholder, tags, vote buttons, share
- [x] User registration and login
- [x] Add Post form (Interest dropdown, Title, Upload, Main Text)
- [x] Upvote/Downvote with per-user tracking
- [x] SQLite database with users, posts, votes tables
- [x] Base64 media storage

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/posts` - Get posts (with type, interest, sort filters)
- `POST /api/posts` - Create new post (authenticated)
- `POST /api/posts/[id]/vote` - Vote on post (authenticated)
- `GET /api/interests` - Get interest categories

## Database Schema
```sql
users: id, username, email, password, created_at
posts: id, user_id, type, title, content, media, interest, tags, upvotes, downvotes, created_at
votes: id, user_id, post_id, vote_type, created_at (unique user_id + post_id)
```

## What's Been Implemented (March 24, 2026)
- Complete MVP with all core features
- UI matching provided design images
- SQLite database integration
- User authentication with JWT
- Voting system with duplicate prevention
- Sample tech jokes seeded in database

## Prioritized Backlog
### P0 (Next)
- None - MVP complete

### P1 (Soon)
- Share functionality (copy link, social sharing)
- Edit/Delete own posts
- User profile page
- Comment system

### P2 (Later)
- Search functionality
- Bookmark/Save posts
- Tag management
- Pagination for posts

## Next Steps
1. Add share functionality (clipboard copy, social links)
2. Implement post editing/deletion for authors
3. Add user profiles with post history
