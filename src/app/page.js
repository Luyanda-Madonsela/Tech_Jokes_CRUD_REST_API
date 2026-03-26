'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Pencil, Share2, ArrowLeft, ChevronDown, User, Trash2, Edit3, Sun, Moon, Shield } from 'lucide-react';

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

const HILARITY_LEVELS = [
  { level: 1, emoji: '😅', label: 'Mild' },
  { level: 2, emoji: '😄', label: 'Funny' },
  { level: 3, emoji: '😆', label: 'Very Funny' },
  { level: 4, emoji: '😂', label: 'Hilarious' },
  { level: 5, emoji: '🤣', label: 'Legendary' }
];

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  return {
    ...rawUser,
    is_admin: Number(rawUser.is_admin ?? (rawUser.isAdmin ? 1 : 0))
  };
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('jokes');
  const [posts, setPosts] = useState([]);
  const [selectedInterest, setSelectedInterest] = useState('Programming');
  const [sortBy, setSortBy] = useState('trending');
  const [showAddPost, setShowAddPost] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Profile state
  const [profilePosts, setProfilePosts] = useState([]);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editPostForm, setEditPostForm] = useState({ title: '', content: '', interest: '' });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    postId: null,
    status: 'confirm',
    message: '',
    processing: false
  });
  const [profileModal, setProfileModal] = useState({
    isOpen: false,
    status: 'success',
    message: ''
  });
  const [postModal, setPostModal] = useState({
    isOpen: false,
    status: 'success',
    message: ''
  });

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
  const [videoLoadingMap, setVideoLoadingMap] = useState({});
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminDeleteModal, setAdminDeleteModal] = useState({
    isOpen: false,
    userId: null,
    username: '',
    status: 'confirm',
    message: '',
    processing: false
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedTheme = localStorage.getItem('theme') || 'dark';
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(normalizeUser(JSON.parse(storedUser)));
    }
    setTheme(storedTheme);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [activeTab, selectedInterest, sortBy, token]);

  useEffect(() => {
    setVideoLoadingMap((prev) => {
      const next = {};
      posts.forEach((post) => {
        if (post.type === 'clip' && post.media) {
          next[post.id] = prev[post.id] ?? true;
        }
      });
      return next;
    });
  }, [posts]);

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

      const normalizedUser = normalizeUser(data.user);
      setToken(data.token);
      setUser(normalizedUser);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
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
    setShowProfile(false);
    setShowAdminDashboard(false);
    setShowAddPost(false);
    setSidebarOpen(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdminUser = () => {
    if (!user) return false;
    return Number(user.is_admin) === 1 || user.username === 'techguy';
  };

  const handleVote = async (postId, hilarityLevel) => {
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
        body: JSON.stringify({ hilarityLevel })
      });

      if (res.status === 401) {
        // Token expired or invalid
        setShowAuth(true);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                upvotes: data.upvotes,
                downvotes: data.downvotes,
                userVote: data.userVote,
                userHilarityLevel: data.userHilarityLevel
              }
            : p
        ));
      }
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const currentToken = getAuthToken();
    if (!currentToken) {
      setShowAuth(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          ...postForm,
          type: activeTab === 'jokes' ? 'joke' : 'clip'
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPostModal({
          isOpen: true,
          status: 'error',
          message: data.error || 'Failed to post. Please try again.'
        });
        return;
      }

      const newPost = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
        userVote: null,
        userHilarityLevel: null
      };

      setPosts((prev) => [newPost, ...prev]);
      setSelectedInterest(newPost.interest || 'Programming');
      setSortBy('trending');
      setShowAddPost(false);
      setPostForm({ type: 'joke', title: '', content: '', media: '', interest: 'Programming', tags: '' });
      setPostModal({
        isOpen: true,
        status: 'success',
        message: 'Post uploaded successfully.'
      });

      await fetchPosts();
    } catch (error) {
      console.error('Create post failed:', error);
      setPostModal({
        isOpen: true,
        status: 'error',
        message: 'Posting failed due to a network error. Please try again.'
      });
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

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
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
    setShowAdminDashboard(false);
    setShowAddPost(false);
    fetchProfile();
  };

  const fetchAdminUsers = async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setShowAuth(true);
      return;
    }

    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAdminError(data.error || 'Failed to load admin dashboard data.');
        if (res.status === 401) {
          setShowAuth(true);
        }
        return;
      }

      setAdminUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      console.error('Admin dashboard fetch failed:', error);
      setAdminError('Failed to load admin dashboard data.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleShowAdminDashboard = () => {
    setShowAdminDashboard(true);
    setShowProfile(false);
    setShowAddPost(false);
    fetchAdminUsers();
  };

  const openAdminDeleteModal = (targetUser) => {
    setAdminDeleteModal({
      isOpen: true,
      userId: targetUser.id,
      username: targetUser.username,
      status: 'confirm',
      message: `Delete @${targetUser.username} and all their posts?`,
      processing: false
    });
  };

  const closeAdminDeleteModal = () => {
    setAdminDeleteModal({
      isOpen: false,
      userId: null,
      username: '',
      status: 'confirm',
      message: '',
      processing: false
    });
  };

  const handleAdminDeleteUser = async () => {
    if (!adminDeleteModal.userId) return;

    const currentToken = getAuthToken();
    if (!currentToken) {
      closeAdminDeleteModal();
      setShowAuth(true);
      return;
    }

    setAdminDeleteModal((prev) => ({ ...prev, processing: true }));

    try {
      const res = await fetch(`/api/admin/users/${adminDeleteModal.userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAdminDeleteModal((prev) => ({
          ...prev,
          status: 'error',
          message: data.error || 'Failed to delete user.',
          processing: false
        }));
        if (res.status === 401) {
          setShowAuth(true);
        }
        return;
      }

      setAdminUsers((prev) => prev.filter((u) => u.id !== adminDeleteModal.userId));
      setAdminDeleteModal((prev) => ({
        ...prev,
        status: 'success',
        message: `@${prev.username} was deleted successfully.`,
        processing: false
      }));
    } catch (error) {
      console.error('Admin delete user failed:', error);
      setAdminDeleteModal((prev) => ({
        ...prev,
        status: 'error',
        message: 'Delete request failed. Please try again.',
        processing: false
      }));
    }
  };

  const openProfileModal = (status, message) => {
    setProfileModal({
      isOpen: true,
      status,
      message
    });
  };

  const closeProfileModal = () => {
    setProfileModal({
      isOpen: false,
      status: 'success',
      message: ''
    });
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.length < 3) {
      openProfileModal('error', 'Username must be at least 3 characters.');
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
        const normalizedUser = normalizeUser({ ...data.user, is_admin: user?.is_admin || 0 });
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setEditingUsername(false);
        openProfileModal('success', 'Username updated successfully.');
      } else {
        const error = await res.json();
        openProfileModal('error', error.error || 'Failed to update username.');
      }
    } catch (error) {
      console.error('Update username failed:', error);
      openProfileModal('error', 'Update request failed. Please try again.');
    }
  };

  const openDeleteModal = (postId) => {
    setDeleteModal({
      isOpen: true,
      postId,
      status: 'confirm',
      message: 'Are you sure you want to delete this post?',
      processing: false
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      postId: null,
      status: 'confirm',
      message: '',
      processing: false
    });
  };

  const handleDeletePost = async () => {
    if (!deleteModal.postId) return;

    const currentToken = getAuthToken();
    if (!currentToken) {
      closeDeleteModal();
      setShowAuth(true);
      return;
    }

    setDeleteModal((prev) => ({ ...prev, processing: true }));

    try {
      const res = await fetch(`/api/posts/${deleteModal.postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      if (res.ok) {
        setProfilePosts((prev) => prev.filter((p) => p.id !== deleteModal.postId));
        setPosts((prev) => prev.filter((p) => p.id !== deleteModal.postId));
        await fetchPosts();
        setDeleteModal((prev) => ({
          ...prev,
          status: 'success',
          message: 'Post deleted successfully.',
          processing: false
        }));
      } else {
        const error = await res.json().catch(() => ({}));
        setDeleteModal((prev) => ({
          ...prev,
          status: 'error',
          message: error.error || 'Failed to delete post.',
          processing: false
        }));
        if (res.status === 401) {
          setShowAuth(true);
        }
      }
    } catch (error) {
      console.error('Delete post failed:', error);
      setDeleteModal((prev) => ({
        ...prev,
        status: 'error',
        message: 'Delete request failed. Please try again.',
        processing: false
      }));
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditPostForm({ title: post.title, content: post.content || '', interest: post.interest });
  };

  const canDeletePost = (post) => {
    if (!user) return false;
    return Number(post.user_id) === Number(user.id);
  };

  const getHilarityScore = (post) => {
    const totalVotes = post.upvotes + post.downvotes;
    if (totalVotes === 0) return 0;
    const weighted = ((post.upvotes - post.downvotes) / totalVotes) * 2 + 3;
    return Math.max(1, Math.min(5, Math.round(weighted)));
  };

  const handleVideoPlayable = (postId) => {
    setVideoLoadingMap((prev) => ({ ...prev, [postId]: false }));
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0d0f1e]' : 'bg-white'}`} data-testid="main-container">
      {/* Header - Fixed */}
      <header className={`fixed top-0 left-0 right-0 z-40 px-4 md:px-6 py-3 border-b ${theme === 'dark' ? 'border-[#1e2140] bg-[#0d0f1e]' : 'border-gray-200 bg-white'}`} data-testid="header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
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
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-600 hover:text-black border border-gray-300 hover:border-gray-400'}`}
              data-testid="theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <>
                {isAdminUser() && (
                  <button
                    onClick={handleShowAdminDashboard}
                    className={`hidden sm:flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm rounded-full transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'}`}
                    data-testid="admin-dashboard-btn"
                  >
                    <Shield size={16} />
                    <span className="hidden md:inline">Admin</span>
                  </button>
                )}
                <button 
                  onClick={handleShowProfile}
                  className={`hidden sm:flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm rounded-full transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'}`}
                  data-testid="profile-btn"
                >
                  <User size={16} />
                  <span className="hidden md:inline">{user.username}</span>
                </button>
                <button 
                  onClick={handleShowProfile}
                  className={`sm:hidden p-2 rounded-full transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'}`}
                  data-testid="profile-mobile-btn"
                >
                  <User size={16} />
                </button>
                {isAdminUser() && (
                  <button
                    onClick={handleShowAdminDashboard}
                    className={`sm:hidden p-2 rounded-full transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'}`}
                    data-testid="admin-dashboard-mobile-btn"
                    title="Admin Dashboard"
                  >
                    <Shield size={16} />
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className={`hidden sm:block px-3 md:px-5 py-2 text-xs md:text-sm rounded-full transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'}`}
                  data-testid="logout-btn"
                >
                  Logout
                </button>
                <button
                  onClick={handleLogout}
                  className={`sm:hidden p-2 rounded-full transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'}`}
                  data-testid="logout-mobile-btn"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setIsLogin(true); setShowAuth(true); }}
                  className={`hidden sm:block px-3 md:px-5 py-2 text-xs md:text-sm rounded-full transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'}`}
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
          className={`fixed top-[72px] left-0 bottom-0 w-64 px-5 py-5 overflow-y-auto transition-transform duration-300 z-30 border-r ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#1e2140]' : 'bg-white border-gray-200'}`}
          data-testid="sidebar"
        >
          <nav className="space-y-2">
            <div 
              className={`flex items-center gap-3 py-2 cursor-pointer transition-colors text-sm ${sortBy === 'trending' ? (theme === 'dark' ? 'text-white' : 'text-black') : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
              onClick={() => { setSortBy('trending'); setSelectedInterest(null); setSidebarOpen(false); }}
              data-testid="trending-nav"
            >
              <TrendingUp size={18} />
              <span>Trending</span>
            </div>
            <div 
              className={`flex items-center gap-3 py-2 cursor-pointer transition-colors text-sm ${sortBy === 'top' ? (theme === 'dark' ? 'text-white' : 'text-black') : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
              onClick={() => { setSortBy('top'); setSelectedInterest(null); setSidebarOpen(false); }}
              data-testid="top-ranked-nav"
            >
              <BarChart3 size={18} />
              <span>Top Ranked</span>
            </div>
          </nav>

          <div className="mt-6">
            <h3 className={`font-medium mb-3 text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Interests</h3>
            <div className="space-y-1">
              {INTERESTS.map((interest, idx) => (
                <div
                  key={idx}
                  className={`py-1.5 pl-2 cursor-pointer transition-colors text-sm ${selectedInterest === interest ? (theme === 'dark' ? 'text-white' : 'text-black') : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
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
        <main className={`flex-1 w-full md:ml-64 min-h-[calc(100vh-72px)] ${theme === 'dark' ? 'bg-[#0d0f1e]' : 'bg-white'}`} data-testid="main-content">
          {showAdminDashboard ? (
            <div className={`pt-6 md:pt-8 px-4 md:px-8 pb-8 ${theme === 'dark' ? 'bg-[#0d0f1e]' : 'bg-white'}`} data-testid="admin-dashboard-view">
              <div className="flex items-center mb-6 md:mb-8">
                <button
                  className={`flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  onClick={() => setShowAdminDashboard(false)}
                  data-testid="admin-dashboard-back-btn"
                >
                  <ArrowLeft size={24} />
                  <span className="text-lg">Back</span>
                </button>
                <h2 className={`text-xl md:text-2xl font-semibold flex-1 text-center pr-6 md:pr-20 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  Admin Dashboard
                </h2>
              </div>

              <div className="w-full md:max-w-4xl md:mx-auto space-y-6">
                <div className={`p-4 md:p-6 rounded-lg border ${theme === 'dark' ? 'bg-[#171932] border-[#2d3154]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>All Users</h3>
                    <button
                      onClick={fetchAdminUsers}
                      className="px-4 py-2 bg-[#5a6aff] text-white rounded-md text-sm hover:bg-[#4f5de0] transition-colors"
                      data-testid="admin-refresh-btn"
                    >
                      Refresh
                    </button>
                  </div>

                  {adminLoading ? (
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
                  ) : adminError ? (
                    <p className="text-red-500 text-sm" data-testid="admin-error">{adminError}</p>
                  ) : (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} data-testid="admin-user-count">
                      {adminUsers.length} users found
                    </p>
                  )}
                </div>

                {!adminLoading && !adminError && adminUsers.map((dashboardUser) => (
                  <div
                    key={dashboardUser.id}
                    className={`p-4 md:p-6 rounded-lg border ${theme === 'dark' ? 'bg-[#171932] border-[#2d3154]' : 'bg-gray-50 border-gray-200'}`}
                    data-testid={`admin-user-${dashboardUser.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <div>
                        <h4 className={`text-base md:text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          @{dashboardUser.username}
                          {Number(dashboardUser.is_admin) === 1 && (
                            <span className="ml-2 text-xs text-[#5a6aff]">ADMIN</span>
                          )}
                        </h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{dashboardUser.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {dashboardUser.posts.length} posts
                        </span>
                        {Number(dashboardUser.is_admin) !== 1 && Number(dashboardUser.id) !== Number(user?.id) && (
                          <button
                            onClick={() => openAdminDeleteModal(dashboardUser)}
                            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${theme === 'dark' ? 'text-red-400 border border-red-900/40 hover:border-red-500 hover:text-red-300' : 'text-red-600 border border-red-200 hover:border-red-400 hover:text-red-700'}`}
                            data-testid={`admin-delete-user-${dashboardUser.id}`}
                          >
                            Delete User
                          </button>
                        )}
                      </div>
                    </div>

                    {dashboardUser.posts.length === 0 ? (
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>No posts yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboardUser.posts.map((post) => (
                          <div
                            key={post.id}
                            className={`p-3 rounded-md border ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#252850]' : 'bg-white border-gray-200'}`}
                            data-testid={`admin-user-post-${post.id}`}
                          >
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{post.title}</p>
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {post.type} • {post.interest} • {new Date(post.created_at).toLocaleDateString()} • {post.upvotes} up / {post.downvotes} down
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : showProfile ? (
            /* Profile View */
            <div className={`pt-6 md:pt-8 px-4 md:px-8 pb-8 ${theme === 'dark' ? 'bg-[#0d0f1e]' : 'bg-white'}`} data-testid="profile-view">
              <div className="flex items-center mb-6 md:mb-8">
                <button 
                  className={`flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  onClick={() => setShowProfile(false)}
                  data-testid="profile-back-btn"
                >
                  <ArrowLeft size={24} />
                  <span className="text-lg">Back</span>
                </button>
                <h2 className={`text-xl md:text-2xl font-semibold flex-1 text-center pr-6 md:pr-20 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>My Profile</h2>
              </div>

              {/* Username Section */}
              <div className={`w-full md:max-w-2xl md:mx-auto mb-8 p-4 md:p-6 rounded-lg border ${theme === 'dark' ? 'bg-[#171932] border-[#2d3154]' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Username</h3>
                {editingUsername ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      className={`flex-1 border rounded-md px-4 py-2 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff]' : 'bg-white border-gray-300 text-black focus:border-blue-500'}`}
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
                      className={`px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${theme === 'dark' ? 'border border-[#3d4270] text-gray-400 hover:text-white' : 'border border-gray-300 text-gray-600 hover:text-black'}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>@{user?.username}</span>
                    <button
                      onClick={() => { setNewUsername(user?.username || ''); setEditingUsername(true); }}
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all whitespace-nowrap ${theme === 'dark' ? 'text-gray-400 hover:text-white border border-[#3d4270] hover:border-[#5a6aff]' : 'text-gray-600 hover:text-black border border-gray-300 hover:border-gray-400'}`}
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
                              className={`w-full border rounded-md px-4 py-2 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff]' : 'bg-white border-gray-300 text-black focus:border-blue-500'}`}
                              value={editPostForm.title}
                              onChange={(e) => setEditPostForm({ ...editPostForm, title: e.target.value })}
                              placeholder="Title"
                            />
                            <textarea
                              className={`w-full border rounded-md px-4 py-2 text-sm focus:outline-none transition-colors min-h-[80px] ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff]' : 'bg-white border-gray-300 text-black focus:border-blue-500'}`}
                              value={editPostForm.content}
                              onChange={(e) => setEditPostForm({ ...editPostForm, content: e.target.value })}
                              placeholder="Content"
                            />
                            <select
                              className={`w-full border rounded-md px-4 py-2 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff]' : 'bg-white border-gray-300 text-black focus:border-blue-500'}`}
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
                                className={`px-4 py-2 border rounded-md text-sm transition-colors ${theme === 'dark' ? 'border-[#3d4270] text-gray-400 hover:text-white' : 'border-gray-300 text-gray-600 hover:text-black'}`}
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
                                <h4 className={`font-medium break-words ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                  {post.title}
                                  {post.edited === 1 && <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>(edited)</span>}
                                </h4>
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {post.type === 'joke' ? 'Joke' : 'Clip'} • {post.interest} • {new Date(post.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleEditPost(post)}
                                  className={`p-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-[#5a6aff]' : 'text-gray-600 hover:text-blue-500'}`}
                                  data-testid={`edit-post-${post.id}`}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(post.id)}
                                  className={`p-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-red-600'}`}
                                  data-testid={`delete-post-${post.id}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {post.content && (
                              <p className={`text-sm break-words ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>{post.content}</p>
                            )}
                            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
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
              <div className={`sticky top-[72px] z-30 px-4 md:px-8 pt-6 md:pt-8 pb-4 transition-colors ${theme === 'dark' ? 'bg-[#0d0f1e]' : 'bg-white'}`}>
                {/* Tabs and Post Button */}
                <div className="flex items-center justify-between gap-4 mb-2 w-full md:max-w-2xl md:mx-auto">
                  <div className="flex gap-4 md:gap-6">
                    <span
                      className={`text-lg md:text-xl font-medium cursor-pointer pb-1 border-b-2 transition-all ${activeTab === 'jokes' ? (theme === 'dark' ? 'text-white border-white' : 'text-black border-black') : (theme === 'dark' ? 'text-gray-400 border-transparent hover:text-white' : 'text-gray-600 border-transparent hover:text-black')}`}
                      onClick={() => setActiveTab('jokes')}
                      data-testid="jokes-tab"
                    >
                      Jokes
                    </span>
                    <span
                      className={`text-lg md:text-xl font-medium cursor-pointer pb-1 border-b-2 transition-all ${activeTab === 'clips' ? (theme === 'dark' ? 'text-white border-white' : 'text-black border-black') : (theme === 'dark' ? 'text-gray-400 border-transparent hover:text-white' : 'text-gray-600 border-transparent hover:text-black')}`}
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
                  <p className={`text-sm w-full md:max-w-2xl md:mx-auto ${theme === 'dark' ? 'text-[#6b7cff]' : 'text-blue-600'}`} data-testid="current-interest">#{selectedInterest}</p>
                )}
              </div>

              {/* Posts - Scrollable */}
              <div className={`px-4 md:px-8 py-5 pb-8 ${theme === 'dark' ? 'bg-[#0d0f1e]' : 'bg-white'}`}>
                <div className="space-y-6 w-full md:max-w-2xl md:mx-auto" data-testid="posts-container">
                {posts.length === 0 ? (
                  <div className={`text-center py-12 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} data-testid="no-posts">
                    No {activeTab} found. Be the first to post!
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className={`pb-5 border-b ${theme === 'dark' ? 'border-[#252850]' : 'border-gray-200'}`} data-testid={`post-${post.id}`}>
                      {/* Post Header - Title and Meta */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1">
                        <h3 className={`font-medium text-base break-words ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {post.title}
                          {post.edited === 1 && <span className={`text-xs ml-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>(edited)</span>}
                        </h3>
                      </div>
                      
                      {/* Post Meta - User, Date, Time */}
                      <div className={`flex flex-wrap items-center gap-1 md:gap-2 mb-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className={`font-medium ${theme === 'dark' ? 'text-[#6b7cff]' : 'text-blue-600'}`}>@{post.username}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(post.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {/* Media Area */}
                      <div className={`w-full rounded-lg mb-3 overflow-hidden border ${theme === 'dark' ? 'border-[#252850] bg-[#12152a]' : 'border-gray-200 bg-gray-50'}`}>
                        {post.media ? (
                          post.type === 'clip' ? (
                            <div className="relative w-full bg-black h-64 md:h-96">
                              <video 
                                controls 
                                className="w-full h-full"
                                preload="metadata"
                                onCanPlay={() => handleVideoPlayable(post.id)}
                                onError={() => handleVideoPlayable(post.id)}
                              >
                                <source src={post.media} />
                              </video>
                              {videoLoadingMap[post.id] !== false && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                                  <div className="w-12 h-12 border-4 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <img src={post.media} alt={post.title} className="w-full object-cover" />
                          )
                        ) : (
                          <div className={`h-32 md:h-40 flex items-center justify-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Image
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      {post.content && (
                        <p className={`text-sm leading-relaxed mb-3 break-words ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{post.content}</p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags && post.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className={`px-4 py-1 rounded-full text-xs transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-300 border border-[#3d4270] bg-[#1a1d3a] hover:border-[#5a6aff]' : 'text-gray-700 border border-gray-300 bg-gray-100 hover:border-gray-400'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions Row */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {HILARITY_LEVELS.map((item, index) => {
                              const isSelected = post.userHilarityLevel === item.level;
                              return (
                                <motion.button
                                  key={item.level}
                                  whileHover={{ scale: 1.22, y: -4 }}
                                  whileTap={{ scale: 0.92 }}
                                  animate={{ rotate: isSelected ? [0, -8, 8, 0] : 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.03 }}
                                  className={`text-2xl md:text-3xl transition-all ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                  style={{ filter: isSelected ? 'drop-shadow(0 3px 0 rgba(0,0,0,0.25)) drop-shadow(0 10px 14px rgba(0,0,0,0.25))' : 'drop-shadow(0 2px 0 rgba(0,0,0,0.2))' }}
                                  onClick={() => handleVote(post.id, item.level)}
                                  title={item.label}
                                  data-testid={`hilarity-${post.id}-${item.level}`}
                                >
                                  <span aria-hidden="true">{item.emoji}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Hilarity {getHilarityScore(post)}/5 • {formatVotes(post.upvotes + post.downvotes)} votes
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button className={`flex items-center gap-1.5 text-sm transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`} data-testid={`share-${post.id}`}>
                            <Share2 size={16} />
                            Share
                          </button>
                          {canDeletePost(post) && (
                            <button
                              className={`flex items-center gap-1.5 text-sm transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-red-600'}`}
                              onClick={() => openDeleteModal(post.id)}
                              data-testid={`timeline-delete-post-${post.id}`}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                </div>
              </div>
            </>
          ) : (
            /* Add Post Form */
            <div className={`pt-6 md:pt-8 px-4 md:px-8 pb-8 ${theme === 'dark' ? 'bg-[#0d0f1e]' : 'bg-white'}`} data-testid="add-post-form">
              <div className="flex items-center mb-6 md:mb-8">
                <button 
                  className={`flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  onClick={() => setShowAddPost(false)}
                  data-testid="back-btn"
                >
                  <ArrowLeft size={24} />
                  <span className="text-lg">Back</span>
                </button>
                <h2 className={`text-xl md:text-2xl font-semibold flex-1 text-center pr-6 md:pr-20 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Add a post</h2>
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
                  <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Title</label>
                  <input
                    type="text"
                    className={`w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff]' : 'bg-white border-gray-300 text-black focus:border-blue-500'}`}
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    required
                    data-testid="title-input"
                  />
                </div>

                {/* Upload Button */}
                <div>
                  <label className={`block w-full border rounded-md px-4 py-3 text-sm text-center cursor-pointer transition-colors ${theme === 'dark' ? 'bg-[#1a1d3a] border-[#3d4270] text-gray-400 hover:border-[#5a6aff]' : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'}`}>
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
                    <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Main Text</label>
                    <textarea
                      className={`w-full border rounded-md px-4 py-3 text-sm focus:outline-none transition-colors min-h-[100px] resize-vertical ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff]' : 'bg-white border-gray-300 text-black focus:border-blue-500'}`}
                      value={postForm.content}
                      onChange={(e) => setPostForm({ ...postForm, content: e.target.value.slice(0, 500) })}
                      maxLength={500}
                      data-testid="content-textarea"
                    />
                    <p className={`text-right text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{postForm.content.length}/500</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] px-6 py-2.5 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
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
          <div className={`rounded-xl p-6 md:p-8 w-full max-w-xs md:max-w-sm border ${theme === 'dark' ? 'bg-[#171932] border-[#2d3154]' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`text-lg md:text-xl font-semibold text-center mb-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
            
            {authError && (
              <p className="text-red-500 text-sm text-center mb-4" data-testid="auth-error">{authError}</p>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <input
                  type="text"
                  className={`w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff] placeholder-gray-500' : 'bg-white border-gray-300 text-black focus:border-blue-500 placeholder-gray-400'}`}
                  placeholder="Username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  required={!isLogin}
                  data-testid="username-input"
                />
              )}
              <input
                type="email"
                className={`w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff] placeholder-gray-500' : 'bg-white border-gray-300 text-black focus:border-blue-500 placeholder-gray-400'}`}
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
                data-testid="email-input"
              />
              <input
                type="password"
                className={`w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0d0f1e] border-[#3d4270] text-white focus:border-[#5a6aff] placeholder-gray-500' : 'bg-white border-gray-300 text-black focus:border-blue-500 placeholder-gray-400'}`}
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

            <p className={`text-center text-sm mt-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" data-testid="delete-modal">
          <div className={`rounded-xl p-6 md:p-8 w-full max-w-xs md:max-w-sm border ${theme === 'dark' ? 'bg-[#171932] border-[#2d3154]' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg md:text-xl font-semibold text-center mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {deleteModal.status === 'confirm' ? 'Delete Post' : deleteModal.status === 'success' ? 'Success' : 'Delete Failed'}
            </h2>
            <p className={`text-sm text-center mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {deleteModal.message}
            </p>

            {deleteModal.status === 'confirm' ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={closeDeleteModal}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${theme === 'dark' ? 'border border-[#3d4270] text-gray-300 hover:text-white hover:border-[#5a6aff]' : 'border border-gray-300 text-gray-700 hover:text-black hover:border-gray-400'}`}
                  disabled={deleteModal.processing}
                  data-testid="delete-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/30 transition-all"
                  disabled={deleteModal.processing}
                  data-testid="delete-confirm-btn"
                >
                  {deleteModal.processing ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  onClick={closeDeleteModal}
                  className="px-6 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  data-testid="delete-modal-ok-btn"
                >
                  Ok
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Delete User Modal */}
      {adminDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" data-testid="admin-delete-user-modal">
          <div className={`rounded-xl p-6 md:p-8 w-full max-w-xs md:max-w-sm border ${theme === 'dark' ? 'bg-[#171932] border-[#2d3154]' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg md:text-xl font-semibold text-center mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {adminDeleteModal.status === 'confirm' ? 'Delete User' : adminDeleteModal.status === 'success' ? 'Success' : 'Delete Failed'}
            </h2>
            <p className={`text-sm text-center mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {adminDeleteModal.message}
            </p>

            {adminDeleteModal.status === 'confirm' ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={closeAdminDeleteModal}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${theme === 'dark' ? 'border border-[#3d4270] text-gray-300 hover:text-white hover:border-[#5a6aff]' : 'border border-gray-300 text-gray-700 hover:text-black hover:border-gray-400'}`}
                  disabled={adminDeleteModal.processing}
                  data-testid="admin-delete-user-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminDeleteUser}
                  className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/30 transition-all"
                  disabled={adminDeleteModal.processing}
                  data-testid="admin-delete-user-confirm-btn"
                >
                  {adminDeleteModal.processing ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  onClick={closeAdminDeleteModal}
                  className="px-6 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  data-testid="admin-delete-user-ok-btn"
                >
                  Ok
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Feedback Modal */}
      {profileModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" data-testid="profile-feedback-modal">
          <div className={`rounded-xl p-6 md:p-8 w-full max-w-xs md:max-w-sm border ${theme === 'dark' ? 'bg-[#171932] border-[#2d3154]' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg md:text-xl font-semibold text-center mb-3 ${profileModal.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {profileModal.status === 'success' ? 'Success' : 'Update Failed'}
            </h2>
            <p className={`text-sm text-center mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {profileModal.message}
            </p>
            <div className="flex items-center justify-center">
              <button
                onClick={closeProfileModal}
                className="px-6 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                data-testid="profile-modal-ok-btn"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Feedback Modal */}
      {postModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" data-testid="post-feedback-modal">
          <div className={`rounded-xl p-6 md:p-8 w-full max-w-xs md:max-w-sm border ${theme === 'dark' ? 'bg-[#171932] border-[#2d3154]' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg md:text-xl font-semibold text-center mb-3 ${postModal.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {postModal.status === 'success' ? 'Success' : 'Post Failed'}
            </h2>
            <p className={`text-sm text-center mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {postModal.message}
            </p>
            <div className="flex items-center justify-center">
              <button
                onClick={() => setPostModal({ isOpen: false, status: 'success', message: '' })}
                className="px-6 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#4f6ef7] to-[#6366f1] hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                data-testid="post-modal-ok-btn"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
