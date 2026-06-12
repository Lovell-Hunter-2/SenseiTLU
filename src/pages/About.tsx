import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Bot, 
  PenTool, 
  UploadCloud, 
  MessageSquare,
  GraduationCap,
  Sparkles,
  Headphones,
} from 'lucide-react';

export default function About() {
  useEffect(() => {
    document.title = "Về chúng tôi | SenseiTLU";
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Kho Tàng Tài Liệu Phong Phú",
      description: "Hệ thống tổng hợp đầy đủ giáo trình, bài giảng, đề cương và đề thi các năm của đa dạng các ngành và môn học. Dễ dàng tìm kiếm và tra cứu.",
      bgColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "Trợ Lý Học Tập AI Thông Minh",
      description: "Chatbot AI được tích hợp sâu, có khả năng đọc hiểu tài liệu, giải thích các khái niệm phức tạp, tóm tắt ý chính và hỗ trợ học tập 24/7.",
      bgColor: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
    },
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Thi Thử & Luyện Đề Bằng AI",
      description: "Thử thách bản thân với kho đề thi trắc nghiệm từ cộng đồng, trải nghiệm chế độ thi giả lập và luyện tập kiến thức do AI tổng hợp, đem lại kết quả ôn tập tốt nhất.",
      bgColor: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
    },
    {
      icon: <UploadCloud className="w-6 h-6" />,
      title: "Cộng Đồng Đóng Góp Tri Thức",
      description: "Mỗi sinh viên đều có thể tải lên tài liệu học tập mới, góp phần xây dựng một kho tàng tri thức chung vững mạnh để truyền lại cho các thế hệ khóa sau.",
      bgColor: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Góc Thảo Luận & Blog",
      description: "Không gian chia sẻ kinh nghiệm học tập, các mẹo thi cử hiệu quả qua môn, cũng như nơi để sinh viên thảo luận học thuật, giao lưu và tương tác sôi nổi.",
      bgColor: "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Không Gian Học Tập (Study Space)",
      description: "Tập trung tối đa với đồng hồ Pomodoro, âm thanh Lofi/Tự nhiên thư giãn và tích hợp StudyStream để học tập cùng cộng đồng toàn cầu.",
      bgColor: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-20 py-12 px-4">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-3xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium mb-6 ring-1 ring-blue-500/20">
            <Sparkles className="w-4 h-4" />
            Về Nền Tảng Của Chúng Tôi
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 mt-2">
            Học Tập Thông Minh Cùng <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SenseiTLU</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Chúng tôi xây dựng SenseiTLU với mục tiêu tạo ra môi trường học tập tiên tiến nhất. 
            Kết hợp giữa hệ sinh thái tài liệu phong phú và sức mạnh của Trí tuệ Nhân tạo để đồng hành cùng bạn trên con đường Đại học.
          </p>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="space-y-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Các Tính Năng Nổi Bật</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Khám phá những công cụ và tiện ích đặc biệt được thiết kế riêng phù hợp với sinh viên giúp tối ưu hóa thời gian và hiệu năng học tập của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 relative overflow-hidden group md:col-span-2 lg:col-span-2"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${feature.bgColor}`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Vision Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-14 text-white text-center relative overflow-hidden shadow-2xl"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-indigo-900/40 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
          <div className="inline-flex justify-center items-center w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-md mb-2">
            <GraduationCap className="w-10 h-10 text-blue-100" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Tầm nhìn & Sứ mệnh</h2>
          <p className="text-lg md:text-xl text-blue-100 leading-relaxed font-medium">
            SenseiTLU không chỉ là nơi lưu trữ, mà còn là người bạn đồng hành cùng sự thông minh của Trí tuệ Nhân Tạo. Chúng tôi mong muốn mỗi sinh viên có được công cụ sắc bén nhất để chinh phục tri thức một cách chủ động, sáng tạo và đạt được kết quả xuất sắc nhất!
          </p>
        </div>
      </motion.div>

    </div>
  );
}
