import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';
import BlogInteractions from '../components/BlogInteractions';

const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(url) || url.includes('drive.google.com/uc') || url.includes('images');
};

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const { isAdmin } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', imageUrl: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Blog TLU";
    const q = query(collection(db, 'blog'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(fetchedPosts);
    });
    return unsubscribe;
  }, []);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    try {
      await addDoc(collection(db, 'blog'), {
        title: newPost.title,
        content: newPost.content,
        imageUrl: newPost.imageUrl,
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewPost({ title: '', content: '', imageUrl: '' });
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'blog', postId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog & Cập nhật</h1>
          <p className="text-slate-500 dark:text-slate-400">Thông tin mới nhất, thông báo và chia sẻ từ quản trị viên.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> Viết bài mới
          </button>
        )}
      </div>

      <div className="space-y-8">
        {posts.map(post => (
          <article key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {post.imageUrl && (
              <div className="w-full h-64 sm:h-80 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.createdAt)}
                </div>
                {isAdmin && (
                  <button onClick={() => setDeleteConfirmId(post.id)} className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-4">{post.title}</h2>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => {
                      if (props.href && isImageUrl(props.href)) {
                        return <img src={props.href} alt="Blog image" className="rounded-xl max-w-full h-auto my-4" referrerPolicy="no-referrer" />;
                      }
                      return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />;
                    },
                    img: ({ node, ...props }) => (
                      <img {...props} className="rounded-xl max-w-full h-auto my-4" referrerPolicy="no-referrer" />
                    )
                  }}
                >
                  {post.content}
                </Markdown>
              </div>
              <BlogInteractions postId={post.id} />
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Chưa có bài viết nào</h3>
            <p className="text-slate-500 dark:text-slate-400">Các thông báo và cập nhật mới sẽ xuất hiện ở đây.</p>
          </div>
        )}
      </div>

      {/* Add Post Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Viết bài mới</h3>
            <form onSubmit={handleAddPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPost.title}
                  onChange={e => setNewPost({...newPost, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Ảnh bìa (Tùy chọn)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPost.imageUrl}
                  onChange={e => setNewPost({...newPost, imageUrl: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung</label>
                <textarea
                  required
                  rows={8}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={newPost.content}
                  onChange={e => setNewPost({...newPost, content: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                >
                  Đăng bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Xóa bài viết?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeletePost(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
