import React, { useEffect } from 'react';
import { UploadCloud, Heart, ArrowRight } from 'lucide-react';

export default function Contribute() {
  useEffect(() => {
    document.title = "Đóng góp tài liệu | SenseiTLU";
  }, []);

  const driveLink = "https://drive.google.com/drive/folders/1L3e4ugId-e5o6qxCA3dfOKTh8S0l4U3q?usp=sharing";

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8 text-center">
      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
        <Heart className="w-10 h-10" />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold">
        Đóng góp tài liệu học tập
      </h1>
      
      <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
        Sự đóng góp của bạn sẽ giúp xây dựng một kho tàng tri thức phong phú, hỗ trợ rất lớn cho cộng đồng sinh viên TLU trong quá trình học tập và ôn thi.
      </p>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-sm mt-8">
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center space-y-6 bg-slate-50 dark:bg-slate-900/50">
          <UploadCloud className="w-16 h-16 text-slate-400" />
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Tải tài liệu lên Google Drive</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              Nhấn vào nút bên dưới để truy cập thư mục Drive chung. Bạn có thể kéo thả file tài liệu, giáo trình, đề thi vào thư mục tương ứng.
            </p>
          </div>
          
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Đóng góp ngay <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-8">
        Admin sẽ kiểm duyệt và cập nhật tài liệu của bạn lên hệ thống trong thời gian sớm nhất. Cảm ơn bạn rất nhiều! ❤️
      </p>
    </div>
  );
}
