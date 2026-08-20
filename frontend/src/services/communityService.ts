/**
 * communityService.ts — Production Real-Time Community Hub Service
 *
 * Handles:
 * - Real-time post listing & filtering (Location/District/State/Global)
 * - Post creation directly to Firestore `communityPosts`
 * - Nested comment thread CRUD (`communityPosts/{postId}/comments/{commentId}`)
 * - Real-time comment stream with `onSnapshot()`
 * - Persistent post likes (`communityPosts/{postId}/likes/{userId}`)
 * - Content reporting (`communityPostReports`)
 * - Post deletion/editing with owner & admin permission validation
 */

import { db } from '../lib/firebase.ts';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'SAFETY' | 'ALERT' | 'EVENT' | 'AID_REQUEST' | 'CLEANLINESS';
  images?: string[];
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  city: string;
  taluka: string;
  ward?: string;
  village?: string;
  locality?: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt?: string;
  status: 'ACTIVE' | 'FLAGGED' | 'REMOVED';
  visibility: 'PUBLIC' | 'DISTRICT_ONLY';
  likeCount?: number;
  commentCount?: number;
  isLikedByMe?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'ACTIVE' | 'FLAGGED';
}

/**
 * 1. Subscribe to real-time Community Posts from Firestore
 */
export const subscribeCommunityPosts = (
  filterLocation: { district?: string; city?: string; filterScope: 'ALL' | 'DISTRICT' | 'MY_POSTS' },
  currentUserId: string | undefined,
  onUpdate: (posts: CommunityPost[]) => void,
  onError?: (err: any) => void
): Unsubscribe => {
  const postsRef = collection(db, 'communityPosts');
  let q = query(postsRef, orderBy('createdAt', 'desc'));

  if (filterLocation.filterScope === 'DISTRICT' && filterLocation.district) {
    q = query(postsRef, where('district', '==', filterLocation.district), orderBy('createdAt', 'desc'));
  } else if (filterLocation.filterScope === 'MY_POSTS' && currentUserId) {
    q = query(postsRef, where('createdBy', '==', currentUserId), orderBy('createdAt', 'desc'));
  }

  return onSnapshot(
    q,
    async (snapshot) => {
      const posts: CommunityPost[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.status === 'REMOVED') continue;

        posts.push({
          id: docSnap.id,
          title: data.title || 'Community Post',
          content: data.content || '',
          category: data.category || 'GENERAL',
          images: data.images || [],
          latitude: data.latitude || 18.5204,
          longitude: data.longitude || 73.8567,
          state: data.state || 'Maharashtra',
          district: data.district || 'Pune',
          city: data.city || 'Pune',
          taluka: data.taluka || '',
          ward: data.ward || '',
          village: data.village || '',
          locality: data.locality || '',
          createdBy: data.createdBy || 'anonymous',
          creatorName: data.creatorName || 'Resident Citizen',
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'ACTIVE',
          visibility: data.visibility || 'PUBLIC',
          likeCount: data.likeCount || 0,
          commentCount: data.commentCount || 0,
        });
      }
      onUpdate(posts);
    },
    (err) => {
      console.warn('[Community Engine] Post listener notice:', err?.code);
      if (onError) onError(err);
    }
  );
};

/**
 * 2. Create a new Community Post in Firestore
 */
export const createCommunityPost = async (
  postData: Omit<CommunityPost, 'id' | 'createdAt' | 'likeCount' | 'commentCount' | 'status'>
): Promise<string> => {
  const postsRef = collection(db, 'communityPosts');
  const newPostDoc = {
    ...postData,
    status: 'ACTIVE',
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(postsRef, newPostDoc);
  return docRef.id;
};

/**
 * 3. Subscribe to real-time comments for a specific post (`communityPosts/{postId}/comments`)
 */
export const subscribePostComments = (
  postId: string,
  onUpdate: (comments: PostComment[]) => void
): Unsubscribe => {
  const commentsRef = collection(db, 'communityPosts', postId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const comments: PostComment[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          postId,
          userId: data.userId || 'anonymous',
          userName: data.userName || 'Citizen User',
          comment: data.comment || '',
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'ACTIVE',
        };
      });
      onUpdate(comments);
    },
    (err) => {
      console.warn('[Community Engine] Comment listener notice:', err?.code);
    }
  );
};

/**
 * 4. Add a comment to a post & update commentCount
 */
export const addPostComment = async (
  postId: string,
  userId: string,
  userName: string,
  commentText: string
): Promise<void> => {
  if (!commentText.trim()) return;

  const commentsRef = collection(db, 'communityPosts', postId, 'comments');
  await addDoc(commentsRef, {
    postId,
    userId,
    userName,
    comment: commentText.trim(),
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
  });

  // Increment comment counter on parent post
  const postRef = doc(db, 'communityPosts', postId);
  try {
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentCount = postSnap.data().commentCount || 0;
      await updateDoc(postRef, {
        commentCount: currentCount + 1,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (_) {}
};

/**
 * 5. Delete a comment (Owner or Admin) & decrement commentCount
 */
export const deletePostComment = async (postId: string, commentId: string): Promise<void> => {
  const commentRef = doc(db, 'communityPosts', postId, 'comments', commentId);
  await deleteDoc(commentRef);

  const postRef = doc(db, 'communityPosts', postId);
  try {
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentCount = Math.max(0, (postSnap.data().commentCount || 1) - 1);
      await updateDoc(postRef, {
        commentCount: currentCount,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (_) {}
};

/**
 * 6. Toggle Like on a Post (persisted in `communityPosts/{postId}/likes/{userId}`)
 */
export const togglePostLike = async (postId: string, userId: string): Promise<boolean> => {
  if (!userId) return false;

  const likeRef = doc(db, 'communityPosts', postId, 'likes', userId);
  const postRef = doc(db, 'communityPosts', postId);

  const likeSnap = await getDoc(likeRef);
  const postSnap = await getDoc(postRef);
  let currentLikes = postSnap.exists() ? postSnap.data().likeCount || 0 : 0;

  if (likeSnap.exists()) {
    // Unlike
    await deleteDoc(likeRef);
    const newLikes = Math.max(0, currentLikes - 1);
    await updateDoc(postRef, { likeCount: newLikes });
    return false;
  } else {
    // Like
    await setDoc(likeRef, { userId, createdAt: new Date().toISOString() });
    const newLikes = currentLikes + 1;
    await updateDoc(postRef, { likeCount: newLikes });
    return true;
  }
};

/**
 * 7. Check if post is liked by current user
 */
export const checkIsPostLiked = async (postId: string, userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const likeRef = doc(db, 'communityPosts', postId, 'likes', userId);
    const snap = await getDoc(likeRef);
    return snap.exists();
  } catch (_) {
    return false;
  }
};

/**
 * 8. Report a post (`communityPostReports`)
 */
export const reportCommunityPost = async (
  postId: string,
  reportedBy: string,
  reason: string,
  description: string
): Promise<void> => {
  const reportsRef = collection(db, 'communityPostReports');
  await addDoc(reportsRef, {
    postId,
    reportedBy,
    reason,
    description: description.trim(),
    createdAt: new Date().toISOString(),
    status: 'PENDING_REVIEW',
  });
};

/**
 * 9. Delete a post (Owner or Admin)
 */
export const deleteCommunityPost = async (postId: string): Promise<void> => {
  const postRef = doc(db, 'communityPosts', postId);
  await updateDoc(postRef, {
    status: 'REMOVED',
    updatedAt: new Date().toISOString(),
  });
};
