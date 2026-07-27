# SenseiTLU - Nền Tảng Học Tập Trực Tuyến Tích Hợp AI 🎓

SenseiTLU là một nền tảng học tập trực tuyến thông minh, được thiết kế để cung cấp cho sinh viên môi trường học tập, lưu trữ tài liệu, và ôn thi hiệu quả. Với sự hỗ trợ mạnh mẽ từ Trí tuệ Nhân tạo (AI), hệ thống có khả năng tự động sinh đề thi trắc nghiệm, làm gia sư ảo giải đáp thắc mắc, và đánh giá năng lực học tập của người dùng.

## 🚀 Tính năng nổi bật

### 📚 Không gian học tập (Study Workspace)
- **Quản lý tài liệu:** Lưu trữ, phân loại và tra cứu giáo trình, bài giảng, đề cương theo môn học.
- **Hỗ trợ đa định dạng:** Đọc PDF trực tiếp, hỗ trợ tải lên file, thư mục hoặc liên kết Google Drive.
- **Render toán học:** Tích hợp KaTeX để hiển thị công thức toán học, vật lý chuyên sâu cực chuẩn.

### 🤖 Luyện đề & Thi thử thông minh (Mock Exam)
- **Tạo đề thi bằng AI:** AI tự động sinh bộ câu hỏi trắc nghiệm bám sát nội dung tài liệu và môn học. Tiết kiệm chi phí với cơ chế lưu trữ (cache) đề thi hiệu quả.
- **Chế độ thi linh hoạt:** Hỗ trợ chế độ thi tính giờ (như thi thật) hoặc chế độ luyện tập (chữa lỗi ngay sau mỗi câu).
- **Gia sư AI (AI Tutor):** Gợi ý cách giải quyết (không đưa ngay đáp án) hoặc giải thích cặn kẽ đáp án đúng/sai cho từng câu hỏi.
- **Đánh giá năng lực:** Sau khi hoàn thành bài thi, AI phân tích điểm mạnh, điểm yếu và đưa ra lộ trình ôn tập phù hợp.
- **Đánh giá câu hỏi (Rating):** Người dùng có thể đánh giá câu hỏi (Upvote/Downvote) để cải thiện chất lượng ngân hàng câu hỏi.

### ⚡ Tối ưu hóa trải nghiệm & PWA (Progressive Web App)
- **Học Offline:** Hỗ trợ lưu trữ đệm (caching) thông qua Service Worker, cho phép xem lại các tài liệu gần nhất ngay cả khi mạng chập chờn.
- **Cài đặt như ứng dụng gốc:** Có thể tải ứng dụng xuống điện thoại và máy tính để sử dụng như một phần mềm độc lập (PWA).
- **Chế độ giao diện:** Hỗ trợ Dark Mode / Light Mode và nhiều theme sinh động khi luyện đề (Sakura, Cookie, Panda, Capybara).

### 🛡️ Quản trị viên (Admin Dashboard)
- Quản lý người dùng, phân quyền truy cập.
- Theo dõi lịch sử hoạt động, thống kê dữ liệu hệ thống thời gian thực.
- Quản lý tài nguyên, biểu ngữ (banner), thông báo hệ thống.

## 🛠️ Công nghệ sử dụng
- **Frontend:** React, TypeScript, Vite, Tailwind CSS.
- **Backend & Database:** Firebase (Firestore, Authentication, App Check).
- **AI Models:** Tích hợp đa mô hình qua API trung gian để đảm bảo tính ổn định và đa dạng.
- **Khác:** Lucide React (Icons), React Markdown, Rehype KaTeX.

---

## 📱 Hướng dẫn cài đặt Ứng dụng (PWA)

SenseiTLU hỗ trợ công nghệ Web App hiện đại (PWA), giúp bạn cài đặt trang web thành một ứng dụng trên cả điện thoại và máy tính mà không cần tải từ App Store hay Google Play. Ứng dụng chạy mượt mà, hỗ trợ học offline và tiết kiệm bộ nhớ máy.

### 💻 Trên Máy tính (PC / Laptop)
**Trình duyệt Google Chrome / Microsoft Edge:**
1. Truy cập vào trang web SenseiTLU trên trình duyệt.
2. Nhìn lên thanh địa chỉ (URL bar), ở góc bên phải sẽ có biểu tượng **Màn hình máy tính có mũi tên tải xuống** (hoặc nút "Cài đặt ứng dụng").
3. Click vào biểu tượng đó và chọn **Cài đặt (Install)**.
4. Ứng dụng sẽ được tải xuống nhanh chóng và thêm vào màn hình chính (Desktop) cũng như menu Start của bạn. Bạn có thể mở nó như một ứng dụng thông thường.

### 📱 Trên Điện thoại (Smartphone / Tablet)

**Hệ điều hành Android (Sử dụng Chrome):**
1. Mở trang web SenseiTLU bằng trình duyệt Google Chrome.
2. Thường sẽ có một thanh thông báo bật lên ở dưới cùng hỏi bạn có muốn "Thêm vào màn hình chính" (Add to Home screen) hay không. Nếu có, hãy nhấn vào đó.
3. Nếu không thấy, hãy nhấn vào biểu tượng **3 chấm dọc** ở góc trên cùng bên phải trình duyệt.
4. Cuộn xuống và chọn **Thêm vào màn hình chính (Add to Home screen)** hoặc **Cài đặt ứng dụng (Install app)**.
5. Nhấn **Cài đặt** và đợi vài giây. Ứng dụng sẽ xuất hiện trên màn hình điện thoại của bạn cùng các ứng dụng khác.

**Hệ điều hành iOS / iPhone (Sử dụng Safari):**
1. Mở trang web SenseiTLU bằng trình duyệt Safari (bắt buộc phải là Safari trên iOS).
2. Nhấn vào biểu tượng **Chia sẻ (Share)** ở thanh công cụ phía dưới màn hình (hình vuông có mũi tên hướng lên).
3. Cuộn xuống trong danh sách các tuỳ chọn và chọn **Thêm vào MH chính (Add to Home Screen)**.
4. Nhấn **Thêm (Add)** ở góc trên bên phải. 
5. Xong! Ứng dụng SenseiTLU đã có mặt trên màn hình chính iPhone của bạn, sẵn sàng sử dụng full màn hình như một app gốc.

---

## 👨‍💻 Hướng dẫn chạy dự án cho Developer (Local Development)

Nếu bạn là lập trình viên và muốn phát triển hoặc chạy thử dự án trên máy cá nhân:

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18 trở lên.
- **NPM** (hoặc Yarn, pnpm).

### 2. Cài đặt và khởi chạy
1. Sao chép (Clone) dự án về máy:
   ```bash
   git clone <repository_url>
   cd <project_directory>
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường:
   Sao chép file `.env.example` thành `.env` (nếu có) và thêm các khóa cấu hình cần thiết (như Firebase Config, API Key...).
4. Chạy dự án ở chế độ phát triển (Development):
   ```bash
   npm run dev
   ```
   Trang web sẽ được chạy và có thể truy cập tại `http://localhost:3000`.

### 3. Build dự án (Production)
```bash
npm run build
npm run start
```

---

## 🤝 Đóng góp (Contributing)
Mọi đóng góp, báo cáo lỗi (issues), và yêu cầu tính năng (feature requests) đều được hoan nghênh. Hãy tạo Pull Request hoặc mở Issue mới trong repository.

## 📄 Giấy phép (License)
Dự án được bảo lưu mọi quyền. Xin vui lòng liên hệ ban quản trị SenseiTLU nếu muốn sử dụng mã nguồn cho mục đích thương mại.
