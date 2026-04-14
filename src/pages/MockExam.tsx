import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { ArrowLeft, Settings, Play, CheckCircle2, XCircle, RefreshCcw, Lightbulb, Book, Menu, X, User, Quote, Home as HomeIcon, RotateCcw, Eye, Minus, Plus } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const lowScoreQuotes = [
  "Đừng vội bỏ cuộc, vì những điều đẹp nhất có khi lại đến vào lúc mình không ngờ nhất.",
  "Thất bại là mẹ thành công. Mỗi câu sai là một bài học quý giá.",
  "Không có gì là không thể, chỉ là bạn chưa tìm ra cách mà thôi. Cố lên!",
  "Học tập là một quá trình. Đừng buồn vì kết quả hôm nay, hãy nỗ lực cho ngày mai.",
  "Khó khăn không phải để cản bước bạn, mà là để bạn chứng minh bản lĩnh của mình.",
  "Mọi chuyên gia đều từng là người mới bắt đầu. Đừng nản lòng!",
  "Sai lầm là bằng chứng cho thấy bạn đang cố gắng.",
  "Đừng so sánh mình với người khác, hãy so sánh mình của ngày hôm nay với ngày hôm qua.",
  "Chỉ cần bạn không dừng lại, việc tiến chậm cũng không sao cả.",
  "Hãy coi đây là cơ hội để nhận ra những lỗ hổng kiến thức và lấp đầy chúng."
];

const mediumScoreQuotes = [
  "Bạn đang làm rất tốt! Chỉ cần cố gắng thêm một chút nữa thôi là đạt đỉnh cao rồi.",
  "Kết quả khá ổn! Hãy xem lại những câu sai để rút kinh nghiệm nhé.",
  "Sự tiến bộ của bạn rất đáng ghi nhận. Tiếp tục phát huy nhé!",
  "Bạn đã nắm được phần lớn kiến thức rồi. Ôn tập thêm một chút là hoàn hảo.",
  "Thành công đang ở rất gần. Đừng chùn bước!",
  "Một kết quả xứng đáng với nỗ lực của bạn. Hãy cố gắng để đạt điểm tuyệt đối lần sau.",
  "Bạn có tiềm năng rất lớn. Hãy tiếp tục mài giũa kiến thức của mình.",
  "Đừng tự mãn với kết quả hiện tại, hãy luôn hướng tới những mục tiêu cao hơn.",
  "Mỗi bước đi đều mang bạn đến gần hơn với đích đến. Tiếp tục bước đi nhé!",
  "Cố gắng lên, bạn sắp chạm tới vạch đích rồi!"
];

const highScoreQuotes = [
  "Tuyệt vời! Bạn thực sự là một cao thủ trong môn học này.",
  "Kết quả xuất sắc! Hãy giữ vững phong độ này nhé.",
  "Kiến thức của bạn rất vững vàng. Chúc mừng bạn!",
  "Không có gì có thể làm khó bạn được nữa. Quá đỉnh!",
  "Bạn là nguồn cảm hứng cho những người khác. Tiếp tục tỏa sáng nhé!",
  "Thành quả này hoàn toàn xứng đáng với sự chăm chỉ của bạn.",
  "Hoàn hảo! Không còn từ ngữ nào để diễn tả sự xuất sắc của bạn.",
  "Bạn đã chứng minh được năng lực thực sự của mình. Chúc mừng!",
  "Hãy tự hào về bản thân vì những gì bạn đã đạt được.",
  "Đỉnh cao tri thức là đây! Tiếp tục chinh phục những đỉnh cao mới nhé."
];

