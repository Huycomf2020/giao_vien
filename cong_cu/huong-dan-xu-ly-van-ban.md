# Xử lý văn bản tự động · Huycomf · 2.0

Giao diện theo phong cách KPI Lộc Ninh; dành cho văn thư-lưu trữ, thủ quỹ và công tác Đảng.

## Phần đã có
- Tổng quan, sổ văn bản đến/đi, sổ văn bản Đảng, công việc và lịch nhắc ICS.
- Hồ sơ, mã hồ sơ liên kết văn bản, danh mục kiểm tra, mục lục, vị trí bản gốc, thông tin mượn-trả và khung biên bản bàn giao.
- Sổ quỹ tính bằng số nguyên đồng, chống âm quỹ theo trình tự, chống trùng phiếu, khóa kỳ; phiếu đã ghi không sửa/xóa. Điều chỉnh bằng phiếu mới có tham chiếu.
- Kiểm kê theo mệnh giá, đối chiếu danh sách kế toán, xuất CSV an toàn với công thức bảng tính.
- Khung mẫu dự thảo, tải Word/TXT, in PDF, sao lưu/khôi phục JSON.
- OpenAI GPT-5.4 mini: soạn thảo, tóm tắt/nhiệm vụ, trích thông tin đăng ký, rà soát, so sánh 2 PDF, gợi ý hồ sơ, kiểm tra nội dung chứng từ.
- Khách chỉ dùng nghiệp vụ trong phiên mở trang, không AI, không gửi email, không có key.
- Đăng nhập xác thực email bằng OTP; thành công sẽ mở popup lưu key riêng. Key chỉ tra theo email từ phiên xác thực, không lấy theo email mà trình duyệt tự khai báo. Key không trả lại client.
- Google Apps Script giữ key trong Script Properties; dữ liệu và kết quả trong Drive riêng theo tài khoản. Chủ dự án Script/quản trị viên có quyền kỹ thuật truy cập. Không chia sẻ Script hoặc thư mục dữ liệu.
- Sau AI: lưu kết quả và PDF nguồn; gửi email tổng hợp TXT + bản dự thảo DOCX. Sau lưu nghiệp vụ: gửi tổng hợp CSV + bản sao lưu JSON. Người nhận duy nhất là email đã xác thực. Có thể tắt gửi tự động.
- Kết quả/email lỗi giữ trạng thái để tra cứu. Tác vụ thử gửi lại chạy 15 phút/lần; không tự gọi lại AI khi lỗi để tránh chi phí trùng.

## Kết nối hiện tại
Giao diện đã cấu hình endpoint người dùng cung cấp trong `public/office-assets/config.js`.
Ngày kiểm tra 30/10/2026 endpoint trả “Không tìm thấy hàm tập lệnh: doGet”. Vì dự án chưa có mã, đăng nhập/AI/email chưa hoạt động thật cho đến khi cập nhật và triển khai mã bên dưới.

## Triển khai Google Apps Script (một lần)
1. Mở dự án Apps Script của bạn ở màn hình chỉnh sửa, không phải URL `/exec`.
2. Tạo file `Code.gs`, dán TOÀN BỘ nội dung file `Code.gs` trong bộ cài gộp. File này đã có cả OfficeCore; không tạo thêm Core.gs nếu dùng bản gộp.
   Bản trên GitHub cũng đã gộp vào một file Code.gs; không tạo thêm Core.gs.
3. Trong Project settings bật hiển thị manifest `appsscript.json`, thay bằng manifest kèm theo. Đọc các quyền: Drive, gửi email, gọi dịch vụ ngoài và tạo lịch thử gửi lại.
4. Chạy `setupOffice` một lần. Bạn phải tự cấp quyền Google. Hàm tạo thư mục riêng tư MỚI ở My Drive, không dùng thư mục đang chia sẻ công khai. Không ghi log key hoặc OTP.
5. Deploy → Manage deployments → chọn deployment `/exec` đã cung cấp → Edit → New version → Deploy. Execute as: Me. Who has access: Anyone. Truy cập công khai chỉ là cửa vào API; mọi chức năng dữ liệu/key/AI vẫn phải có phiên OTP hợp lệ. Người dùng Google Workspace có thể bị chính sách quản trị chặn triển khai kiểu này.
6. Mở `/exec`: phải trả JSON `ready:true`, không còn lỗi thiếu doGet.
7. Mở app GitHub → Đăng nhập → nhận OTP → nhập mã → popup lưu key của riêng email đó.
8. Thử bằng hai tài khoản: A lưu key/dữ liệu, B không được nhìn hay dùng của A. Thử một yêu cầu nhỏ và xác nhận nhận file đính kèm.
9. Nếu dùng URL triển khai mới, cập nhật `apiBase` trong config.js. Không dán API key vào file GitHub.

