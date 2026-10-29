# Soạn thảo văn bản THPT Lộc Ninh
Mở app: ./xu-ly-van-ban.html

## Sử dụng
1. Nhập Gemini API key của riêng bạn trong mục Kết nối Gemini.
2. Giữ mô hình gemini-3.1-pro-preview như bản gốc; nếu báo 404 hoặc không có quyền, chọn một mô hình văn bản/PDF mà dự án được dùng.
3. Bấm Kiểm tra kết nối. Bước này xác nhận key và mô hình, không xác nhận hạn mức tạo nội dung.
4. Chọn loại văn bản; sửa cơ quan và đơn vị phù hợp. Với văn bản Đảng cần nhập đúng Đảng bộ/Chi bộ.
5. Chọn PDF nếu cần (tối đa 15 MB), nhập yêu cầu rồi bấm Tạo văn bản.
6. Sửa trực tiếp kết quả, sao chép, tải DOCX hoặc In/PDF.

App là HTML tĩnh, chạy trên GitHub Pages hoặc mở trên máy có Internet. Thư viện DOCX tải từ jsDelivr (docx 9.6.1). Nếu thư viện không tải được, có thể sao chép hoặc In/PDF.
DOCX là bản dự thảo A4 với phông Times New Roman. Cần rà soát và hoàn thiện thể thức chính thức trước khi ban hành; không cam kết tái hiện toàn bộ thể thức văn bản hành chính.

## API key và khác biệt với ZIP
- ZIP gốc là React + Express, không phải HTML tĩnh. server.ts gọi GoogleGenAI với process.env.GEMINI_API_KEY.
- .env.example chỉ có placeholder; không có key thực trong các file cấu hình được cung cấp. Key của bản AI Studio có thể được môi trường cấp lúc chạy.
- README hướng dẫn dùng .env.local trong khi dotenv.config() mặc định đọc .env. Nếu chạy ZIP trên máy, dùng .env hoặc sửa dotenv.config({path:'.env.local'}).
- Giao diện ZIP gốc thay lỗi API bằng một thông báo chung, nên khó chẩn đoán.
- HTML này gọi trực tiếp Google Gemini bằng header x-goog-api-key. Không dùng lớp gọi hộ của AI Studio. API key không được viết trong HTML, không gửi lên GitHub, không lưu localStorage/sessionStorage. Tải lại/đóng trang cần nhập lại.
- Ảnh người dùng gửi cho thấy bản AI Studio đã tạo được nội dung trở lại. Không cần thay key đang hoạt động chỉ vì từng gặp PROXY_GENERATION_DISABLED/WebSocket. Chưa xác thực key hoặc hạn mức bằng một lần gọi thật trong quá trình xây dựng.

## Đề xuất
- Dùng cá nhân: dùng HTML và nhập key riêng mỗi lần mở. Không công khai key trong kho mã; trình duyệt vẫn phải giữ key trong lúc gọi API.
- Dùng chung toàn trường với một key: nên triển khai máy chủ riêng (ví dụ Cloud Run), giữ GEMINI_API_KEY ở máy chủ, có đăng nhập, hạn mức và kiểm soát chi phí. GitHub Pages chỉ cung cấp giao diện, không bảo vệ được một key chung nhúng vào HTML.
- Key gắn với dự án Google Cloud. Nếu 429 do hạn mức dự án, tạo key mới trong cùng dự án có thể không giúp. Kiểm tra Usage/Billing.
- PDF và yêu cầu được gửi đến Google khi tạo văn bản. Tự cân nhắc quyền sử dụng tài liệu và dữ liệu trước khi gửi.
- Không tự động thử lại yêu cầu tạo để tránh phát sinh nhiều lượt ngoài ý muốn. Nút Dừng dừng chờ ở trình duyệt, không bảo đảm Google ngừng xử lý hay tính phí yêu cầu đã nhận.

## Nguồn
https://ai.google.dev/gemini-api/docs/api-key
https://ai.google.dev/gemini-api/docs/models
https://ai.google.dev/gemini-api/docs/troubleshooting

## Kiểm tra đã thực hiện
- Kiểm tra cú pháp JavaScript và giao diện trên trình duyệt.
- Kiểm tra bằng phản hồi mô phỏng: thiếu key, cấu trúc yêu cầu, hiển thị nội dung an toàn, lỗi 429, ẩn key trong lỗi, giữ kết quả cũ khi lỗi, giới hạn PDF và xóa key.
- Chưa gọi Gemini thật vì không có key người dùng; chưa xác nhận tải DOCX thực tế trong trình duyệt.
