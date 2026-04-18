

&#x20;Arina - Real-time Chat Application



Arina là một ứng dụng nhắn tin thời gian thực (Full-stack) hiện đại, được xây dựng với mục tiêu cung cấp trải nghiệm giao tiếp tức thì, bảo mật và mượt mà. Dự án kết hợp sức mạnh của hệ sinh thái JavaScript/TypeScript để tạo ra một nền tảng chat hoàn chỉnh từ hệ thống xác thực đến các tính năng tương tác thời gian thực.



Frontend

* React (Vite) \& TypeScript: Đảm bảo hiệu suất và kiểm soát kiểu dữ liệu chặt chẽ



* Zustand: Quản lý trạng thái ứng dụng tập trung (State Management), thay thế cho Prop Drilling



* Tailwind CSS \& Shadcn UI: Xây dựng giao diện Responsive, hỗ trợ Dark Mode và các component hiện đại



* Socket.IO Client: Kết nối thời gian thực với server



Backend

* Node.js \& Express.js: Nền tảng server-side mạnh mẽ và linh hoạt



* MongoDB \& Mongoose: Cơ sở dữ liệu NoSQL với Schema chặt chẽ



* Socket.IO Server: Xử lý truyền tin và quản lý trạng thái người dùng (Online/Offline)



Bảo mật \& Công cụ

* JWT (JSON Web Token): Cơ chế Access \& Refresh Token giúp bảo mật phiên đăng nhập và tự động làm mới



* bcrypt: Mã hóa mật khẩu người dùng trước khi lưu vào database



* Cloudinary: Lưu trữ và quản lý hình ảnh/avatar người dùng trên đám mây



* Swagger: Tự động tạo tài liệu API chuyên nghiệp và trực quan



Tính năng chính



1. Hệ thống xác thực hiện đại
    * Đăng ký, đăng nhập và đăng xuất an toàn



    * Sử dụng Refresh Token lưu trong HTTP-only Cookie để duy trì trạng thái đăng nhập mà không cần login lại nhiều lần



    * Phân quyền người dùng (Authorization) cho các yêu cầu bảo mật thông qua Middleware



2\. Kết bạn và Quản lý người dùng

    * Tìm kiếm người dùng theo username và gửi lời mời kết bạn



    * Quản lý danh sách lời mời (Chấp nhận/Từ chối) và danh sách bạn bè



    * Cập nhật hồ sơ cá nhân và tải lên ảnh đại diện trực tiếp



3\. Chat Real-time (Thời gian thực)

    * Chat đơn (1-1) và Chat nhóm: Tạo hội thoại linh hoạt với bạn bè



    * Thông báo tức thì: Nhận tin nhắn, trạng thái "Đã xem" (Seen) và trạng thái Online/Offline ngay lập tức



    * Infinite Scroll: Tự động tải thêm lịch sử tin nhắn khi cuộn lên mà không cần load lại trang



4\. Trải nghiệm người dùng (UX)

    * Giao diện Responsive: Hiển thị hoàn hảo trên cả máy tính và thiết bị di động



    * Dark/Light Mode: Thay đổi giao diện theo sở thích người dùng



    * Skeleton Loading: Hiển thị khung giả trong lúc chờ tải dữ liệu giúp ứng dụng mượt mà hơn



5\. Giao diện người dùng





\*Dự án được thực hiện nhằm học hỏi và áp dụng các kỹ thuật xây dựng ứng dụng Full-stack hiện đại.\*

