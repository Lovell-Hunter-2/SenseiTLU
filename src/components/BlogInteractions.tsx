import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ThumbsUp, Trash2, MessageCircle, Send, Plus, X, Image as ImageIcon, Share2 } from 'lucide-react';
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
  const [showReactors, setShowReactors] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [shareText, setShareText] = useState('Chia sẻ');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const canEditComment = (comment: any) => {
    if (isAdmin) return true;
    if (comment.userId !== user?.uid) return false;
    if (!comment.createdAt) return false;
    
    const postDate = comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt);
    if (isNaN(postDate.getTime())) return false;
    
    const now = new Date();
    const diffInMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);
    return diffInMinutes <= 30;
  };

  const handleShare = () => {
    const url = `${window.location.origin}/blog#post-${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareText('Đã copy!');
      setTimeout(() => setShareText('Chia sẻ'), 2000);
    });
  };

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
    if (!newComment.trim() && !attachmentUrl) return;

    // Check cooldown
    const lastCommentTime = localStorage.getItem('last_comment_time');
    if (lastCommentTime && Date.now() - parseInt(lastCommentTime) < 20000) {
      alert('Hệ thống đang xử lý. Vui lòng đợi 20 giây trước khi bình luận mới để tránh spam!');
      return;
    }
    localStorage.setItem('last_comment_time', Date.now().toString());

    try {
      await addDoc(collection(db, 'blog', postId, 'comments'), {
        content: newComment.trim(),
        imageUrl: attachmentUrl,
        userId: user.uid,
        userEmail: user.email || 'Anonymous',
        createdAt: serverTimestamp()
      });
      setNewComment('');
      setAttachmentUrl('');
      setShowAttachMenu(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const file = e.clipboardData?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    e.preventDefault();
    if (file.type === 'image/gif' && file.size > 700 * 1024) {
      alert('Kích thước ảnh GIF quá lớn. Vui lòng chọn GIF dưới 700KB.');
      return;
    } else if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (file.type === 'image/gif') {
        setAttachmentUrl(reader.result as string);
      } else {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          const MAX = 1200;
          if (w > h && w > MAX) { h *= MAX/w; w = MAX; }
          else if (h > MAX) { w *= MAX/h; h = MAX; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          setAttachmentUrl(canvas.toDataURL('image/webp', 0.8));
        };
        img.src = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
  };


  const handleDeleteComment = async (comment: any) => {
    if (!canEditComment(comment)) {
        alert("Đã hết thời gian 30 phút để xóa bình luận này.");
        return;
    }
    if (!window.confirm('Chắc chắn xóa bình luận này?')) return;
    try {
      await deleteDoc(doc(db, 'blog', postId, 'comments', comment.id));
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
            <div 
              className={`flex items-center gap-1 ${isAdmin ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors' : ''}`}
              onClick={() => isAdmin && setShowReactors(true)}
            >
              {Object.keys(reactionCounts).slice(0, 3).map(type => (
                <span key={type} className="text-lg">{REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS]}</span>
              ))}
              <span className="ml-1 font-medium">{reactions.length}</span>
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

        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
        >
          <Share2 className="w-5 h-5" />
          {shareText}
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
                    {comment.content && <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{comment.content}</p>}
                    {comment.imageUrl && (
                       <img 
                          src={comment.imageUrl} 
                          alt="attachment" 
                          className="rounded-lg max-w-full max-h-64 mt-2 object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                          referrerPolicy="no-referrer" 
                          onClick={() => setSelectedImage(comment.imageUrl)}
                       />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 px-4 text-xs text-slate-500">
                    <span>{formatDate(comment.createdAt)}</span>
                    {canEditComment(comment) && (
                      <button 
                        onClick={() => handleDeleteComment(comment)}
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

          <form onSubmit={handleAddComment} className="flex gap-2 items-end">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 mt-1">
              {(user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 relative flex flex-col gap-2">
              {attachmentUrl && (
                <div className="relative inline-block w-fit">
                  <img src={attachmentUrl} alt="Preview" className="h-20 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white" />
                  <button type="button" onClick={() => setAttachmentUrl('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                </div>
              )}
              <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-full border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                <button
                  type="button"
                  className="pl-3 pr-2 py-2 text-slate-500 hover:text-blue-500 transition-colors"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                >
                  <Plus className="w-5 h-5" />
                </button>
                {showAttachMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden z-10 p-1">
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-sm whitespace-nowrap">
                      <ImageIcon className="w-4 h-4" /> Tải lên ảnh
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.type === 'image/gif' && file.size > 700 * 1024) {
                            alert('Kích thước ảnh GIF quá lớn. Vui lòng chọn GIF dưới 700KB.');
                            return;
                          } else if (file.size > 5 * 1024 * 1024) {
                            alert('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (file.type === 'image/gif') {
                              setAttachmentUrl(reader.result as string);
                            } else {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                let w = img.width, h = img.height;
                                const MAX = 1200;
                                if (w > h && w > MAX) { h *= MAX/w; w = MAX; }
                                else if (h > MAX) { w *= MAX/h; h = MAX; }
                                canvas.width = w; canvas.height = h;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, w, h);
                                setAttachmentUrl(canvas.toDataURL('image/webp', 0.8));
                              };
                              img.src = reader.result as string;
                            }
                          };
                          reader.readAsDataURL(file);
                          setShowAttachMenu(false);
                        }}
                      />
                    </label>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Viết bình luận... (Có thể dán ảnh)"
                  className="flex-1 py-2 bg-transparent outline-none text-sm placeholder-slate-400"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onPaste={handlePaste}
                />
                <button 
                  type="submit" 
                  disabled={!newComment.trim() && !attachmentUrl}
                  className="mr-2 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {/* Reactors Modal for Admin */}
      {isAdmin && showReactors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-blue-500" /> Người đã bày tỏ cảm xúc
              </h3>
              <button
                onClick={() => setShowReactors(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {reactions.length === 0 ? (
                <div className="text-center text-slate-500 py-4">Chưa có ai bày tỏ cảm xúc</div>
              ) : (
                reactions.map((reaction, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {(reaction.userEmail?.toString() || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {reaction.userEmail || 'Anonymous'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(reaction.updatedAt)}
                      </p>
                    </div>
                    <div className="text-2xl shrink-0">
                      {REACTION_EMOJIS[reaction.type as keyof typeof REACTION_EMOJIS]}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Phóng to" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}

