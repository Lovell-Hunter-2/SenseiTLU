import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Chính sách bảo mật</h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p>
              Chào mừng bạn đến với SenseiTLU. Chúng tôi hiểu rằng quyền riêng tư của bạn là rất quan trọng và chúng tôi cam kết bảo vệ thông tin cá nhân của bạn.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">1. Thông tin chúng tôi thu thập</h3>
            <p>
              Khi bạn sử dụng dịch vụ của chúng tôi, đặc biệt là khi đăng nhập thông qua Google, chúng tôi có thể thu thập các thông tin sau:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Thông tin hồ sơ cơ bản (Tên, Ảnh đại diện)</li>
              <li>Địa chỉ Email</li>
              <li>Thông tin phiên đăng nhập và lịch sử hoạt động trên nền tảng</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">2. Cách chúng tôi sử dụng thông tin</h3>
            <p>
              Thông tin thu thập được sử dụng cho các mục đích sau:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cung cấp, duy trì và cá nhân hóa trải nghiệm của bạn trên ứng dụng</li>
              <li>Hiển thị tên và ảnh đại diện của bạn trên giao diện</li>
              <li>Bảo mật tài khoản và hệ thống của chúng tôi</li>
              <li>Liên lạc với bạn về các thông báo liên quan đến dịch vụ</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">3. Chia sẻ dữ liệu</h3>
            <p>
              Chúng tôi cam kết KHÔNG bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bất kỳ bên thứ ba nào vì mục đích thương mại.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">4. Quyền của bạn</h3>
            <p>
              Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của mình khỏi hệ thống của chúng tôi bất cứ lúc nào. Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hỗ trợ.
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
