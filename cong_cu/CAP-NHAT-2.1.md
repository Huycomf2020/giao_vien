# Bản cập nhật thể thức và nhận diện 2.1

## Đã sửa
- Tách cơ quan/đơn vị ở trái và quốc hiệu/tiêu ngữ ở phải; số và ngày đặt cùng hàng.
- A4; Times New Roman màu đen; thân 14 pt; giãn dòng 1,3; sau đoạn 6 pt; thụt đầu dòng 1 cm.
- Lề trên/dưới 20 mm, trái 30 mm, phải 20 mm.
- Chữ đậm/nghiêng/căn giữa áp dụng riêng cho quốc hiệu, tiêu ngữ, tên loại, trích yếu, đề mục, nơi nhận, chức danh, họ tên.
- Công văn dùng trích yếu V/v dưới số, không thêm tên loại “CÔNG VĂN” ở giữa trang.
- Số trang ở giữa lề trên, bỏ số ở trang đầu trong DOCX. In PDF từ trình duyệt có thể khác về đánh số; Word là bản xuất có thiết lập số trang đầy đủ.
- Nút Áp dụng lại thể thức cho kết quả cũ; thêm trường số/ký hiệu, địa danh, ngày, người ký và nơi nhận.
- Văn bản Đảng dùng đầu trang riêng. Bộ định dạng hành chính tham chiếu Nghị định 30; không tự chứng nhận mọi văn bản chuyên ngành hoặc văn bản Đảng đạt toàn bộ quy định.
- Logo gốc được dựng lại rõ nét bằng ImageGen, thêm A+ xanh rừng chìm trên mặt hồ sơ. Có logo 512 px, icon 192 px, favicon 32 px; ảnh gốc dựng lại lưu kèm bộ cập nhật.

## App GitHub
Các file giao diện đã được cập nhật trên GitHub. Nhấn Ctrl+F5 nếu trình duyệt còn giữ bản cũ. Khách có thể tạo khung mẫu và tải Word để kiểm tra; không cần API key cho thao tác này.

## Cập nhật file Word gửi kèm email
1. Mở dự án Apps Script đang dùng.
2. Thay toàn bộ NỘI DUNG Code.gs bằng file apps-script/Code.gs của bản 2.1. Đây là file gộp, không thêm Core.gs hay document-format.gs riêng.
3. Lưu, rồi Triển khai → Quản lý bản triển khai → bút chì → Phiên bản mới → Triển khai.
4. Giữ nguyên URL /exec hiện có. Không xóa Script Properties, không nhập lại key vào mã nguồn. Việc cập nhật mã không tự thay đổi dữ liệu/key đã lưu.

Giao diện và file Word tải trực tiếp dùng bộ định dạng mới ngay sau khi cập nhật GitHub. File Word đính kèm email chỉ đổi sau khi cập nhật deployment Apps Script. Chưa chỉnh deployment Google thay người dùng vì công cụ không hỗ trợ trình duyệt Cốc Cốc hiện tại.

## Kiểm tra
- Kiểm tra tự động thứ tự đầu trang, font/cỡ chữ, lề, giãn dòng, thụt đầu dòng, đậm/nghiêng, khối ký, đầu trang Đảng, gói ZIP/XML và số trang.
- Tải DOCX thực tế từ app thử nghiệm; mở và xuất PDF bằng Microsoft Word, kiểm tra hình trang của mẫu công văn, kế hoạch và nghị quyết.
- Bộ render LibreOffice đóng gói không có trên máy Windows này; việc kiểm tra hình trang dùng Microsoft Word và Poppler.
- Không gọi OpenAI bằng key của người dùng hoặc gửi email thử trong quá trình sửa giao diện. Thông tin giả trong mẫu kiểm tra không được đưa vào dữ liệu vận hành.

## Nguồn tham chiếu
https://luatvietnam.vn/hanh-chinh/the-thuc-van-ban-570-94255-article.html
https://vanban.chinhphu.vn/default.aspx?docid=199378&pageid=27160
https://datafiles.chinhphu.vn/cpp/files/vbpq/2020/03/30.signed.pdf
