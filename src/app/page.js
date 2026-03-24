'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Pencil, ArrowUp, ArrowDown, Share2, ArrowLeft, ChevronDown } from 'lucide-react';

const INTERESTS = [
  'Programming',
  'Cyber Security',
  'AI/ Machine Learning',
  'Programming',
  'Information Technology',
  'Robotics',
  'Computer Science',
  'Electronics',
  'Embedded Software',
  'History of Software',
  'Human Computer Interaction',
  'Frontend Development',
  'Backend Development'
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('jokes');
  const [posts, setPosts] = useState([]);
  const [selectedInterest, setSelectedInterest] = useState('Cyber Security');
  const [sortBy, setSortBy] = useState('trending');
  const [showAddPost, setShowAddPost] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auth form state
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Post form state
  const [postForm, setPostForm] = useState({
    type: 'joke',
    title: '',
    content: '',
    media: '',
    interest: 'Programming',
    tags: ''
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [activeTab, selectedInterest, sortBy, token]);

  const fetchPosts = async () => {
    try {
      const type = activeTab === 'jokes' ? 'joke' : 'clip';
      let url = `/api/posts?type=${type}&sort=${sortBy}`;
      if (selectedInterest) {
        url += `&interest=${encodeURIComponent(selectedInterest)}`;
      }
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed');
        return;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setShowAuth(false);
      setAuthForm({ username: '', email: '', password: '' });
    } catch (error) {
      setAuthError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleVote = async (postId, voteType) => {
    // Check both state and localStorage for token
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) {
      setShowAuth(true);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify({ voteType })
      });

      if (res.status === 401) {
        // Token expired or invalid
        setShowAuth(true);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote }
            : p
        ));
      }
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!token) {
      setShowAuth(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...postForm,
          type: activeTab === 'jokes' ? 'joke' : 'clip'
        })
      });

      if (res.ok) {
        setShowAddPost(false);
        setPostForm({ type: 'joke', title: '', content: '', media: '', interest: 'Programming', tags: '' });
        fetchPosts();
      }
    } catch (error) {
      console.error('Create post failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostForm({ ...postForm, media: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatVotes = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k';
    }
    return num.toString();
  };

  const handlePostClick = () => {
    if (!token) {
      setShowAuth(true);
    } else {
      setShowAddPost(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f1e]" data-testid="main-container">
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 border-b border-[#1e2140] bg-[#0d0f1e]" data-testid="header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="logo">
            <span className="font-mono font-bold text-2xl tracking-wider text-[#f5d742]" style={{textShadow: '1px 1px 0 #ff9800'}}>CRACK-A-GAG</span>
            <span className="text-3xl">👋😊</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-300">Hi, {user.username}</span>
                <button 
                  onClick={handleLogout}
                  className="px-5 py-2 text-sm text-gray-300 hover:text-white border border-[#3d4270] rounded-full hover:border-[#5a6aff] transition-all"
                  data-testid="logout-btn"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setIsLogin(true); setShowAuth(true); }}
                  className="px-5 py-2 text-sm text-gray-300 hover:text-white border border-[#3d4270] rounded-full hover:border-[#5a6aff] transition-all"
                  data-testid="signin-btn"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setIsLogin(false); setShowAuth(true); }}
                  className="px-5 py-2 text-sm text-white bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  data-testid="signup-btn"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-[10px] text-[#ff5722] tracking-wide mt-1">laugh and learn tech</p>
      </header>

      <div className="flex pt-[72px]">
        {/* Sidebar - Fixed */}
        <aside className="fixed top-[72px] left-0 bottom-0 w-64 px-5 py-5 overflow-y-auto bg-[#0d0f1e] border-r border-[#1e2140]" data-testid="sidebar">
          <nav className="space-y-2">
            <div 
              className={`flex items-center gap-3 py-2 cursor-pointer transition-colors text-sm ${sortBy === 'trending' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setSortBy('trending')}
              data-testid="trending-nav"
            >
              <TrendingUp size={18} />
              <span>Trending</span>
            </div>
            <div 
              className={`flex items-center gap-3 py-2 cursor-pointer transition-colors text-sm ${sortBy === 'top' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setSortBy('top')}
              data-testid="top-ranked-nav"
            >
              <BarChart3 size={18} />
              <span>Top Ranked</span>
            </div>
          </nav>

          <div className="mt-6">
            <h3 className="text-white font-medium mb-3 text-sm">Interests</h3>
            <div className="space-y-1">
              {INTERESTS.map((interest, idx) => (
                <div
                  key={idx}
                  className={`py-1.5 pl-2 cursor-pointer transition-colors text-sm ${selectedInterest === interest ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setSelectedInterest(selectedInterest === interest ? null : interest)}
                  data-testid={`interest-${interest.toLowerCase().replace(/[^a-z]/g, '-')}`}
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content - Scrollable */}
        <main className="flex-1 ml-64 min-h-[calc(100vh-72px)]" data-testid="main-content">
          {!showAddPost ? (
            <>
              {/* Fixed Tabs Section */}
              <div className="sticky top-[72px] z-30 bg-[#0d0f1e] px-8 pt-8 pb-4">
                {/* Tabs and Post Button */}
                <div className="flex items-start justify-between mb-2 max-w-2xl mx-auto">
                  <div className="flex gap-6">
                    <span
                      className={`text-base font-medium cursor-pointer pb-1 border-b-2 transition-all ${activeTab === 'jokes' ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-white'}`}
                      onClick={() => setActiveTab('jokes')}
                      data-testid="jokes-tab"
                    >
                      Jokes
                    </span>
                    <span
                      className={`text-base font-medium cursor-pointer pb-1 border-b-2 transition-all ${activeTab === 'clips' ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-white'}`}
                      onClick={() => setActiveTab('clips')}
                      data-testid="clips-tab"
                    >
                      Clips
                    </span>
                  </div>
                  <button 
                    className="bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] px-5 py-2 rounded-full text-white font-medium text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                    onClick={handlePostClick}
                    data-testid="post-btn"
                  >
                    <Pencil size={14} />
                    Post
                  </button>
                </div>

                {/* Current Interest Tag */}
                {selectedInterest && (
                  <p className="text-[#6b7cff] text-sm max-w-2xl mx-auto" data-testid="current-interest">#{selectedInterest}</p>
                )}
              </div>

              {/* Posts - Scrollable */}
              <div className="px-8 py-5">
                <div className="space-y-6 max-w-2xl mx-auto" data-testid="posts-container">
                {posts.length === 0 ? (
                  <div className="text-center text-gray-500 py-12 text-sm" data-testid="no-posts">
                    No {activeTab} found. Be the first to post!
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="pb-5 border-b border-[#252850]" data-testid={`post-${post.id}`}>
                      {/* Post Header - Title and Meta */}
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium text-base">{post.title}</h3>
                      </div>
                      
                      {/* Post Meta - User, Date, Time */}
                      <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs">
                        <span className="text-[#6b7cff] font-medium">@{post.username}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {/* Media Area */}
                      <div className="w-full rounded-lg mb-3 overflow-hidden border border-[#252850] bg-[#12152a]">
                        {post.media ? (
                          post.type === 'clip' ? (
                            <video controls className="w-full">
                              <source src={post.media} />
                            </video>
                          ) : (
                            <img src={post.media} alt={post.title} className="w-full object-cover" />
                          )
                        ) : (
                          <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                            Image
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      {post.content && (
                        <p className="text-gray-300 text-sm leading-relaxed mb-3">{post.content}</p>
                      )}

                      {/* Tags */}
                      <div className="flex gap-2 mb-3">
                        {post.tags && post.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="px-4 py-1 rounded-full text-xs text-gray-300 border border-[#3d4270] bg-[#1a1d3a] hover:border-[#5a6aff] transition-colors cursor-pointer"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className={`p-1 transition-colors ${post.userVote === 'up' ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                            onClick={() => handleVote(post.id, 'up')}
                            data-testid={`upvote-${post.id}`}
                          >
                            <ArrowUp size={18} />
                          </button>
                          <span className="text-gray-400 text-sm">{formatVotes(post.upvotes)}</span>
                          <button
                            className={`p-1 transition-colors ${post.userVote === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                            onClick={() => handleVote(post.id, 'down')}
                            data-testid={`downvote-${post.id}`}
                          >
                            <ArrowDown size={18} />
                          </button>
                        </div>
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors" data-testid={`share-${post.id}`}>
                          <Share2 size={16} />
                          Share
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            </>
          ) : (
            /* Add Post Form */
            <div data-testid="add-post-form">
              <div className="flex items-center gap-5 mb-8">
                <button 
                  className="text-white hover:text-gray-300 transition-colors"
                  onClick={() => setShowAddPost(false)}
                  data-testid="back-btn"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-semibold text-white">Add Post</h2>
              </div>

              <form onSubmit={handleCreatePost} className="max-w-md mx-auto space-y-4">
                {/* Interest Dropdown */}
                <div className="relative">
                  <select
                    className="w-full bg-[#5a6aff] text-white px-4 py-2.5 rounded-md appearance-none cursor-pointer text-sm font-medium pr-10"
                    value={postForm.interest}
                    onChange={(e) => setPostForm({ ...postForm, interest: e.target.value })}
                    data-testid="interest-select"
                  >
                    <option value="">Interest</option>
                    {INTERESTS.filter((v, i, a) => a.indexOf(v) === i).map((interest) => (
                      <option key={interest} value={interest}>{interest}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16} />
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">Title</label>
                  <input
                    type="text"
                    className="w-full bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#5a6aff] transition-colors"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    required
                    data-testid="title-input"
                  />
                </div>

                {/* Upload Button */}
                <div>
                  <label className="block w-full bg-[#1a1d3a] border border-[#3d4270] rounded-md px-4 py-3 text-gray-400 text-sm text-center cursor-pointer hover:border-[#5a6aff] transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      accept={activeTab === 'jokes' ? 'image/*,image/gif' : 'video/*'}
                      onChange={handleMediaUpload}
                      data-testid="media-upload"
                    />
                    {activeTab === 'jokes' ? 'Upload Image' : 'Upload Clip'}
                  </label>
                  {postForm.media && (
                    <p className="text-sm text-green-500 mt-2 text-center">Media uploaded!</p>
                  )}
                </div>

                {/* Main Text - Only for Jokes */}
                {activeTab === 'jokes' && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-1.5">Main Text</label>
                    <textarea
                      className="w-full bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5a6aff] transition-colors min-h-[100px] resize-vertical"
                      value={postForm.content}
                      onChange={(e) => setPostForm({ ...postForm, content: e.target.value.slice(0, 500) })}
                      maxLength={500}
                      data-testid="content-textarea"
                    />
                    <p className="text-right text-xs text-gray-500 mt-1">{postForm.content.length}/500</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] px-6 py-2.5 rounded-full text-white font-medium text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                    disabled={loading}
                    data-testid="submit-post-btn"
                  >
                    <Pencil size={14} />
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAuth(false)} data-testid="auth-modal">
          <div className="bg-[#171932] border border-[#2d3154] rounded-xl p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white text-center mb-6">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
            
            {authError && (
              <p className="text-red-500 text-sm text-center mb-4" data-testid="auth-error">{authError}</p>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <input
                  type="text"
                  className="w-full bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#5a6aff] placeholder-gray-500"
                  placeholder="Username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  required={!isLogin}
                  data-testid="username-input"
                />
              )}
              <input
                type="email"
                className="w-full bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#5a6aff] placeholder-gray-500"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
                data-testid="email-input"
              />
              <input
                type="password"
                className="w-full bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#5a6aff] placeholder-gray-500"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
                data-testid="password-input"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] py-2.5 rounded-full text-white font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                disabled={loading}
                data-testid="auth-submit-btn"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                className="text-[#5a6aff] hover:underline"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError('');
                }}
                data-testid="toggle-auth-btn"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
