import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Heart,
  Plus,
  Search,
  MapPin,
  Flag,
  Trash2,
  Send,
  X,
  ShieldAlert,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useLocation } from '../../contexts/LocationContext.tsx';
import {
  CommunityPost,
  PostComment,
  subscribeCommunityPosts,
  createCommunityPost,
  subscribePostComments,
  addPostComment,
  deletePostComment,
  togglePostLike,
  checkIsPostLiked,
  reportCommunityPost,
  deleteCommunityPost,
} from '../../services/communityService.ts';

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { latitude, longitude, ward, city, district, state, taluka, village } = useLocation();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScope, setFilterScope] = useState<'ALL' | 'DISTRICT' | 'MY_POSTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Like states map: { [postId]: boolean }
  const [likedPostsMap, setLikedPostsMap] = useState<Record<string, boolean>>({});

  // Active Comment Drawer State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<CommunityPost['category']>('GENERAL');
  const [newVisibility, setNewVisibility] = useState<'PUBLIC' | 'DISTRICT_ONLY'>('PUBLIC');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Report Modal State
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Spam / Misleading');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // 1. Subscribe to real-time Community Posts from Firestore
  useEffect(() => {
    setLoading(true);
    const userId = user?.id || '';
    const unsubscribe = subscribeCommunityPosts(
      { district, city, filterScope },
      userId,
      (fetchedPosts) => {
        setPosts(fetchedPosts);
        setLoading(false);

        // Check likes status for current user
        if (userId) {
          fetchedPosts.forEach((p) => {
            checkIsPostLiked(p.id, userId).then((isLiked) => {
              setLikedPostsMap((prev) => ({ ...prev, [p.id]: isLiked }));
            });
          });
        }
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [district, city, filterScope, user?.id]);

  // 2. Subscribe to real-time comments when comment drawer is open
  useEffect(() => {
    if (!activeCommentPostId) {
      setComments([]);
      return;
    }

    const unsubscribe = subscribePostComments(activeCommentPostId, (fetchedComments) => {
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [activeCommentPostId]);

  // Handle Like Toggle
  const handleLikeToggle = async (postId: string) => {
    if (!user?.id) return;
    const isNowLiked = await togglePostLike(postId, user.id);
    setLikedPostsMap((prev) => ({ ...prev, [postId]: isNowLiked }));
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentCount = p.likeCount || 0;
          return { ...p, likeCount: isNowLiked ? currentCount + 1 : Math.max(0, currentCount - 1) };
        }
        return p;
      })
    );
  };

  // Handle Post Creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      await createCommunityPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        latitude: latitude || 18.5204,
        longitude: longitude || 73.8567,
        state,
        district,
        city: city || district,
        taluka,
        ward,
        village,
        locality: ward || city,
        createdBy: user?.id || 'anonymous',
        creatorName: user?.name || 'Local Resident',
        visibility: newVisibility,
      });

      setNewTitle('');
      setNewContent('');
      setShowCreateModal(false);
    } catch (err: any) {
      setCreateError('Failed to create post. Please try again.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentPostId || !commentInput.trim() || !user?.id) return;

    setCommentSubmitting(true);
    try {
      await addPostComment(activeCommentPostId, user.id, user.name || 'Citizen User', commentInput.trim());
      setCommentInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!activeCommentPostId) return;
    await deletePostComment(activeCommentPostId, commentId);
  };

  // Handle Report Post
  const handleReportPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPostId || !user?.id) return;
    await reportCommunityPost(reportPostId, user.id, reportReason, reportDetails);
    setReportSubmitted(true);
    setTimeout(() => {
      setReportPostId(null);
      setReportSubmitted(false);
      setReportDetails('');
    }, 2000);
  };

  // Handle Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to remove this post?')) return;
    await deleteCommunityPost(postId);
  };

  // Filter posts by search query
  const filteredPosts = posts.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 border border-white/20">
              <MapPin className="w-3.5 h-3.5" /> Community Network for {ward || city}, {district}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              MahaResilience Community Hub
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Connect with fellow citizens, coordinate volunteer disaster relief, report neighborhood safety concerns, and access real-time civic community bulletins.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white hover:bg-teal-50 text-teal-800 font-extrabold px-6 py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all hover-scale self-start md:self-auto text-sm shrink-0"
          >
            <Plus className="w-5 h-5 text-teal-700" /> Create Post
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setFilterScope('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterScope === 'ALL'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🌐 All Posts (Maharashtra)
          </button>
          <button
            onClick={() => setFilterScope('DISTRICT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterScope === 'DISTRICT'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🏙️ My District ({district})
          </button>
          {user && (
            <button
              onClick={() => setFilterScope('MY_POSTS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterScope === 'MY_POSTS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              👤 My Posts
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search community feed..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-teal-600/30 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Posts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-teal-700 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-semibold">Loading real-time community feed...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">No community posts yet.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Be the first resident in {district} to create a post and share community safety updates or announcements!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-800"
            >
              <Plus className="w-4 h-4" /> Create First Post
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isMyPost = user?.id === post.createdBy;
            const isLiked = !!likedPostsMap[post.id];

            return (
              <div
                key={post.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          post.category === 'SAFETY' || post.category === 'ALERT'
                            ? 'bg-red-100 text-red-700'
                            : post.category === 'EVENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {post.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-600" /> {post.city}, {post.district}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-800 text-base leading-snug">
                      {post.title}
                    </h3>
                  </div>

                  {isMyPost && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Body */}
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Post Footer / Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      By <strong className="text-slate-700">{post.creatorName}</strong> •{' '}
                      {new Date(post.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      onClick={() => handleLikeToggle(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isLiked ? 'text-red-600 font-bold' : 'hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
                      <span>{post.likeCount || 0}</span>
                    </button>

                    {/* Comment Drawer Toggle */}
                    <button
                      onClick={() =>
                        setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)
                      }
                      className="flex items-center gap-1.5 hover:text-teal-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentCount || 0} Comments</span>
                    </button>

                    {/* Report Button */}
                    <button
                      onClick={() => setReportPostId(post.id)}
                      className="text-slate-400 hover:text-amber-600 transition-colors"
                      title="Report Post"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Comment Thread */}
                {activeCommentPostId === post.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-teal-700" /> Discussion Comments
                      </h4>
                      <button
                        onClick={() => setActiveCommentPostId(null)}
                        className="text-slate-400 hover:text-slate-600 text-[11px]"
                      >
                        Close
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {comments.length === 0 ? (
                        <p className="text-[11px] text-slate-400 text-center py-3">
                          No comments yet. Start the conversation!
                        </p>
                      ) : (
                        comments.map((c) => (
                          <div
                            key={c.id}
                            className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-bold text-slate-700">{c.userName}</span>
                              <div className="flex items-center gap-2">
                                <span>
                                  {new Date(c.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {(user?.id === c.userId || user?.role === 'SUPER_ADMIN') && (
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="text-red-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{c.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Input */}
                    {user ? (
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write a community comment..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-teal-600/30"
                        />
                        <button
                          type="submit"
                          disabled={commentSubmitting}
                          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <p className="text-[11px] text-slate-400 text-center font-semibold">
                        Please log in to post comments.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-700" /> Create Community Post
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Neighborhood Safety & Monsoon Preparedness Drive"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-semibold focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold outline-none"
                  >
                    <option value="GENERAL">General Notice</option>
                    <option value="SAFETY">Community Safety</option>
                    <option value="ALERT">Local Hazard Alert</option>
                    <option value="EVENT">Community Event</option>
                    <option value="AID_REQUEST">Relief Aid Request</option>
                    <option value="CLEANLINESS">Cleanliness Drive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Visibility Scope</label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold outline-none"
                  >
                    <option value="PUBLIC">Public (All Maharashtra)</option>
                    <option value="DISTRICT_ONLY">District Only ({district})</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Post Description</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write clear details, volunteer timing, or safety advisories..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-medium focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                />
              </div>

              <div className="p-3 bg-teal-50 rounded-xl text-[11px] text-teal-800 flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Post will be associated with <strong>{ward || city}, {district}</strong>.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {createSubmitting ? 'Publishing...' : 'Publish Post to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportPostId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Flag className="w-5 h-5 text-amber-600" /> Report Inappropriate Post
            </h3>

            {reportSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold text-center">
                Report logged. Community moderators will review this post.
              </div>
            ) : (
              <form onSubmit={handleReportPostSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold outline-none"
                  >
                    <option value="Spam / Misleading">Spam or Fake Information</option>
                    <option value="Offensive Content">Abusive or Harassing Language</option>
                    <option value="False Emergency Alert">False Emergency Alarm</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Additional Context</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide details for moderators..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportPostId(null)}
                    className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