### Thư mục người dùng đã gửi
Thư mục `1BWCxhI-3PCfbLpmjjgk64RcqbCm10TF3` đang có quyền anyone/writer lúc kiểm tra. Không lưu key, phiên đăng nhập hay hồ sơ nhạy cảm ở đó. Bản cài đặt tạo một thư mục riêng tư khác; thư mục chia sẻ chỉ dùng chứa bộ mã công khai nếu cần.

### Đặt giới hạn đăng ký nếu cần
Trong Script Properties có thể thêm `ALLOWED_EMAILS` = danh sách email cách nhau bằng dấu phẩy. Để trống thì bất kỳ người xác thực email thành công đều có thể tạo tài khoản và lưu key CỦA HỌ. Không có key dùng chung trong bản Apps Script.

## Chi phí và hạn mức
- Mỗi người dùng key dự án OpenAI riêng. Đặt trần cứng 6 USD/tháng trong OpenAI Project; app không tự sửa cấu hình thanh toán hoặc bật tự nạp.
- App kiểm tra ngân sách tháng riêng từng người, dự phòng 0,06 USD/yêu cầu chỉ có văn bản, 0,75 USD/yêu cầu có PDF; sau đó cập nhật theo usage. Đây là ước tính, không phải giới hạn cứng của nhà cung cấp. PDF có thể dùng nhiều token hơn dự phòng; luôn đặt thêm trần tại OpenAI.
- Giá tính trong mã: GPT-5.4 mini 0,75 USD/triệu input token, 4,50 USD/triệu output token; kiểm tra lại khi đổi giá/mô hình.
- Google áp dụng quota Apps Script/Drive/email theo loại tài khoản. Gửi mỗi lần lưu có thể chạm quota nhanh. Xem trạng thái gửi trong app; tắt gửi tự động nếu cần. Tài khoản miễn phí thường giới hạn 100 người nhận email/ngày theo bảng quota hiện tại; phải kiểm tra hạn mức thực tế của tài khoản triển khai.
- Quota Script Properties hữu hạn; phù hợp nhóm nhỏ. Cần chuyển backend khi có nhiều người hoặc khối lượng lớn. Bản retry email xử lý tối đa 20 thư mục mỗi lượt.

## Phạm vi và giới hạn
- Mẫu là khung dự thảo, chưa phải bộ biểu mẫu đã được đơn vị/cấp ủy phê duyệt. Chưa có chữ ký số, cấp số chính thức, quy trình lãnh đạo duyệt, lưu trữ lịch sử đạt chuẩn hoặc tích hợp phần mềm kế toán.
- Tài liệu mật không được nhập vào luồng AI/email này. Hồ sơ cá nhân/tài chính chỉ dùng khi đơn vị cho phép.
- Khách không lưu bền sau tải lại trang. Tài khoản lưu trên Drive; tạo bản sao lưu trước khi khôi phục hoặc bàn giao.
- Nội dung email gửi theo kết quả tại thời điểm xử lý, chưa bao gồm các sửa đổi sau đó trong trình soạn thảo.
- Người dùng tự chịu trách nhiệm xác nhận số liệu, căn cứ, thẩm quyền, việc đã thu/chi và đủ điều kiện giao nộp. Không dùng AI đánh giá đảng viên hoặc phê duyệt tài chính.
- Chưa kiểm tra trực tiếp OTP/email/OpenAI trên deployment thật vì dự án Script chưa được cài mã và cấp quyền. Không có key thật trong bộ mã.

## Kiểm tra
`node --test tests/apps-script.test.mjs` kiểm tra sáu nhóm: chặn khách; OTP; key/tài khoản tách biệt; dữ liệu và quyền sửa sổ quỹ; ngân sách/đăng xuất; số liệu quỹ/CSV/backup.
Phản hồi Google/OpenAI/email trong bài kiểm tra là mô phỏng. Giao diện đã mở trên trình duyệt; tạo khung và tải Word thực tế đã kiểm tra.

Nguồn: https://developers.openai.com/api/docs/models/gpt-5.4-mini · https://developers.openai.com/api/docs/guides/spend-limits · https://developers.google.com/apps-script/guides/web · https://developers.google.com/apps-script/guides/services/quotas