export default function MockExam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState<any>(null);
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  
  // Quiz Settings
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  
  // Quiz State
  const [status, setStatus] = useState<'setup' | 'generating' | 'active' | 'finished' | 'review'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  
  // UI State
  const [isNavOpen, setIsNavOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsNavOpen(true);
      } else if (status === 'active' || status === 'review') {
        setIsNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [status]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const docRef = doc(db, 'subjects', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSubject({ id: docSnap.id, ...docSnap.data() });
      }

      const q = query(collection(db, 'documents'), where('subjectId', '==', id));
      const querySnapshot = await getDocs(q);
      const chapters = new Set<string>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isFolder && data.items) {
          data.items.forEach((item: any) => {
            if (item.title) chapters.add(item.title.trim());
          });
        } else if (data.chapter) {
          data.chapter.split(',').forEach((c: string) => {
            const trimmed = c.trim();
            if (trimmed) chapters.add(trimmed);
          });
        }
      });
      
      const chapterList = Array.from(chapters).sort();
      setAvailableChapters(chapterList);
      setSelectedChapters(chapterList);
    };
    
    fetchData();
  }, [id]);

  const toggleChapter = (chapter: string) => {
    setSelectedChapters(prev => 
      prev.includes(chapter) 
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter]
    );
  };

  const generateQuiz = async () => {
    if (!subject) return;
    setStatus('generating');

    try {
      const prompt = `
        Tạo một bài trắc nghiệm đại học môn "${subject.name}".
        ${selectedChapters.length > 0 ? `Tập trung vào các phần/chương: ${selectedChapters.join(', ')}.` : ''}
        Số lượng câu hỏi: ${numQuestions}.
        Trả về kết quả dưới dạng mảng JSON hợp lệ, không có markdown formatting (không có \`\`\`json).
        Mỗi phần tử trong mảng là một object có cấu trúc:
        {
          "question": "Nội dung câu hỏi",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correctIndex": 0,
          "explanation": "Giải thích ngắn gọn tại sao đáp án này đúng"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (text) {
        const parsedQuestions = JSON.parse(text) as Question[];
        setQuestions(parsedQuestions);
        setStatus('active');
        setCurrentIndex(0);
        setUserAnswers({});
        if (window.innerWidth < 1024) setIsNavOpen(false);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      alert("Có lỗi xảy ra khi tạo đề thi. Vui lòng thử lại.");
      setStatus('setup');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (status !== 'active') return;
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const submitQuiz = () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < questions.length) {
      if (!window.confirm(`Bạn mới làm ${answeredCount}/${questions.length} câu. Bạn có chắc chắn muốn nộp bài?`)) {
        return;
      }
    }
    setStatus('finished');
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) correct++;
    });
    return correct;
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setCurrentIndex(0);
    setStatus('active');
  };

  // --- RENDER HELPERS ---

  const renderQuestionNav = () => (
    <div className={`fixed lg:sticky lg:top-24 inset-y-0 right-0 z-40 w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col h-screen lg:h-[calc(100vh-8rem)] rounded-xl shadow-sm ${isNavOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:hidden'}`}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-lg">Bảng câu hỏi</h3>
        <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsNavOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, idx) => {
            const isAnswered = userAnswers[idx] !== undefined;
            const isCurrent = currentIndex === idx;
            let btnClass = "w-10 h-10 rounded-lg font-medium text-sm flex items-center justify-center transition-all ";
            
            if (status === 'review') {
              const isCorrect = userAnswers[idx] === questions[idx].correctIndex;
              if (!isAnswered) btnClass += "bg-slate-100 dark:bg-slate-800 text-slate-400 ";
              else if (isCorrect) btnClass += "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ";
              else btnClass += "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ";
            } else {
              if (isCurrent) btnClass += "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 ";
              if (isAnswered) btnClass += "bg-blue-500 text-white ";
              else btnClass += "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ";
            }

            return (
              <button key={idx} onClick={() => { setCurrentIndex(idx); if(window.innerWidth < 1024) setIsNavOpen(false); }} className={btnClass}>
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
      {status === 'active' && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={submitQuiz} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors">
            Nộp bài
          </button>
        </div>
      )}
      {status === 'review' && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={() => setStatus('finished')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
            Về kết quả
          </button>
        </div>
      )}
    </div>
  );

  // --- RENDER STATES ---

  if (!subject) return <div className="py-12 text-center">Đang tải...</div>;

  if (status === 'setup') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => navigate(`/subject/${id}`)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại môn học
        </button>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cài đặt bài thi</h1>
              <p className="text-slate-500 dark:text-slate-400">Môn: {subject.name}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Số lượng câu hỏi</label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setNumQuestions(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input 
                  type="number" 
                  min="1" 
                  value={numQuestions === 0 ? '' : numQuestions} 
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setNumQuestions(0);
                    } else {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setNumQuestions(val);
                    }
                  }}
                  onBlur={() => {
                    if (numQuestions < 1) setNumQuestions(10);
                  }}
                  className="w-24 h-10 text-center font-bold text-lg bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button 
                  onClick={() => setNumQuestions(prev => prev + 1)}
                  className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {availableChapters.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Phạm vi ôn tập (Chương/Phần)</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedChapters.length === availableChapters.length && availableChapters.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChapters([...availableChapters]);
                        } else {
                          setSelectedChapters([]);
                        }
                      }}
                    />
                    <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Chọn tất cả</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableChapters.map(chapter => (
                    <button key={chapter} onClick={() => toggleChapter(chapter)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedChapters.includes(chapter) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500'}`}>
                      {chapter}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={generateQuiz} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors mt-8">
              <Play className="w-5 h-5" /> Bắt đầu thi ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'generating') {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-6">
        <div className="inline-block relative w-20 h-20">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold">Chờ chút SenseiTLU đang soạn đề...</h2>
        <p className="text-slate-500 dark:text-slate-400">Đang phân tích tài liệu môn {subject.name} và tạo {numQuestions} câu hỏi trắc nghiệm.</p>
      </div>
    );
  }

  if (status === 'finished') {
    const correct = calculateScore();
    const incorrect = Object.keys(userAnswers).length - correct;
    const percentage = Math.round((correct / questions.length) * 100);
    
    let emoji = '🤩';
    let message = 'Xuất sắc!';
    let quoteList = highScoreQuotes;
    
    if (percentage < 50) { 
      emoji = '😅'; 
      message = 'Ôn tập lại nha!'; 
      quoteList = lowScoreQuotes;
    } else if (percentage < 80) { 
      emoji = '😊'; 
      message = 'Làm tốt lắm!'; 
      quoteList = mediumScoreQuotes;
    }

    // Select a random quote from the appropriate list
    const randomQuote = quoteList[Math.floor(Math.random() * quoteList.length)];

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1a1d2d] dark:bg-[#131524] rounded-3xl p-8 shadow-xl border border-slate-800 text-white">
          <div className="text-center space-y-2 mb-8">
            <div className="text-6xl mb-4">{emoji}</div>
            <h2 className="text-3xl font-bold">{message}</h2>
            <p className="text-slate-400">Bạn đúng {correct}/{questions.length} câu</p>
            <div className="flex items-center justify-center gap-2 text-sm text-blue-400 mt-2">
              <User className="w-4 h-4" /> {user?.displayName || 'Khách'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#24283b] dark:bg-[#1a1d2d] rounded-2xl p-4 text-center border border-slate-800/50">
              <div className="text-3xl font-bold text-green-400 mb-1">{correct}</div>
              <div className="text-sm text-slate-400">Đúng</div>
            </div>
            <div className="bg-[#24283b] dark:bg-[#1a1d2d] rounded-2xl p-4 text-center border border-slate-800/50">
              <div className="text-3xl font-bold text-red-400 mb-1">{incorrect}</div>
              <div className="text-sm text-slate-400">Sai</div>
            </div>
            <div className="bg-[#24283b] dark:bg-[#1a1d2d] rounded-2xl p-4 text-center border border-slate-800/50">
              <div className="text-3xl font-bold text-purple-400 mb-1">{percentage}%</div>
              <div className="text-sm text-slate-400">Điểm</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <button onClick={resetQuiz} className="flex items-center justify-center gap-2 py-3 bg-[#6b4cff] hover:bg-[#5a3ee0] text-white rounded-xl font-medium transition-colors">
              <RotateCcw className="w-4 h-4" /> Làm lại
            </button>
            <button onClick={() => { setStatus('review'); setCurrentIndex(0); }} className="flex items-center justify-center gap-2 py-3 bg-[#24283b] hover:bg-[#2f344d] text-white rounded-xl font-medium transition-colors border border-slate-700">
              <Eye className="w-4 h-4" /> Xem đáp án
            </button>
            <button onClick={() => navigate('/')} className="flex items-center justify-center gap-2 py-3 bg-[#24283b] hover:bg-[#2f344d] text-white rounded-xl font-medium transition-colors border border-slate-700">
              <HomeIcon className="w-4 h-4" /> Trang chủ
            </button>
          </div>

          <div className="bg-[#151723] dark:bg-[#0f111a] rounded-2xl p-6 border border-slate-800/50 relative overflow-hidden">
            <Quote className="absolute top-4 right-4 w-12 h-12 text-slate-800 opacity-50" />
            <div className="relative z-10 space-y-4">
              <div className="text-xl">🌱</div>
              <p className="text-slate-300 italic font-medium leading-relaxed">
                "{randomQuote}"
              </p>
              <div className="text-xs text-slate-500 font-bold tracking-widest uppercase">
                ✦ SENSEITLU ✦
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active & Review States share similar layout
  const currentQ = questions[currentIndex];
  const userAnswer = userAnswers[currentIndex];
  const isReview = status === 'review';

  return (
    <div className="flex flex-col lg:flex-row -mx-4 sm:mx-0">
      {/* Main Content */}
      <div className="flex-1 min-w-0 px-4 sm:px-0">
        <div className="max-w-3xl w-full mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsNavOpen(!isNavOpen)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Menu className="w-6 h-6" />
              </button>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Câu {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium truncate max-w-[150px] sm:max-w-xs">
              {subject.name}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
              {currentQ.question}
            </h2>

            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                let btnClass = "w-full text-left p-4 rounded-xl border transition-all ";
                
                if (!isReview) {
                  if (userAnswer === idx) {
                    btnClass += "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500";
                  } else {
                    btnClass += "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800/50";
                  }
                } else {
                  if (idx === currentQ.correctIndex) {
                    btnClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                  } else if (idx === userAnswer) {
                    btnClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                  } else {
                    btnClass += "border-slate-200 dark:border-slate-800 opacity-50";
                  }
                }

                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={isReview} className={btnClass}>
                    <div className="flex items-start gap-3">
                      <span className="font-bold shrink-0 w-6">{String.fromCharCode(65 + idx)}.</span>
                      <span>{option}</span>
                      {isReview && idx === currentQ.correctIndex && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto shrink-0" />}
                      {isReview && idx === userAnswer && idx !== currentQ.correctIndex && <XCircle className="w-5 h-5 text-red-500 ml-auto shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {isReview && (
              <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" /> Giải thích
                </h4>
                <p className="text-blue-900 dark:text-blue-200 text-sm md:text-base leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} 
              disabled={currentIndex === 0}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium disabled:opacity-50 transition-colors"
            >
              ← Trước
            </button>
            <button 
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} 
              disabled={currentIndex === questions.length - 1}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium disabled:opacity-50 transition-colors"
            >
              Sau →
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isNavOpen && <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 lg:hidden" onClick={() => setIsNavOpen(false)} />}

      {/* Sidebar */}
      {renderQuestionNav()}
    </div>
  );
}
