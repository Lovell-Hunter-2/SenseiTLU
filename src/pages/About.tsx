import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Bot, 
  PenTool, 
  UploadCloud, 
  Globe,
  GraduationCap,
  Headphones,
  MessageSquare,
} from 'lucide-react';

export default function About() {
  useEffect(() => {
    document.title = "Về chúng tôi | SenseiTLU";
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Kho Tài Liệu Học Tập",
      description: "Tổng hợp giáo trình, bài giảng, đề cương và đề thi của các môn học. Dễ dàng tìm kiếm, tra cứu và xem trực tiếp trên trình duyệt.",
      bgColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "Trợ Lý AI Thông Minh",
      description: "Chatbot AI được tích hợp sẵn để hỗ trợ giải đáp các thắc mắc nhanh chóng, tìm kiếm thông tin hoặc giải thích các khái niệm khi cần.",
      bgColor: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
    },
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Thi Thử & Luyện Đề",
      description: "Trải nghiệm làm bài trắc nghiệm với kho đề thi đa dạng. Giúp bạn ôn tập, đánh giá lại kiến thức và chuẩn bị tốt hơn trước mỗi kỳ thi.",
      bgColor: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Không Gian Học Tập (Study Space)",
      description: "Tập trung tối đa với đồng hồ Pomodoro và âm thanh lofi/tự nhiên thư giãn, tạo ra một môi trường học tập lý tưởng ngay trên web.",
      bgColor: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Góc Thảo Luận & Blog",
      description: "Không gian chia sẻ kinh nghiệm học tập, các mẹo thi cử hiệu quả qua môn, cũng như nơi để sinh viên thảo luận học thuật và giao lưu.",
      bgColor: "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400"
    },
    {
      icon: <UploadCloud className="w-6 h-6" />,
      title: "Đóng Góp Cộng Đồng",
      description: "Nền tảng mở cho phép sinh viên tải lên và chia sẻ tài liệu của mình, chung tay xây dựng một kho tri thức phong phú cho các khóa sau.",
      bgColor: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Hệ Sinh Thái Tiện Ích",
      description: "Kết nối trực tiếp với các tiện ích thiết thực khác dành cho sinh viên như trang web xem Lịch học TLU hay công cụ Tính điểm bài tập nhóm.",
      bgColor: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
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
            <img src="/avt_tlu (remove).png" alt="TLU" className="w-5 h-5 object-contain rounded-full" />
            Về Nền Tảng Của Chúng Tôi
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 mt-2">
            Học Tập Thông Minh Cùng <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SenseiTLU</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Chúng tôi xây dựng SenseiTLU với mục tiêu tạo ra môi trường học tập trực tuyến tiện dụng. 
            Kết hợp giữa kho tài liệu phong phú, các công cụ hỗ trợ và hệ sinh thái đa dạng để đồng hành cùng bạn trên con đường Đại học.
          </p>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="space-y-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Các Tính Năng & Tiện Ích</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Khám phá các tính năng được xây dựng nhằm hỗ trợ sinh viên tra cứu tài liệu nhanh chóng, ôn tập hiệu quả và làm việc nhóm thuận tiện hơn.
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
              className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 relative overflow-hidden group md:col-span-2 lg:col-span-2 ${index === features.length - 1 ? 'md:col-start-2 lg:col-start-3' : ''}`}
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
            SenseiTLU không chỉ là nơi lưu trữ tài liệu, mà còn hướng tới việc trở thành một hệ sinh thái tiện ích dành cho sinh viên. Chúng tôi mong muốn mang đến những công cụ thiết thực, dễ sử dụng để giúp quá trình học tập và làm việc của bạn tại trường Đại học Thủy lợi trở nên thuận lợi và đạt hiệu quả tốt hơn!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
