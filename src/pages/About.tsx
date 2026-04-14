import React from 'react';
import { BookOpen, Users, Zap, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Về <span className="text-blue-600 dark:text-blue-400">SenseiTLU</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Nền tảng học tập và chia sẻ tài liệu thông minh dành riêng cho sinh viên, giúp việc ôn thi trở nên dễ dàng và hiệu quả hơn bao giờ hết.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Kho tài liệu phong phú</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Tổng hợp đầy đủ giáo trình, bài giảng, đề cương và đề thi các năm của đa dạng các môn học, được phân loại rõ ràng và dễ tìm kiếm.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Thi thử với AI</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Hệ thống tự động tạo các bài trắc nghiệm ôn tập dựa trên tài liệu môn học nhờ sức mạnh của Trí tuệ nhân tạo (Gemini AI), giúp bạn tự đánh giá kiến thức nhanh chóng.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Cộng đồng đóng góp</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Mọi sinh viên đều có thể đóng góp tài liệu để xây dựng một kho tàng tri thức chung, giúp đỡ các thế hệ sinh viên khóa sau.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Quản lý chất lượng</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Tài liệu được kiểm duyệt và quản lý bởi đội ngũ admin tâm huyết, đảm bảo tính chính xác và chất lượng của nội dung học tập.
          </p>
        </div>
      </div>
    </div>
  );
}
