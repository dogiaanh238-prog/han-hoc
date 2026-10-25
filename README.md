# Hán Học — 汉学

Website học tiếng Trung cho người Việt, đặc biệt phù hợp với người mới bắt đầu. Website dùng HTML, CSS và JavaScript thuần; không cần đăng nhập hoặc API trả phí.

## Chức năng

- Kho từ vựng có tìm kiếm, lọc theo chủ đề/nhãn cấp độ, lật thẻ, lưu ôn tập và phát âm tổng hợp nếu trình duyệt hỗ trợ.
- Bài luyện trắc nghiệm: nghĩa tiếng Việt, pinyin và từ vựng trong câu.
- Ghi chú ngữ pháp và so sánh 知道 / 认识.
- Phòng luyện câu đối chiếu với câu mẫu (không phải AI chấm ngữ pháp).
- Lưu tiến độ và danh sách ôn tập bằng `localStorage`.
- Giao diện sáng/tối, phù hợp điện thoại, máy tính bảng và máy tính.

## Chạy thử trên máy

1. Tải hoặc giải nén toàn bộ thư mục.
2. Giữ `index.html`, `style.css`, `script.js`, `data.js` trong cùng thư mục.
3. Mở `index.html` bằng trình duyệt. Nếu trình duyệt hạn chế một số tính năng khi mở file trực tiếp, chạy bằng tiện ích Live Server trong Visual Studio Code.
4. Dữ liệu học được lưu trong trình duyệt của thiết bị hiện tại. Xóa dữ liệu website của trình duyệt có thể làm mất tiến độ.

## Đưa website lên GitHub Pages miễn phí

1. Tạo tài khoản tại https://github.com/.
2. Tạo repository mới, ví dụ `han-hoc`.
3. Tải bốn tệp `index.html`, `style.css`, `script.js`, `data.js` lên thư mục gốc của repository. Có thể tải cả README.
4. Mở **Settings → Pages**.
5. Trong **Build and deployment**, chọn **Deploy from a branch**.
6. Chọn nhánh `main`, thư mục `/(root)`, sau đó bấm **Save**.
7. Đợi quy trình triển khai hoàn thành. GitHub Pages sẽ cung cấp đường dẫn dạng `https://TEN-TAI-KHOAN.github.io/han-hoc/`.

Tài liệu chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Lưu ý dữ liệu

Nhãn “HSK 1–2 (tham khảo)” là nhãn định hướng trong bản mẫu, không khẳng định rằng từng mục khớp với một danh sách HSK cụ thể. HSK có các phiên bản và danh sách khác nhau; hãy đối chiếu với giáo trình/chuẩn mà lớp của bạn đang dùng. Từ được gắn “Từ bổ sung” không được tính là từ HSK 1–2.

## Lưu ý kỹ thuật

- `localStorage` chỉ lưu trong trình duyệt và thiết bị hiện tại, không tự đồng bộ giữa các thiết bị.
- Phát âm dùng `SpeechSynthesis` của trình duyệt/thiết bị; giọng đọc và chất lượng tùy hệ điều hành, không thay thế giọng người bản xứ.
- Chức năng luyện câu hiện chỉ đối chiếu chuỗi với câu mẫu. Muốn tích hợp AI, cần xây dựng backend để bảo vệ API key; không đặt khóa bí mật trong `script.js`.
- Không cần API key để chạy phiên bản hiện tại.
