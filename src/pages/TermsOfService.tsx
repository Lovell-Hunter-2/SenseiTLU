import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Điều khoản dịch vụ</h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p>
              Cảm ơn bạn đã sử dụng SenseiTLU. Bằng việc truy cập và sử dụng ứng dụng của chúng tôi, bạn đồng ý tuân thủ các Điều khoản dịch vụ dưới đây.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">1. Chấp nhận điều khoản</h3>
            <p>
              Bằng cách truy cập vào trang web này, bạn đồng ý bị ràng buộc bởi các Điều khoản và Điều kiện Sử dụng này, tất cả các luật và quy định hiện hành, và đồng ý rằng bạn chịu trách nhiệm tuân thủ mọi luật hiện hành của địa phương.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">2. Quyền sử dụng</h3>
            <p>
              Chúng tôi cấp cho bạn quyền cá nhân, không độc quyền, không thể chuyển nhượng để truy cập và sử dụng nền tảng cho mục đích học tập và chia sẻ kiến thức.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Không sao chép, sửa đổi hoặc tạo ra các tác phẩm phái sinh từ tài liệu trên nền tảng mà không có sự cho phép.</li>
              <li>Không sử dụng nền tảng cho bất kỳ mục đích bất hợp pháp hoặc không hợp lệ nào.</li>
              <li>Không can thiệp vào hoặc phá hoại tính toàn vẹn và hiệu suất của nền tảng.</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">3. Tài khoản người dùng</h3>
            <p>
              Để sử dụng một số tính năng của dịch vụ, bạn có thể cần phải đăng ký một tài khoản. Bạn chịu trách nhiệm về việc duy trì tính bảo mật của tài khoản và mật khẩu của bạn.
            </p>
            <p>
              Chúng tôi có quyền từ chối dịch vụ, đóng tài khoản, hoặc xóa bỏ hay chỉnh sửa nội dung theo quyết định của riêng chúng tôi.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">4. Từ chối trách nhiệm</h3>
            <p>
              Các tài liệu trên ứng dụng SenseiTLU được cung cấp theo nguyên trạng. Chúng tôi không đưa ra bất kỳ bảo đảm nào, dù rõ ràng hay ngụ ý, và từ chối mọi bảo đảm khác bao gồm nhưng không giới hạn ở các bảo đảm ngụ ý hoặc điều kiện về khả năng bán được, sự phù hợp cho một mục đích cụ thể.
            </p>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
