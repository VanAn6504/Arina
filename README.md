# 💬 Arina - Real-time Chat Application

Arina là một ứng dụng nhắn tin thời gian thực hoàn chỉnh (Full-stack) được thiết kế với giao diện hiện đại và trải nghiệm người dùng mượt mà. Dự án tập trung vào việc xử lý các luồng dữ liệu phức tạp từ hệ thống xác thực bảo mật đến giao tiếp tức thời thông qua WebSocket.

---

## 📸 Screenshots

   Trang Đăng Nhập   
![Trang Đăng Nhập](./screenshots/signin.png)

   Trang Đăng Kí
![Trang Đăng Kí](./screenshots/signup.png)

    Giao Diện Nhắn Tin   
![Giao Diện Nhắn Tin](./screenshots/windown_layout.png)

    Giao Diện Cuộc Trò Chuyện   
![Giao Diện Cuộc Trò Chuyện ](./screenshots/group_conversation.png)

    Thông Tin Nhóm
![Thông Tin Nhóm](./screenshots/group_info.png)

    Tạo Nhóm 
![Tạo nhóm](./screenshots/new_group.png)   

    Bạn Bè   
![Bạn Bè](./screenshots/new_conversation.png)

    Thông Tin Bạn Bè
![Thông Tin Bạn Bè](./screenshots/info_user.png)

    Tìm Tiếm Toàn Cục
![Tìm Tiếm Toàn Cục](./screenshots/search_all.png)

    Tìm Tiếm  Tin Nhắn Cục Bộ
![ tìm kiếm cục bộ](./screenshots/search_in_conversation.png)

    Hồ Sơ Cá Nhân
![Hồ Sơ Cá Nhân](./screenshots/profile_&_setting.png)

    Cài đặt cấu hình
![Cài đặt cấu hình](./screenshots/configuration.png)

    Cài đặt bảo mật
![Cài đặt bảo mật](./screenshots/security.png)

    Hệ thống chặn
![Hệ thống chặn](./screenshots/block.png)


---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

###  Frontend 
*    Framework:  React (Vite) & TypeScript.
*    Quản lý State:  Zustand (Quản lý trạng thái tập trung, tránh Prop Drilling).
*    Giao diện:  Tailwind CSS & Shadcn UI (Hỗ trợ Responsive và Dark Mode).
*    Real-time:  Socket.IO Client.

###  Backend 
*    Runtime & Framework:  Node.js & Express.js.
*    Cơ sở dữ liệu:  MongoDB & Mongoose (NoSQL).
*    Tài liệu API:  Swagger (OpenAPI) giúp kiểm thử API trực tiếp trên trình duyệt.

###  Bảo mật & Dịch vụ 
*    Authentication:  JWT (Access Token & Refresh Token) lưu trữ qua HTTP-only Cookies.
*    Mã hóa:  Bcrypt băm mật khẩu với cơ chế Salt (muối).
*    Lưu trữ:  Cloudinary (Quản lý hình ảnh và avatar người dùng trên đám mây).

---

## ✨ Tính Năng Cốt Lõi

###  1. Hệ Thống Xác Thực & Bảo Mật Nâng Cao 
*   Quy trình đăng ký, đăng nhập và đăng xuất hoàn chỉnh.
*   Cơ chế  tự động làm mới Access Token  thông qua Axios Interceptor khi phiên làm việc hết hạn.
*   Bảo vệ các tuyến đường (Protected Routes) cả ở phía Client và Server.

###  2. Giao Tiếp Thời Gian Thực (Socket.IO) 
*   Gửi và nhận tin nhắn tức thì trong hội thoại cá nhân và nhóm.
*   Theo dõi trạng thái  Online/Offline  của bạn bè.
*   Thông báo trạng thái  "Đã xem" (Seen)  và cập nhật tin nhắn cuối cùng theo thời gian thực.
*   Hỗ trợ gửi hình ảnh, đính kèm tệp tin (Files) dung lượng lớn, thả cảm xúc (Reactions), chỉnh sửa (Edit) và thu hồi (Delete) tin nhắn.
*   Trạng thái đang soạn tin nhắn (typing indicator) và trạng thái đã xem (seen status).

###  3. Quản Lý Hội Thoại & Bạn Bè 
*   Tìm kiếm người dùng theo username và gửi lời mời kết bạn.
*   Xử lý chấp nhận/từ chối lời mời kết bạn real-time.
*   Hủy kết bạn lập tức xóa cuộc trò chuyện và đồng bộ ẩn khỏi Sidebar của cả hai người.

###  4. Trải Nghiệm Người Dùng (UX/UI) 
*   Hỗ trợ đầy đủ  Dark Mode  và hiệu ứng giao diện mượt mà.
*    Skeleton Loading : Hiển thị khung giả trong quá trình tải dữ liệu giúp ứng dụng chuyên nghiệp hơn.
*   Tích hợp bộ chọn Emoji từ thư viện Emoji Mart.

### 5. Hệ thống tìm kiếm thông minh
*   Tìm kiếm nhanh cuộc trò chuyện trong Sidebar.
*   Tìm kiếm nội dung tin nhắn cục bộ bên trong phòng chat.

### 6. Hệ thống chặn (Block List)
*   Chặn 2 chiều: Ẩn hoàn toàn khung chat của cả hai bên kèm thông báo lý do, từ chối gửi tin nhắn.
*   Ẩn trạng thái hoạt động (Online/Offline) đối với nhau trên Sidebar.

### 7. Cài đặt tài khoản & Ứng dụng
*   Cập nhật thông tin cá nhân (Tên hiển thị, Số điện thoại, Giới thiệu).
*   Bật/tắt trạng thái ẩn danh (Invisible mode) không cho người khác thấy mình online.
*   Đổi mật khẩu bảo mật.

### 8. Thông báo đẩy (Push Notifications)
*   Tích hợp Desktop Notification API, tự động hiển thị thông báo có nội dung tin nhắn mới khi người dùng đang ẩn tab hoặc ở phòng chat khác. Có Switch bật/tắt dễ dàng.

---

## 📂 Cấu Trúc Dự Án

```text
Arina/
├── backend/
│   ├── source/
│   │   ├── controllers/    # Logic xử lý nghiệp vụ (Auth, Message, User...)
│   │   ├── models/         # Schema MongoDB (User, Conversation, Message...)
│   │   ├── routes/         # Định nghĩa các API endpoints
│   │   ├── middlewares/    # Middleware xác thực và upload file
│   │   ├── socket/         # Cấu hình Socket.IO và quản lý Room
│   │   └── utils/          # Hàm hỗ trợ (Helper functions)
│   └── swagger.json        # Tài liệu đặc tả API
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (Sidebar, Chat, Skeleton...)
│   │   ├── pages/          # Các trang chính (Login, Register, ChatApp)
│   │   ├── services/       # Lớp gọi API (Axios instance)
│   │   ├── store/          # Quản lý trạng thái với Zustand
│   │   └── types/          # Định nghĩa kiểu dữ liệu TypeScript
└── .gitignore              # Quản lý các tệp không đẩy lên Git
```

---
*Dự án được thực hiện nhằm nghiên cứu và áp dụng các công nghệ Web Full-stack hiện đại.*

