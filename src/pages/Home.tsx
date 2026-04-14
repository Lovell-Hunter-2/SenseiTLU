import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Search, Plus, Book, Calculator, Code, Globe, Database, Cpu, FileText, Briefcase, Scale, Lightbulb, Brain, PieChart, ShoppingCart, Rocket } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Icon mapping helper
const iconMap: Record<string, React.ElementType> = {
  Book, Calculator, Code, Globe, Database, Cpu, FileText, Briefcase, Scale, Lightbulb, Brain, PieChart, ShoppingCart, Rocket
};

export default function Home() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useAuth();
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '', iconName: 'Book' });

  useEffect(() => {
    const q = query(collection(db, 'subjects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subs);
    }, (error) => {
      console.error("Error fetching subjects:", error);
    });
    return unsubscribe;
  }, []);

  const filteredSubjects = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sub.description && sub.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    
    try {
      await addDoc(collection(db, 'subjects'), {
        name: newSubject.name,
        description: newSubject.description,
        iconName: newSubject.iconName,
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewSubject({ name: '', description: '', iconName: 'Book' });
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero / Search Section */}
      <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          📚 Tài liệu <span className="text-blue-600 dark:text-blue-400">SenseiTLU</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl">
          Nền tảng chia sẻ tài liệu học tập, giáo trình, đề cương và thi thử trực tuyến dành cho sinh viên.
        </p>
        
        <div className="relative w-full max-w-xl mt-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            placeholder="Tìm môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Subjects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <div className="w-2 h-4 bg-blue-500 rounded-sm"></div>
            Danh sách môn học
          </h2>
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm môn
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map(subject => {
            const Icon = iconMap[subject.iconName] || Book;
            return (
              <div key={subject.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2">{subject.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
                  {subject.description || `Tổng hợp tài liệu môn ${subject.name}`}
                </p>
                <Link
                  to={`/subject/${subject.id}`}
                  className="w-full text-center bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Xem ngay <span className="text-lg leading-none">→</span>
                </Link>
              </div>
            );
          })}
        </div>
        
        {filteredSubjects.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Không tìm thấy môn học nào phù hợp.
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">Thêm môn học mới</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên môn học</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.name}
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.description}
                  onChange={e => setNewSubject({...newSubject, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.iconName}
                  onChange={e => setNewSubject({...newSubject, iconName: e.target.value})}
                >
                  {Object.keys(iconMap).map(key => (
                    <option key={key} value={key} className="text-slate-900">{key}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
