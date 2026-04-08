# Photobook Web Application Plan

Chào bạn, tôi sẽ giúp bạn tạo một ứng dụng "Photobook" cho phép chụp ảnh và lưu trữ ngay trên trình duyệt với giao diện cực kỳ hiện đại và sang trọng.

Dưới đây là kế hoạch triển khai của tôi. Bạn hãy xem qua và cho ý kiến nhé.

## Tổng quan (Overview)
Ứng dụng sẽ được chạy trên nền web (sử dụng React và Vite), cho phép bạn:
1. **Mở camera (Camera View):** Hiển thị luồng video từ camera của thiết bị và có nút để chụp ảnh.
2. **Khu vực Photobook (Gallery):** Nơi lưu trữ và hiển thị các bức ảnh bạn vừa chụp dưới dạng lưới tuyệt đẹp (grid).
3. **Giao diện cao cấp (Premium UI):** Thiết kế theo phong cách dark mode, với hiệu ứng kính mờ (glassmorphism), các nút bấm bo tròn, chuyển động mượt mà (micro-animations) và màu sắc tinh tế để mang lại cảm giác của một ứng dụng chuyên nghiệp.

> [!NOTE]
> Các bức ảnh của bạn sẽ được lưu tạm thời trong trình duyệt. Khi tải lại trang, ảnh có thể được giữ lại nếu sử dụng LocalStorage (tùy thuộc vào mong muốn của bạn).

## User Review Required

> [!IMPORTANT]  
> Xin xác nhận các thông tin sau trước khi tôi bắt đầu:
> 1. Bạn có muốn lưu trữ các bức ảnh này trên trình duyệt để khi tải lại trang web không bị mất không (sử dụng LocalStorage)? Hay chỉ cần lưu tạm thời trong phiên sử dụng?
> 2. Kế hoạch sử dụng **React và Vite** cùng với **Vanilla CSS** (để tạo các hiệu ứng UI độc đáo theo yêu cầu thiết kế cao cấp) có phù hợp với bạn không?

## Proposed Changes

### 1. Khởi tạo dự án
- Sử dụng Vite để khởi tạo một ứng dụng React mới trong thư mục `d:\ProJect Test`.
- Lệnh sử dụng: `npx -y create-vite@latest ./ --template react`

### 2. Thiết lập giao diện (UI)
- **CSS / Styling:** Tạo tệp `index.css` với các biến màu sắc (thông số thiết kế dark mode, glowing effects).
- Sử dụng font chữ hiện đại (như Inter hoặc Roboto).

### 3. Xây dựng các tính năng cốt lõi (Core Features)

#### `src/App.jsx`
- Thành phần chính chứa cả Camera View và Gallery View.
- Quản lý trạng thái (state) danh sách các bức ảnh.

#### `src/components/Camera.jsx`
- Truy cập vào camera thiết bị người dùng.
- Hiển thị luồng video trực tiếp.
- Nút "Chụp" (Capture) với hiệu ứng animation khi bấm.
- Xử lý việc vẽ frame của video lên HTML Canvas và xuất ra định dạng ảnh.

#### `src/components/Gallery.jsx`
- Hiển thị các bức ảnh đã chụp dưới dạng thẻ (cards) trong một bố cục lưới (grid).
- Hiệu ứng hover nổi bật từng bức ảnh.

## Verification Plan

### Automated/Manual Verification
- Chạy ứng dụng trên máy tính cục bộ bằng `npm run dev`.
- Kiểm tra việc xin quyền truy cập Camera từ trình duyệt.
- Kiểm tra khả năng chụp ảnh và hiển thị lập tức sang bên danh sách Photobook.
- Đảm bảo rằng giao diện hoạt động trơn tru, hiển thị đẹp mắt và phản hồi tốt (responsive layout).

Bạn có đồng ý với kế hoạch này không? Nếu có điểm nào cần thay đổi, hãy cho tôi biết!
