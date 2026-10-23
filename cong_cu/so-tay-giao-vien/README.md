# Sổ tay Giáo viên 3.0

**Thầy Phan Ngọc Huy — Trường THPT Lộc Ninh, TP. Đồng Nai**  
Made by Huycomf · Tiện ích giáo viên

- [Mở bản web](web/)
- [Tải APK 3.0](So-tay-Giao-vien-3.0.apk) — Android 8.0 trở lên, bản cài thử đã ký.
- [Website Tiện ích giáo viên](https://huycomf2020.github.io/giao_vien/index.html)

## Nhắc việc Android

Phiên bản 2.0 chỉ kiểm tra nhắc việc khi WebView đang chạy. Phiên bản 3.0 lưu lịch báo vào **AlarmManager Android** và dùng BroadcastReceiver để hiện thông báo dù màn hình ứng dụng đã đóng. Lịch được lưu trên thiết bị và khôi phục khi khởi động điện thoại, cập nhật APK hoặc cấp quyền Báo thức.

Sau khi cài đè APK 3.0:

1. Mở ứng dụng, bấm **biểu tượng chuông** ở góc trên.
2. Bật **quyền thông báo**, cho phép **Báo thức và lời nhắc**. Android 12 trở lên có thể yêu cầu mở cài đặt này riêng.
3. Bấm **Thử nhắc sau 1 phút**, trở về màn hình chính và chờ.
4. Nếu không hiện banner/âm thanh, kiểm tra **Cài đặt hiển thị**, chế độ Không làm phiền và Pin → Không hạn chế.

Thông báo dùng kênh mức ưu tiên cao, biểu tượng chuông đơn sắc, âm thanh/rung và mở ứng dụng khi chạm vào. Android vẫn quyết định cách hiện banner tùy thiết bị và cài đặt người dùng. Nếu chưa cho quyền báo thức chính xác, app dùng báo thức không chính xác làm phương án dự phòng và báo rõ có thể trễ. “Buộc dừng” ứng dụng trong cài đặt Android chặn giao báo; cần mở lại app. Gỡ cài đặt sẽ xóa dữ liệu cục bộ.

**Công việc đã tích hoàn thành không được nhắc.** Mỗi việc chưa hoàn thành được nhắc trước theo cấu hình và đúng hạn. Lịch dạy được nhắc trước theo số phút trong cài đặt và đúng giờ vào tiết. Nhiệm vụ lặp ngày/tuần và tiết dạy tuần có báo thức lặp, cập nhật khi sửa/xóa lịch.

Web có popup và thông báo trình duyệt khi trang đang chạy. Để nhắc khi đóng trình duyệt, dùng APK hoặc nút xuất lịch `.ics` để nhập vào ứng dụng Lịch. Lịch `.ics` đã nhập phải tự cập nhật/xóa trong ứng dụng Lịch khi công việc thay đổi; chưa có dịch vụ Web Push phía máy chủ.

## Giờ học theo thông báo THPT Lộc Ninh

| Tiết trong app | Thời gian |
| --- | --- |
| 1 | 07:00–07:45 |
| 2 | 08:00–08:45 |
| 3 | 08:50–09:35 |
| 4 | 09:40–10:25 |
| 5 | 10:30–11:15 |
| 6 (chiều 1) | 14:00–14:45 |
| 7 (chiều 2) | 14:55–15:40 |
| 8 (chiều 3) | 15:45–16:30 |

Vào lớp lúc 06:55 và 13:55. Tiết 9–10 không dùng mặc định, có thể đặt giờ riêng nếu cần. Giờ mặc định cũ được chuyển sang giờ trường; giờ do người dùng tùy chỉnh được giữ lại. Có nút áp dụng lại giờ THPT Lộc Ninh trong cài đặt giờ.

## Nhập ảnh và PDF — không cần API key

- PDF có chữ: đọc trực tiếp bằng PDF.js.
- Ảnh và PDF scan: OCR tiếng Việt trên thiết bị bằng Tesseract.js.
- Lịch tuần: tìm họ tên đầy đủ, hoặc cách viết tắt do người dùng nhập; giữ ngữ cảnh ngày, giờ và đề xuất công việc để kiểm tra.
- TKB: đọc bảng theo thứ/tiết/lớp; ảnh TKB cá nhân cần đánh dấu xác nhận trước khi lấy tất cả các ô.
- Có màn hình sửa chữ OCR, sửa từng dòng, bỏ chọn và xác nhận lưu; bỏ qua dòng trùng thứ/tiết hiện có.
- Ảnh/PDF tối đa 15 MB, PDF tối đa 12 trang. Bảng nhiều tầng, ảnh mờ, nghiêng, chữ viết tay hoặc bố cục không rõ có thể cần sửa thủ công. Không coi kết quả OCR là lịch đã được xác minh.

Tài liệu và họ tên **không được gửi lên Gemini hay dịch vụ OCR**. Khi dùng lần đầu, cần Internet để tải thư viện/worker/WASM và dữ liệu ngôn ngữ từ jsDelivr/projectnaptha. Chỉ tải mã nhận dạng, không tải lên nội dung tài liệu. Khả năng dùng lại khi offline phụ thuộc bộ nhớ đệm của trình duyệt/WebView; các tính năng quản lý cơ bản vẫn dùng được offline.

Phiên bản thư viện được cố định: Tesseract.js 6.0.1, tesseract.js-core 6.0.0, dữ liệu vie 1.0.0 / 4.0.0_best_int, PDF.js 4.10.38. Giấy phép và nguồn: [Tesseract.js](https://github.com/naptha/tesseract.js) và [PDF.js](https://github.com/mozilla/pdf.js).

## Tiến độ KPI cá nhân

Bảng **Tiến độ KPI** nằm ngay dưới Lịch giảng dạy trong Hôm nay. Đăng nhập bằng tài khoản KPI trường để đọc KPI /70, tổng /100, số việc hoàn thành và chờ duyệt. Chỉ hiển thị overview của tài khoản đã xác thực, không tra KPI chỉ bằng họ tên. Không chỉnh điểm, đăng ký hay duyệt nhiệm vụ từ sổ tay.

Email và mã băm mật khẩu SHA-256 được gửi đến đúng backend KPI hiện có; không lưu mật khẩu. Phiên KPI giữ trong sessionStorage, không đi vào bản sao JSON, mã nguồn, APK hoặc GitHub. Android dùng cầu nối HTTP cố định đến backend này vì CORS của hệ thống KPI chỉ cho phép domain GitHub Pages. Không thay đổi quyền hay cấu hình backend.

## Hồ sơ, logo và avatar

Logo bo bốn góc, chuông vàng nền xanh đậm; favicon và icon Android/web đồng bộ. Hồ sơ có ảnh đại diện từ JPG/PNG/WEBP, nén và lưu cục bộ. Mẫu tên nhập là “Phan Ngọc Huy”. Đã bỏ dòng nguồn GitHub, dòng kế thừa Exam Scanner và tên phong cách giao diện khỏi phần hiển thị.

## Dữ liệu & cập nhật

APK 3.0 có cùng applicationId và chứng chỉ phát triển với APK 2.0 đã bàn giao trong dự án, có thể cài đè để giữ dữ liệu. Nên xuất bản sao JSON trước khi cập nhật. Không gỡ bản cũ nếu cần giữ dữ liệu chưa sao lưu.

GitHub chứa mã nguồn và gói cài đặt; dữ liệu công việc cá nhân chưa đồng bộ tự động giữa web và APK. Kết nối KPI chỉ đọc dữ liệu KPI trường. Dữ liệu công việc, lịch, avatar và tệp đính kèm lưu riêng trên từng thiết bị.

## Build & kiểm tra

Windows, JDK 17, Android SDK Platform 35 và Build Tools 34.0.0:

```powershell
./android/build.ps1 -SdkRoot 'C:/path/to/android-sdk' -JdkRoot 'C:/path/to/jdk-17' -SigningStore 'C:/private/path/debug.keystore'
node --test tests/*.test.cjs
```

Giữ khóa ký ở nơi riêng; không đưa lên GitHub. Script build đóng gói `web/`, biên dịch, tạo DEX, căn chỉnh và kiểm tra chữ ký APK. Không cần tải dependency Java để build wrapper.

Đã kiểm tra logic lên lịch, hủy việc đã hoàn thành, việc lặp, múi giờ Việt Nam, giờ trường, đối chiếu tên và đọc ngày/giờ; kiểm thử UI thực tế PDF có chữ, OCR ảnh lịch tuần và ảnh bảng 15 tiết; kiểm tra backend KPI public và từ chối khi chưa xác thực; build APK và xác minh chữ ký. Chưa có kiểm thử giao báo thức trên điện thoại Android thật; dùng nút thử nhắc sau một phút trên thiết bị để kiểm chứng quyền và cấu hình máy. Chưa đăng nhập KPI bằng tài khoản thật trong quá trình phát triển.
