import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateWithFallback, AIMessage } from '../services/aiService';
import { ArrowLeft, Settings, Play, CheckCircle2, XCircle, RefreshCcw, Lightbulb, Book, Menu, X, User, Quote, Home as HomeIcon, RotateCcw, Eye, Minus, Plus, UploadCloud, FileText, Trash2, Share2, ClipboardCheck, Lock, LogIn } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const loadPdfJs = async (): Promise<any> => {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjs);
    };
    script.onerror = () => reject(new Error("Không thể tải thư viện đọc PDF"));
    document.body.appendChild(script);
  });
};

const loadMammothJs = async (): Promise<any> => {
  if ((window as any).mammoth) return (window as any).mammoth;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.onload = () => resolve((window as any).mammoth);
    script.onerror = () => reject(new Error("Không thể tải mammoth"));
    document.body.appendChild(script);
  });
};

const loadSheetJs = async (): Promise<any> => {
  if ((window as any).XLSX) return (window as any).XLSX;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () => reject(new Error("Không thể tải SheetJS"));
    document.body.appendChild(script);
  });
};

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
  const { id, examId } = useParams<{ id: string, examId?: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [subject, setSubject] = useState<any>(null);
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [documentTitles, setDocumentTitles] = useState<string[]>([]);
  const [loadedExamId, setLoadedExamId] = useState<string | null>(examId || null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Quiz Settings
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState(0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [retakeWrong, setRetakeWrong] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [examMode, setExamMode] = useState<'instant' | 'submit'>('submit');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Custom File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  interface UploadedFile {
    name: string;
    text: string;
    status: 'extracting' | 'done' | 'error';
  }
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Initialize state from sessionStorage if available
  const STORAGE_KEY = `mockExamState_${id}`;
  const getInitialState = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };
  const initialState = getInitialState();

  // Quiz State
  const [status, setStatus] = useState<'setup' | 'generating' | 'active' | 'finished' | 'review' | 'retake_wrong'>(initialState?.status || 'setup');
  const [questions, setQuestions] = useState<Question[]>(initialState?.questions || []);
  const [currentIndex, setCurrentIndex] = useState(initialState?.currentIndex || 0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>(initialState?.userAnswers || {});
  
  // Timer Effect
  useEffect(() => {
    if (status === 'active' && timeLimit > 0 && timeRemaining !== null && timeRemaining > 0) {
      const timerId = setInterval(() => setTimeRemaining(prev => prev !== null ? prev - 1 : null), 1000);
      return () => clearInterval(timerId);
    } else if (status === 'active' && timeLimit > 0 && timeRemaining === 0) {
      alert('Đã hết thời gian làm bài!');
      submitQuiz();
    }
  }, [status, timeRemaining, timeLimit]);

  useEffect(() => {
    document.title = subject ? `Thi ${subject.name} TLU` : "Luyện đề TLU";
  }, [subject]);

  // Audio refs context
  const playSound = (isCorrect: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (isCorrect) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch(e) { console.error(e) }
  };
  
  // UI State
  const [isNavOpen, setIsNavOpen] = useState(window.innerWidth >= 1024);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (status !== 'setup' && status !== 'generating') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        status,
        questions,
        currentIndex,
        userAnswers
      }));
    } else if (status === 'setup') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [status, questions, currentIndex, userAnswers, STORAGE_KEY]);

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
      const titles = new Set<string>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.title) titles.add(data.title.trim());
        if (data.isFolder && data.items) {
          data.items.forEach((item: any) => {
            if (item.title) chapters.add(item.title.trim());
            if (item.title) titles.add(item.title.trim());
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
      setDocumentTitles(Array.from(titles));
    };
    
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      try {
        const docRef = doc(db, 'mockExams', examId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setQuestions(data.questions || []);
          setTimeLimit(data.examConfig?.timeLimit || 0);
          setExamMode(data.examConfig?.examMode || 'submit');
          setNumQuestions(data.questions?.length || 10);
          
          setStatus('active');
          setCurrentIndex(0);
          setUserAnswers({});
          setTimeRemaining(data.examConfig?.timeLimit > 0 ? data.examConfig.timeLimit * 60 : null);
          if (window.innerWidth < 1024) setIsNavOpen(false);
          
        } else {
          alert('Đề thi không tồn tại hoặc đã bị xóa.');
          navigate(`/subject/${id}/mock-exam`);
        }
      } catch (error) {
        console.error("Error loading exam:", error);
        alert('Lỗi tải đề thi.');
      }
    };
    
    // Only load if status is setup, meaning we haven't started playing or it's a fresh load
    if (status === 'setup') {
      loadExam();
    }
  }, [examId, id, navigate]);

  const toggleChapter = (chapter: string) => {
    setSelectedChapters(prev => 
      prev.includes(chapter) 
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter]
    );
  };

  const handleShareExam = async () => {
    try {
      let currentExamId = loadedExamId;
      
      if (!currentExamId) {
        // Save the exam
        const docRef = await addDoc(collection(db, 'mockExams'), {
          subjectId: id,
          authorId: user?.uid || null,
          createdAt: serverTimestamp(),
          questions: questions,
          examConfig: {
            timeLimit,
            examMode,
            numQuestions
          }
        });
        currentExamId = docRef.id;
        setLoadedExamId(currentExamId);
        navigate(`/subject/${id}/mock-exam/${currentExamId}`, { replace: true });
      }
      
      const shareUrl = `${window.location.protocol}//${window.location.host}/subject/${id}/mock-exam/${currentExamId}`;
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Error sharing exam:", error);
      alert("Không thể tạo link chia sẻ.");
    }
  };

  const generateQuiz = async () => {
    if (!subject) return;
    setStatus('generating');

    try {
      const prompt = `
        Tạo một bài trắc nghiệm đại học chuyên ngành cho môn học: "${subject.name}".
        Ngữ cảnh môn học (từ tài liệu Drive): ${documentTitles.length > 0 ? documentTitles.join('; ') : 'Không có thông tin tài liệu'}.
        ${uploadedFiles.filter(f => f.status === 'done').length > 0 ? `\nĐÂY LÀ NỘI DUNG TÀI LIỆU MÀ NGƯỜI DÙNG QUAN TÂM (Trích xuất từ file tải lên):\n${uploadedFiles.filter(f => f.status === 'done').map(f => f.text).join('\\n---\\n').substring(0, 150000)}...\n(HÃY TẠO NHIỀU CÂU HỎI TRỌNG TÂM VÀO NỘI DUNG NÀY NHẤT CÓ THỂ, ưu tiên cao hơn tài liệu chung!).` : ''}
        ${selectedChapters.length > 0 ? `Tập trung câu hỏi vào các phần/chương: ${selectedChapters.join(', ')}.` : ''}
        ${customPrompt ? `YÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG: ${customPrompt}` : ''}
        Số lượng câu hỏi: ${numQuestions}.
        
        QUY TẮC QUAN TRỌNG:
        1. TUYỆT ĐỐI CHỈ ĐẶT CÂU HỎI TRONG PHẠM VI MÔN "${subject.name}" VÀ NGỮ CẢNH TÀI LIỆU CUNG CẤP.
        2. Ví dụ: Nếu môn học là kinh tế, lập trình Python, Java, v.v., hãy nội suy chính xác ngôn ngữ và nội dung qua tên bài học/tài liệu. KHÔNG ĐƯA KIẾN THỨC BÊN NGOÀI (ví dụ: không đưa C++ vào môn học Python/Kinh tế số nếu không có trong tài liệu).
        3. Trả về kết quả dưới dạng mảng JSON hợp lệ, KHÔNG có markdown formatting (không có \`\`\`json).
        
        Mỗi phần tử trong mảng là một object có cấu trúc:
        {
          "question": "Nội dung câu hỏi",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correctIndex": 0,
          "explanation": "Giải thích ngắn gọn tại sao đáp án này đúng"
        }
      `;

      const textResponse = await generateWithFallback({
        messages: [
          {
            role: "system",
            content: "Bạn là một giáo viên kinh nghiệm soạn đề trắc nghiệm đại học. Bạn phải CỰC KỲ TUÂN THỦ TÊN MÔN HỌC và NGỮ CẢNH TÀI LIỆU được cung cấp, không được tự ý sinh nội dung từ công nghệ/ngôn ngữ khác nếu không được nhắc đến. Luôn trả về kết quả ĐÚNG định dạng JSON array hợp lệ. KHÔNG có text xung quanh, KHÔNG có markdown block. Kết quả phải bắt đầu bằng [ và kết thúc bằng ]."
          },
          { role: "user", content: prompt }
        ],
        jsonMode: true
      });

      let parsedQuestions: Question[] | null = null;
        
        let cleanedText = textResponse;
        if (cleanedText.startsWith('```json')) cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '').trim();
        else if (cleanedText.startsWith('```')) cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '').trim();
        
        // Remove bad control characters, escaping newlines inside string literals
        cleanedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
        cleanedText = cleanedText.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
          return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        });
        
        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed)) {
          parsedQuestions = parsed as Question[];
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          parsedQuestions = parsed.questions as Question[];
        } else if (parsed.data && Array.isArray(parsed.data)) {
          parsedQuestions = parsed.data as Question[];
        }

        if (parsedQuestions && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          setStatus('active');
          setCurrentIndex(0);
          setUserAnswers({});
          setTimeRemaining(timeLimit > 0 ? timeLimit * 60 : null);
          if (window.innerWidth < 1024) setIsNavOpen(false);
        } else {
          throw new Error("Không thể tạo câu hỏi hợp lệ");
        }
      } catch (error: any) {
      console.error("Error generating quiz:", error);
      let errorMessage = "Có lỗi xảy ra khi tạo đề thi. Vui lòng thử lại.";
      
      if (error?.message?.includes("429") || error?.status === 429 || error?.message?.toLowerCase().includes("quota") || error?.message?.includes("429 Too Many Requests")) {
        errorMessage = "Hệ thống đang quá tải do có nhiều người sử dụng (hết lượng request API). Cậu vào phần Cài đặt của app này (kéo xuống chỗ biến môi trường), và điền DEEPSEEK_API_KEY vào để có thêm phương án dự phòng khi Gemini bị nghẽn nhé!";
      } else if (error?.message) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      alert(errorMessage);
      setStatus('setup');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (status !== 'active' && status !== 'retake_wrong') return;
    
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    
    if (examMode === 'instant') {
      const isCorrect = optionIndex === questions[currentIndex].correctIndex;
      playSound(isCorrect);
    }
  };

  const confirmExit = () => {
    if (status === 'active' || status === 'retake_wrong') {
      if (window.confirm("Bạn đang làm bài. Bạn có chắc chắn muốn thoát và tạo đề mới không? Các lựa chọn hiện tại sẽ bị mất.")) {
        setStatus('setup');
      }
    } else {
      setStatus('setup');
    }
  };

  const submitQuiz = () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < questions.length && timeRemaining !== 0) {
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
    setTimeRemaining(timeLimit > 0 ? timeLimit * 60 : null);
    setStatus('active');
  };

  const startRetakeWrong = () => {
    // Find the first wrong question
    let firstWrongIdx = -1;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] !== q.correctIndex && firstWrongIdx === -1) {
        firstWrongIdx = idx;
      }
    });

    if (firstWrongIdx !== -1) {
      setCurrentIndex(firstWrongIdx);
      setStatus('retake_wrong');
    } else {
      alert("Bạn không có câu sai nào cả!");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check limit of 5 files maximum
    if (uploadedFiles.length + files.length > 5) {
      alert("Bạn chỉ có thể tải lên tối đa 5 file cùng lúc.");
      return;
    }

    const newUploadedFiles = files.map(file => ({
      name: file.name,
      text: '',
      status: 'extracting' as const
    }));

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

    for (const file of files) {
      try {
        let extractedText = "";

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const pdfjs = await loadPdfJs();
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          const maxPages = Math.min(pdf.numPages, 30); // Giới hạn đọc 30 trang
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            extractedText += textContent.items.map((item: any) => item.str).join(' ') + '\\n';
          }
          if (pdf.numPages > 30) {
            extractedText += '\\n [Đã cắt bớt nội dung vì file quá dài...]';
          }
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          const mammoth = await loadMammothJs();
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
        } else if (file.name.match(/\\.(xlsx|xls|csv)$/i)) {
          const XLSX = await loadSheetJs();
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          extractedText = XLSX.utils.sheet_to_csv(worksheet);
        } else {
          // Assume text file
          extractedText = await file.text();
        }

        const limitedText = extractedText.substring(0, 50000); // 50K chars per file
        
        setUploadedFiles(prev => prev.map(f => 
          f.name === file.name 
            ? { ...f, text: limitedText, status: 'done' } 
            : f
        ));
      } catch (err) {
        console.error("Lỗi khi đọc file:", file.name, err);
        setUploadedFiles(prev => prev.map(f => 
          f.name === file.name 
            ? { ...f, status: 'error' } 
            : f
        ));
      }
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            } else if (status === 'retake_wrong') {
              const originallyWrong = userAnswers[idx] !== questions[idx].correctIndex;
              if (!originallyWrong) {
                btnClass += "bg-green-100/50 text-green-700/50 dark:bg-green-900/10 dark:text-green-400/50 cursor-not-allowed ";
              } else {
                if (isCurrent) btnClass += "ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-slate-900 ";
                btnClass += "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 ";
              }
            } else {
              if (isCurrent) btnClass += "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 ";
              if (examMode === 'instant' && isAnswered) {
                const isCorrect = userAnswers[idx] === questions[idx].correctIndex;
                if (isCorrect) btnClass += "bg-green-500 text-white ";
                else btnClass += "bg-red-500 text-white ";
              } else {
                if (isAnswered) btnClass += "bg-blue-500 text-white ";
                else btnClass += "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ";
              }
            }

            return (
              <button 
                key={idx} 
                onClick={() => {
                  if (status === 'retake_wrong' && userAnswers[idx] === questions[idx].correctIndex) return; // Can't select originally correct ones
                  setCurrentIndex(idx); 
                  if(window.innerWidth < 1024) setIsNavOpen(false); 
                }} 
                className={btnClass}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
      {status === 'active' && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 hidden lg:block">
          <button onClick={submitQuiz} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors">
            Nộp bài
          </button>
        </div>
      )}
      {status === 'retake_wrong' && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 hidden lg:block">
          <button onClick={() => setStatus('finished')} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors">
            Kết thúc điền lại
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

  if (!user) {
    return (
      <div className="py-12 max-w-3xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 sm:p-12 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <div className="flex flex-col items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 border border-slate-100 dark:border-slate-700">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Chưa đăng nhập
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-lg">
              Tính năng <strong>Thi thử & Luyện đề</strong> yêu cầu đăng nhập tài khoản Google để có thể lưu kết quả và cá nhân hóa trải nghiệm học tập của bạn.
            </p>
            <button
              onClick={login}
              className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              <LogIn className="w-5 h-5" /> Đăng nhập ngay
            </button>
            <div className="mt-8 pt-6 border-t border-blue-200/50 dark:border-blue-800/50 w-full">
              <button onClick={() => navigate(-1)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center justify-center gap-2 w-full">
                ← Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subject) return <div className="py-12 text-center text-slate-500">Đang tải thông tin...</div>;

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
            
            {/* Num Questions Selection */}
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

            {/* Time Limit Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Thời gian (phút)</label>
              <p className="text-xs text-slate-500 mb-2">0 = Không giới hạn thời gian</p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setTimeLimit(prev => Math.max(0, prev - 5))}
                  className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input 
                  type="number" 
                  min="0" 
                  value={timeLimit} 
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setTimeLimit(0);
                    } else {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setTimeLimit(val);
                    }
                  }}
                  onBlur={() => {
                    if (timeLimit < 0) setTimeLimit(0);
                  }}
                  className="w-24 h-10 text-center font-bold text-lg bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button 
                  onClick={() => setTimeLimit(prev => prev + 5)}
                  className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Game Modes */}
            <div className="space-y-4 pt-2">
              <label className="block text-sm font-medium">Chế độ thi</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${examMode === 'submit' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                  onClick={() => setExamMode('submit')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input type="radio" checked={examMode === 'submit'} onChange={() => setExamMode('submit')} className="text-blue-600 focus:ring-blue-500" />
                    <span className="font-bold">Chờ xem sau</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-6">Chỉ hiển thị đáp án sau khi nhấn Nộp bài xong.</p>
                </div>
                <div 
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${examMode === 'instant' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                  onClick={() => setExamMode('instant')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input type="radio" checked={examMode === 'instant'} onChange={() => setExamMode('instant')} className="text-blue-600 focus:ring-blue-500" />
                    <span className="font-bold">Xem ngay</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-6">Biết đúng/sai và có giải thích liền ngay khi chọn câu trả lời.</p>
                </div>
              </div>
            </div>

            {/* Extra Options */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-medium mb-2">Tùy chọn phụ</label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={retakeWrong}
                  onChange={(e) => setRetakeWrong(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium">Cho phép làm lại câu sai</span>
                  <p className="text-xs text-slate-500">Chức năng này sẽ hiện khi có kết quả.</p>
                </div>
              </label>

              {examMode === 'instant' && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium">Âm thanh</span>
                    <p className="text-xs text-slate-500">Tiếng tick khi đúng, tạch khi sai (chỉ ở chế độ Xem ngay).</p>
                  </div>
                </label>
              )}
            </div>

            {/* Optional Custom File Upload */}
            <div>
              <label className="block text-sm font-medium mb-1">Tài liệu tham chiếu (Tuỳ chọn)</label>
              <p className="text-xs text-slate-500 mb-2">SenseiTLU sẽ đọc nội dung file để tạo đề siêu sát với tài liệu của cậu.</p>
              
              <div className="space-y-3">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className={`w-full relative border rounded-xl p-3 flex items-center gap-3 ${file.status === 'error' ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20' : 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${file.status === 'error' ? 'bg-red-100 dark:bg-red-800' : 'bg-blue-100 dark:bg-blue-800'}`}>
                      <FileText className={`w-5 h-5 ${file.status === 'error' ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-blue-300'}`} />
                    </div>
                    <div className="min-w-0 pr-8">
                      <div className={`font-medium truncate text-sm ${file.status === 'error' ? 'text-red-900 dark:text-red-100' : 'text-blue-900 dark:text-blue-100'}`}>
                        {file.name}
                      </div>
                      {file.status === 'extracting' ? (
                        <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> 
                          Đang đọc nội dung...
                        </div>
                      ) : file.status === 'done' ? (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã đọc xong ({Math.round(file.text.length / 1024)}KB)
                        </div>
                      ) : (
                         <div className="text-xs text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Lỗi đọc file
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {uploadedFiles.length < 5 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 w-full flex-col h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl flex items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50"
                >
                  <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tải lên file (PDF, TXT, DOCX, XLSX) tối đa 5 file</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple
                    accept=".pdf,.txt,.docx,.doc,.xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tùy chỉnh Prompt (Không bắt buộc)</label>
              <textarea 
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ví dụ: Chỉ hỏi các câu hỏi mức độ vận dụng cao, hoặc chỉ hỏi phần trắc nghiệm tính toán..."
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm h-28 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
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

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button onClick={resetQuiz} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-[#6b4cff] hover:bg-[#5a3ee0] text-white rounded-xl font-medium transition-colors">
              <RotateCcw className="w-4 h-4" /> Làm lại
            </button>
            {retakeWrong && incorrect > 0 && (
              <button onClick={startRetakeWrong} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-colors">
                <RefreshCcw className="w-4 h-4" /> Làm lại câu sai
              </button>
            )}
            <button onClick={() => { setStatus('review'); setCurrentIndex(0); }} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-[#24283b] hover:bg-[#2f344d] text-white rounded-xl font-medium transition-colors border border-slate-700">
              <Eye className="w-4 h-4" /> Xem đáp án
            </button>
            <button onClick={handleShareExam} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors border border-emerald-500">
              {isCopied ? <ClipboardCheck className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} {isCopied ? 'Đã copy link' : 'Chia sẻ đề'}
            </button>
            <button onClick={() => { setStatus('setup'); setQuestions([]); setUserAnswers({}); sessionStorage.removeItem(STORAGE_KEY); }} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-[#24283b] hover:bg-[#2f344d] text-white rounded-xl font-medium transition-colors border border-slate-700">
              <Settings className="w-4 h-4" /> Cài đặt đề
            </button>
            <button onClick={() => navigate('/')} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-[#24283b] hover:bg-[#2f344d] text-white rounded-xl font-medium transition-colors border border-slate-700">
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
  const showInstantFeedback = examMode === 'instant' && userAnswer !== undefined && !isReview && status !== 'retake_wrong';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col lg:flex-row -mx-4 sm:mx-0">
      {/* Main Content */}
      <div className="flex-1 min-w-0 px-4 sm:px-0">
        <div className="max-w-3xl w-full mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button onClick={confirmExit} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 px-3 py-1.5 rounded-lg -ml-3">
                <ArrowLeft className="w-4 h-4" /> Tạo đề mới
              </button>
              <button onClick={handleShareExam} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/50 px-3 py-1.5 rounded-lg">
                {isCopied ? <ClipboardCheck className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} <span className="hidden sm:inline">{isCopied ? 'Đã copy' : 'Chia sẻ đề'}</span>
              </button>
            </div>
            {timeRemaining !== null && status === 'active' && (
              <div className={`font-mono text-lg font-bold px-4 py-1.5 rounded-lg ${timeRemaining < 60 ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsNavOpen(!isNavOpen)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Menu className="w-6 h-6" />
              </button>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Câu {currentIndex + 1} / {questions.length}
                {status === 'retake_wrong' && " (Làm lại câu sai)"}
              </span>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium truncate max-w-[150px] sm:max-w-xs hidden sm:inline-block">
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
                
                if (showInstantFeedback) {
                  if (idx === currentQ.correctIndex) {
                    btnClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                  } else if (idx === userAnswer) {
                    btnClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                  } else {
                    btnClass += "border-slate-200 dark:border-slate-700 opacity-50";
                  }
                } else if (!isReview) {
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
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={isReview || showInstantFeedback} className={btnClass}>
                    <div className="flex items-start gap-3">
                      <span className="font-bold shrink-0 w-6">{String.fromCharCode(65 + idx)}.</span>
                      <span>{option}</span>
                      {(isReview || showInstantFeedback) && idx === currentQ.correctIndex && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto shrink-0" />}
                      {(isReview || showInstantFeedback) && idx === userAnswer && idx !== currentQ.correctIndex && <XCircle className="w-5 h-5 text-red-500 ml-auto shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {(isReview || showInstantFeedback) && (
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
          
          {/* Support Mobile Next/Prev and Submit block below cards */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pt-2">
              <button 
                onClick={() => {
                  if (status === 'retake_wrong') {
                     // Find previous wrong
                     let prevIdx = currentIndex - 1;
                     while(prevIdx >= 0) {
                        if (userAnswers[prevIdx] !== questions[prevIdx].correctIndex) break;
                        prevIdx--;
                     }
                     if (prevIdx >= 0) setCurrentIndex(prevIdx);
                  } else {
                    setCurrentIndex(prev => Math.max(0, prev - 1));
                  }
                }} 
                disabled={currentIndex === 0 || (status === 'retake_wrong' && questions.findIndex((q, i) => userAnswers[i] !== q.correctIndex) === currentIndex)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium disabled:opacity-50 transition-colors"
              >
                ← Trước
              </button>
              <button 
                onClick={() => {
                  if (status === 'retake_wrong') {
                     let nextIdx = currentIndex + 1;
                     while(nextIdx < questions.length) {
                        if (userAnswers[nextIdx] !== questions[nextIdx].correctIndex) break;
                        nextIdx++;
                     }
                     if (nextIdx < questions.length) setCurrentIndex(nextIdx);
                  } else {
                    setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))
                  }
                }} 
                disabled={currentIndex === questions.length - 1 || (status === 'retake_wrong' && (() => {
                  let idx = -1;
                  for (let i = questions.length - 1; i >= 0; i--) {
                    if (userAnswers[i] !== questions[i].correctIndex) {
                      idx = i;
                      break;
                    }
                  }
                  return idx;
                })() === currentIndex)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium disabled:opacity-50 transition-colors"
              >
                Sau →
              </button>
            </div>
            
            {/* ONLY ON MOBILE: Show submit button here at bottom */}
            {status === 'active' && (
              <button 
                onClick={submitQuiz} 
                className="lg:hidden w-full py-4 mt-8 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-lg transition-colors text-lg"
              >
                Nộp bài ngay
              </button>
            )}
            {status === 'retake_wrong' && (
              <button 
                onClick={() => setStatus('finished')} 
                className="lg:hidden w-full py-4 mt-8 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-lg transition-colors text-lg"
              >
                Kết thúc điền lại
              </button>
            )}
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
