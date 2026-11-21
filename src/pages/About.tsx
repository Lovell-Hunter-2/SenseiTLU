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
import { useBannerConfig } from '../hooks/useBannerConfig';
import { ChristmasCardSticker, ChristmasSnowCap, SantaSleighSvg } from '../components/ChristmasDecorations';

export default function About() {
  const bannerConfig = useBannerConfig();
  const isChristmas = bannerConfig.webTheme === 'christmas';

  useEffect(() => {
    document.title = "Về chúng tôi | SenseiTLU";
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Kho Tài Liệu Học Tập",
      description: "Tổng hợp giáo trình, bài giảng, đề cương và đề thi của các môn học. Dễ dàng tìm kiếm, tra cứu và xem trực tiếp trên trình duyệt.",
      bgColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
      xmasIconStyle: "bg-[#0D2B1F] text-[#F5C842] border border-[#F5C842]/35",
      xmasTag: "⭐ Nổi bật"
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "Trợ Lý AI Thông Minh",
      description: "Chatbot AI được tích hợp sẵn để hỗ trợ giải đáp các thắc mắc nhanh chóng, tìm kiếm thông tin hoặc giải thích các khái niệm khi cần.",
      bgColor: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
      xmasIconStyle: "bg-[#0D2B1F] text-[#A8D8EA] border border-[#A8D8EA]/35",
      xmasTag: "❄️ Thông minh"
    },
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Thi Thử & Luyện Đề",
      description: "Trải nghiệm làm bài trắc nghiệm với kho đề thi đa dạng. Giúp bạn ôn tập, đánh giá lại kiến thức và chuẩn bị tốt hơn trước mỗi kỳ thi.",
      bgColor: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",
      xmasIconStyle: "bg-[#0D2B1F] text-[#B87333] border border-[#B87333]/45",
      xmasTag: "🔔 Luyện thi"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Không Gian Học Tập (Study Space)",
      description: "Tập trung tối đa với đồng hồ Pomodoro và âm thanh lofi/tự nhiên thư giãn, tạo ra một môi trường học tập lý tưởng ngay trên web.",
      bgColor: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",
      xmasIconStyle: "bg-[#0D2B1F] text-[#A8D8EA] border border-[#2D6A4F]",
      xmasTag: "🕯️ Tập trung"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Góc Thảo Luận & Blog",
      description: "Không gian chia sẻ kinh nghiệm học tập, các mẹo thi cử hiệu quả qua môn, cũng như nơi để sinh viên thảo luận học thuật và giao lưu.",
      bgColor: "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400",
      xmasIconStyle: "bg-[#0D2B1F] text-[#E74C3C] border border-[#E74C3C]/40",
      xmasTag: "🎁 Chia sẻ"
    },
    {
      icon: <UploadCloud className="w-6 h-6" />,
      title: "Đóng Góp Cộng Đồng",
      description: "Nền tảng mở cho phép sinh viên tải lên và chia sẻ tài liệu của mình, chung tay xây dựng một kho tri thức phong phú cho các khóa sau.",
      bgColor: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
      xmasIconStyle: "bg-[#0D2B1F] text-[#F5C842] border border-[#2D6A4F]",
      xmasTag: "🎄 Cộng đồng"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Hệ Sinh Thái Tiện Ích",
      description: "Kết nối trực tiếp với các tiện ích thiết thực khác dành cho sinh viên như trang web xem Lịch học TLU hay công cụ Tính điểm bài tập nhóm.",
      bgColor: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
      xmasIconStyle: "bg-[#0D2B1F] text-[#FFD700] border border-[#F5C842]/40",
      xmasTag: "✨ Tiện ích"
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
          <div
            className={
              isChristmas
                ? "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1B4332] text-[#F5C842] font-semibold mb-6 border border-[#F5C842]/40 shadow-[0_0_20px_rgba(245,200,66,0.16)]"
                : "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium mb-6 ring-1 ring-blue-500/20"
            }
          >
            {isChristmas ? (
              <span className="text-base leading-none" aria-hidden="true">🎄</span>
            ) : (
              <GraduationCap className="w-4 h-4 shrink-0" />
            )}
            Về Nền Tảng Của Chúng Tôi
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 mt-2">
            Học Tập Thông Minh Cùng{' '}
            <span
              className={
                isChristmas
                  ? "bg-gradient-to-r from-[#F5C842] via-[#FFD700] to-[#F0EDE8] bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(245,200,66,0.28)]"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              }
            >
              SenseiTLU
            </span>
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
              className={`${
                isChristmas
                  ? "bg-[#1B4332]/90 backdrop-blur-md rounded-[20px] p-8 border border-[#2D6A4F] hover:border-[#F5C842]/60 shadow-[0_8px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(240,237,232,0.08)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.38),0_0_20px_rgba(245,200,66,0.14)] overflow-visible"
                  : "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-lg dark:hover:shadow-slate-900/50 overflow-hidden"
              } transition-all duration-300 relative group md:col-span-2 lg:col-span-2 ${index === features.length - 1 ? 'md:col-start-2 lg:col-start-3' : ''}`}
            >
              {isChristmas && <ChristmasCardSticker index={index} size="md" />}
              <div className="flex items-start justify-between gap-3 mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${
                    isChristmas ? feature.xmasIconStyle : feature.bgColor
                  }`}
                >
                  {feature.icon}
                </div>
                {isChristmas && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#0D2B1F]/90 text-[#F5C842] border border-[#2D6A4F]">
                    {feature.xmasTag}
                  </span>
                )}
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
        className={
          isChristmas
            ? "bg-gradient-to-br from-[#1B4332] via-[#0D2B1F] to-[#07160E] border border-[#F5C842]/40 rounded-[24px] p-8 md:p-14 text-[#F0EDE8] text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_28px_rgba(245,200,66,0.12)]"
            : "bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-14 text-white text-center relative overflow-hidden shadow-2xl"
        }
      >
        {/* Decorative elements */}
        <div
          className={
            isChristmas
              ? "absolute top-0 right-0 -translate-y-12 translate-x-12 w-72 h-72 bg-[#F5C842]/12 rounded-full blur-3xl pointer-events-none"
              : "absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          }
        />
        <div
          className={
            isChristmas
              ? "absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-72 h-72 bg-[#C0392B]/15 rounded-full blur-3xl pointer-events-none"
              : "absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-indigo-900/40 rounded-full blur-3xl"
          }
        />
        
        <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
          {isChristmas && (
            <span className="pointer-events-none select-none absolute -top-8 sm:-top-14 inset-x-0 opacity-75" aria-hidden="true">
              <ChristmasSnowCap className="w-full h-3.5" />
            </span>
          )}
          <div
            className={
              isChristmas
                ? "inline-flex justify-center items-center px-5 py-3 bg-[#0D2B1F]/90 border border-[#F5C842]/45 rounded-2xl backdrop-blur-md mb-2 shadow-[0_0_20px_rgba(245,200,66,0.2)] sleigh-glide"
                : "inline-flex justify-center items-center w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-md mb-2"
            }
          >
            {isChristmas ? (
              <SantaSleighSvg className="w-28 h-12" />
            ) : (
              <GraduationCap className="w-10 h-10 text-blue-100" />
            )}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Tầm nhìn & Sứ mệnh
          </h2>
          <p
            className={
              isChristmas
                ? "text-lg md:text-xl text-[#B8C4BB] leading-relaxed font-medium"
                : "text-lg md:text-xl text-blue-100 leading-relaxed font-medium"
            }
          >
            SenseiTLU không chỉ là nơi lưu trữ tài liệu, mà còn hướng tới việc trở thành một hệ sinh thái tiện ích dành cho sinh viên. Chúng tôi mong muốn mang đến những công cụ thiết thực, dễ sử dụng để giúp quá trình học tập và làm việc của bạn tại trường Đại học Thủy lợi trở nên thuận lợi và đạt hiệu quả tốt hơn!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
