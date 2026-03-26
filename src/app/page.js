'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Pencil, ArrowUp, ArrowDown, Share2, ArrowLeft, ChevronDown, User, Trash2, Edit3 } from 'lucide-react';

const INTERESTS = [
  'Programming',
  'Cyber Security',
  'AI/ Machine Learning',
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
  const [selectedInterest, setSelectedInterest] = useState('Programming');
  const [sortBy, setSortBy] = useState('trending');
  const [showAddPost, setShowAddPost] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile state
  const [profilePosts, setProfilePosts] = useState([]);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editPostForm, setEditPostForm] = useState({ title: '', content: '', interest: '' });

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

  const getAuthToken = () => token || localStorage.getItem('token');

  // Profile functions
  const fetchProfile = async () => {
    const currentToken = getAuthToken();
    if (!currentToken) return;
    try {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfilePosts(data.posts);
      } else if (res.status === 401) {
        setShowAuth(true);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleShowProfile = () => {
    setShowProfile(true);
    setShowAddPost(false);
    fetchProfile();
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.length < 3) {
      alert('Username must be at least 3 characters');
      return;
    }
    const currentToken = getAuthToken();
    if (!currentToken) {
      setShowAuth(true);
      return;
    }
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify({ username: newUsername })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setEditingUsername(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update username');
      }
    } catch (error) {
      console.error('Update username failed:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const currentToken = getAuthToken();
    if (!currentToken) {
      setShowAuth(true);
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        setProfilePosts(profilePosts.filter(p => p.id !== postId));
        fetchPosts(); // Refresh main posts list
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.error || 'Failed to delete post');
        if (res.status === 401) {
          setShowAuth(true);
        }
      }
    } catch (error) {
      console.error('Delete post failed:', error);
      alert('Delete request failed. Please try again.');
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditPostForm({ title: post.title, content: post.content || '', interest: post.interest });
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    const currentToken = getAuthToken();
    if (!currentToken) {
      setShowAuth(true);
      return;
    }
    try {
      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify(editPostForm)
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setProfilePosts(profilePosts.map(p => p.id === editingPost.id ? updatedPost : p));
        setEditingPost(null);
        fetchPosts(); // Refresh main posts list
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.error || 'Failed to update post');
        if (res.status === 401) {
          setShowAuth(true);
        }
      }
    } catch (error) {
      console.error('Edit post failed:', error);
      alert('Update request failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f1e]" data-testid="main-container">
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 md:px-6 py-3 border-b border-[#1e2140] bg-[#0d0f1e]" data-testid="header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
              data-testid="mobile-menu-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <img 
              src="https://customer-assets.emergentagent.com/job_joke-vault-app/artifacts/6z202jm3_Component%207.png" 
              alt="CRACK-A-GAG - laugh and learn tech" 
              className="h-12 md:h-16 object-contain"
            />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <>
                <button 
                  onClick={handleShowProfile}
                  className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm text-gray-300 hover:text-white border border-[#3d4270] rounded-full hover:border-[#5a6aff] transition-all"
                  data-testid="profile-btn"
                >
                  <User size={16} />
                  <span className="hidden md:inline">{user.username}</span>
                </button>
                <button 
                  onClick={handleShowProfile}
                  className="sm:hidden p-2 text-gray-300 hover:text-white border border-[#3d4270] rounded-full hover:border-[#5a6aff] transition-all"
                  data-testid="profile-mobile-btn"
                >
                  <User size={16} />
                </button>
                <button 
                  onClick={handleLogout}
                  className="hidden sm:block px-3 md:px-5 py-2 text-xs md:text-sm text-gray-300 hover:text-white border border-[#3d4270] rounded-full hover:border-[#5a6aff] transition-all"
                  data-testid="logout-btn"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setIsLogin(true); setShowAuth(true); }}
                  className="hidden sm:block px-3 md:px-5 py-2 text-xs md:text-sm text-gray-300 hover:text-white border border-[#3d4270] rounded-full hover:border-[#5a6aff] transition-all"
                  data-testid="signin-btn"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setIsLogin(false); setShowAuth(true); }}
                  className="px-3 md:px-5 py-2 text-xs md:text-sm text-white bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  data-testid="signup-btn"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-[72px]">
        {/* Sidebar - Fixed on Desktop, Toggle on Mobile */}
        <aside 
          className={`fixed top-[72px] left-0 bottom-0 w-64 px-5 py-5 overflow-y-auto bg-[#0d0f1e] border-r border-[#1e2140] transition-transform duration-300 z-30 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:relative md:top-0`}
          data-testid="sidebar"
        >
          <nav className="space-y-2">
            <div 
              className={`flex items-center gap-3 py-2 cursor-pointer transition-colors text-sm ${sortBy === 'trending' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setSortBy('trending'); setSelectedInterest(null); setSidebarOpen(false); }}
              data-testid="trending-nav"
            >
              <TrendingUp size={18} />
              <span>Trending</span>
            </div>
            <div 
              className={`flex items-center gap-3 py-2 cursor-pointer transition-colors text-sm ${sortBy === 'top' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setSortBy('top'); setSelectedInterest(null); setSidebarOpen(false); }}
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
                  onClick={() => { setSelectedInterest(selectedInterest === interest ? null : interest); setSidebarOpen(false); }}
                  data-testid={`interest-${interest.toLowerCase().replace(/[^a-z]/g, '-')}`}
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - Scrollable */}
        <main className="flex-1 w-full md:ml-0 min-h-[calc(100vh-72px)]" data-testid="main-content">
          {showProfile ? (
            /* Profile View */
            <div className="pt-6 md:pt-8 px-4 md:px-8 pb-8" data-testid="profile-view">
              <div className="flex items-center mb-6 md:mb-8">
                <button 
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowProfile(false)}
                  data-testid="profile-back-btn"
                >
                  <ArrowLeft size={24} />
                  <span className="text-lg">Back</span>
                </button>
                <h2 className="text-xl md:text-2xl font-semibold text-white flex-1 text-center pr-6 md:pr-20">My Profile</h2>
              </div>

              {/* Username Section */}
              <div className="w-full md:max-w-2xl md:mx-auto mb-8 p-4 md:p-6 bg-[#171932] rounded-lg border border-[#2d3154]">
                <h3 className="text-lg font-medium text-white mb-4">Username</h3>
                {editingUsername ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5a6aff]"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username"
                      data-testid="new-username-input"
                    />
                    <button
                      onClick={handleUpdateUsername}
                      className="px-4 py-2 bg-[#5a6aff] text-white rounded-md text-sm hover:bg-[#4f5de0] transition-colors whitespace-nowrap"
                      data-testid="save-username-btn"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingUsername(false)}
                      className="px-4 py-2 border border-[#3d4270] text-gray-400 rounded-md text-sm hover:text-white transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <span className="text-gray-300 text-lg">@{user?.username}</span>
                    <button
                      onClick={() => { setNewUsername(user?.username || ''); setEditingUsername(true); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-[#3d4270] rounded-md hover:border-[#5a6aff] transition-all whitespace-nowrap"
                      data-testid="edit-username-btn"
                    >
                      <Edit3 size={14} />
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* User Posts */}
              <div className="w-full md:max-w-2xl md:mx-auto">
                <h3 className="text-lg font-medium text-white mb-4">My Posts ({profilePosts.length})</h3>
                
                {profilePosts.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    You haven't posted anything yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profilePosts.map((post) => (
                      <div key={post.id} className="p-4 bg-[#171932] rounded-lg border border-[#2d3154]" data-testid={`profile-post-${post.id}`}>
                        {editingPost?.id === post.id ? (
                          /* Edit Mode */
                          <div className="space-y-3">
                            <input
                              type="text"
                              className="w-full bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5a6aff]"
                              value={editPostForm.title}
                              onChange={(e) => setEditPostForm({ ...editPostForm, title: e.target.value })}
                              placeholder="Title"
                            />
                            <textarea
                              className="w-full bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5a6aff] min-h-[80px]"
                              value={editPostForm.content}
                              onChange={(e) => setEditPostForm({ ...editPostForm, content: e.target.value })}
                              placeholder="Content"
                            />
                            <select
                              className="w-full bg-[#0d0f1e] border border-[#3d4270] rounded-md px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5a6aff]"
                              value={editPostForm.interest}
                              onChange={(e) => setEditPostForm({ ...editPostForm, interest: e.target.value })}
                            >
                              {INTERESTS.filter((v, i, a) => a.indexOf(v) === i).map((interest) => (
                                <option key={interest} value={interest}>{interest}</option>
                              ))}
                            </select>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-[#5a6aff] text-white rounded-md text-sm hover:bg-[#4f5de0] transition-colors"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setEditingPost(null)}
                                className="px-4 py-2 border border-[#3d4270] text-gray-400 rounded-md text-sm hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <>
                            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <h4 className="text-white font-medium break-words">
                                  {post.title}
                                  {post.edited === 1 && <span className="text-gray-500 text-sm ml-2">(edited)</span>}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {post.type === 'joke' ? 'Joke' : 'Clip'} • {post.interest} • {new Date(post.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleEditPost(post)}
                                  className="p-2 text-gray-400 hover:text-[#5a6aff] transition-colors"
                                  data-testid={`edit-post-${post.id}`}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                  data-testid={`delete-post-${post.id}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {post.content && (
                              <p className="text-gray-400 text-sm break-words">{post.content}</p>
                            )}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{post.upvotes} upvotes</span>
                              <span>{post.downvotes} downvotes</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : !showAddPost ? (
            <>
              {/* Fixed Tabs Section */}
              <div className="sticky top-[72px] z-30 bg-[#0d0f1e] px-4 md:px-8 pt-6 md:pt-8 pb-4">
                {/* Tabs and Post Button */}
                <div className="flex items-center justify-between gap-4 mb-2 w-full md:max-w-2xl md:mx-auto">
                  <div className="flex gap-4 md:gap-6">
                    <span
                      className={`text-lg md:text-xl font-medium cursor-pointer pb-1 border-b-2 transition-all ${activeTab === 'jokes' ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-white'}`}
                      onClick={() => setActiveTab('jokes')}
                      data-testid="jokes-tab"
                    >
                      Jokes
                    </span>
                    <span
                      className={`text-lg md:text-xl font-medium cursor-pointer pb-1 border-b-2 transition-all ${activeTab === 'clips' ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-white'}`}
                      onClick={() => setActiveTab('clips')}
                      data-testid="clips-tab"
                    >
                      Clips
                    </span>
                  </div>
                  <button 
                    className="bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] px-5 py-2 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                    onClick={handlePostClick}
                    data-testid="post-btn"
                  >
                    <Pencil size={14} />
                    Post
                  </button>
                </div>

                {/* Current Interest Tag */}
                {selectedInterest && (
                  <p className="text-[#6b7cff] text-sm w-full md:max-w-2xl md:mx-auto" data-testid="current-interest">#{selectedInterest}</p>
                )}
              </div>

              {/* Posts - Scrollable */}
              <div className="px-4 md:px-8 py-5 pb-8">
                <div className="space-y-6 w-full md:max-w-2xl md:mx-auto" data-testid="posts-container">
                {posts.length === 0 ? (
                  <div className="text-center text-gray-500 py-12 text-sm" data-testid="no-posts">
                    No {activeTab} found. Be the first to post!
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="pb-5 border-b border-[#252850]" data-testid={`post-${post.id}`}>
                      {/* Post Header - Title and Meta */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1">
                        <h3 className="text-white font-medium text-base break-words">
                          {post.title}
                          {post.edited === 1 && <span className="text-gray-500 text-xs ml-2">(edited)</span>}
                        </h3>
                      </div>
                      
                      {/* Post Meta - User, Date, Time */}
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-3 text-gray-400 text-xs">
                        <span className="text-[#6b7cff] font-medium">@{post.username}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="hidden sm:inline">•</span>
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
                          <div className="h-32 md:h-40 flex items-center justify-center text-gray-500 text-sm">
                            Image
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      {post.content && (
                        <p className="text-gray-300 text-sm leading-relaxed mb-3 break-words">{post.content}</p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
            <div className="pt-6 md:pt-8 px-4 md:px-8 pb-8" data-testid="add-post-form">
              <div className="flex items-center mb-6 md:mb-8">
                <button 
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowAddPost(false)}
                  data-testid="back-btn"
                >
                  <ArrowLeft size={24} />
                  <span className="text-lg">Back</span>
                </button>
                <h2 className="text-xl md:text-2xl font-semibold text-white flex-1 text-center pr-6 md:pr-20">Add a post</h2>
              </div>

              <form onSubmit={handleCreatePost} className="w-full max-w-xs md:max-w-md mx-auto space-y-4">
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
                    className="w-full md:w-auto bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] px-6 py-2.5 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAuth(false)} data-testid="auth-modal">
          <div className="bg-[#171932] border border-[#2d3154] rounded-xl p-6 md:p-8 w-full max-w-xs md:max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg md:text-xl font-semibold text-white text-center mb-6">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
            
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
