import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ThumbsUp, Trash2, MessageCircle, Send } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  postId: string;
}

const REACTION_EMOJIS = {
  like: '👍',
  love: '❤️',
  haha: '😆',
  wow: '😲',
  sad: '😢',
  angry: '😡'
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Đang gửi...';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Đang gửi...';
    return new Intl.DateTimeFormat('vi-VN', { 
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' 
    }).format(date);
  } catch (e) {
    return '...';
  }
};

export default function BlogInteractions({ postId }: Props) {
  const { user, isAdmin } = useAuth();
  const [reactions, setReactions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen to reactions
    const unsubscribeReactions = onSnapshot(collection(db, 'blog', postId, 'reactions'), (snapshot) => {
      setReactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to comments
    const qComments = query(collection(db, 'blog', postId, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeReactions();
      unsubscribeComments();
    };
  }, [postId]);

  const handleReact = async (type: string) => {
    if (!user) {
      alert('Vui lòng đăng nhập để tương tác.');
      return;
    }
    try {
      if (myReaction?.type === type) {
        // Toggle off
        await deleteDoc(doc(db, 'blog', postId, 'reactions', user.uid));
      } else {
        // Set new reaction
        await setDoc(doc(db, 'blog', postId, 'reactions', user.uid), {
          type,
          userId: user.uid,
          userEmail: user.email || 'Anonymous',
          updatedAt: serverTimestamp()
        });
      }
      setShowReactionPicker(false);
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Vui lòng đăng nhập để bình luận.');
      return;
    }
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, 'blog', postId, 'comments'), {
        content: newComment.trim(),
        userId: user.uid,
        userEmail: user.email || 'Anonymous',
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Chắc chắn xóa bình luận này?')) return;
    try {
      await deleteDoc(doc(db, 'blog', postId, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Touch / Hold events for Reaction picker
  const startPress = () => {
    pressTimer.current = setTimeout(() => {
      setShowReactionPicker(true);
    }, 400); // 400ms long press
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleMouseEnter = () => {
    // Show picker on hover after delay
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setShowReactionPicker(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // Give a short grace period before hiding picker
    hoverTimer.current = setTimeout(() => {
      setShowReactionPicker(false);
    }, 300);
  };

  const handlePickerEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowReactionPicker(true);
  };

  const handleClickLikeButton = (e: React.MouseEvent) => {
    // If picker is open from hover/long-press, don't trigger click
    if (showReactionPicker) {
      e.preventDefault();
      return;
    }
    handleReact(myReaction?.type ? myReaction.type : 'like');
  };

  const myReaction = reactions.find(r => r.userId === user?.uid);
  
  // Aggregate reactions
  const reactionCounts = reactions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
      {/* Counts */}
      <div className="flex items-center justify-between text-sm text-slate-500 mb-4 px-2">
        <div className="flex items-center gap-2">
          {Object.entries(reactionCounts).length > 0 ? (
            <div className="flex items-center gap-1">
              {Object.keys(reactionCounts).slice(0, 3).map(type => (
                <span key={type} className="text-lg">{REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS]}</span>
              ))}
              <span className="ml-1">{reactions.length}</span>
            </div>
          ) : (
            <span>Chưa có lượt thích</span>
          )}
        </div>
        <div>
          {comments.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="hover:underline">
              {comments.length} bình luận
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-y border-slate-100 dark:border-slate-800 py-2 relative">
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button 
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onClick={handleClickLikeButton}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              myReaction 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {myReaction ? (
              <span className="text-xl">{REACTION_EMOJIS[myReaction.type as keyof typeof REACTION_EMOJIS]}</span>
            ) : (
              <ThumbsUp className="w-5 h-5" />
            )}
            {myReaction ? <span className="capitalize">{myReaction.type}</span> : 'Thích'}
          </button>
          
          {/* Reaction Picker Popup */}
          {showReactionPicker && (
            <div 
              onMouseEnter={handlePickerEnter}
              onMouseLeave={handleMouseLeave}
              className="absolute bottom-full left-0 pb-2 z-10 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full px-2 py-1 flex items-center gap-1">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(type);
                    }}
                    className="text-2xl hover:scale-125 hover:-translate-y-1 transition-transform p-1"
                    title={type}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Bình luận
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 space-y-4">
          <div className="space-y-4 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {((comment.userEmail || comment.userId)?.toString() || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 inline-block">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{(comment.userEmail || 'Anonymous').split('@')[0]}</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-1 px-4 text-xs text-slate-500">
                    <span>{formatDate(comment.createdAt)}</span>
                    {(isAdmin || user?.uid === comment.userId) && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="hover:text-red-500 transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
              {(user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Viết bình luận..."
                className="w-full pl-4 pr-10 py-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-0 rounded-full text-sm outline-none transition-all"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

