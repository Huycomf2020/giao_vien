# Sổ tay Giáo viên 2.0

Giao diện Neumorphism: nền xám sáng, bề mặt nổi–lõm, biểu tượng SVG, bố cục responsive. Tab **Giới thiệu** sử dụng thông tin tác giả trong Exam Scanner và ảnh tham chiếu do người dùng cung cấp.

**Thầy Phan Ngọc Huy** — Trường THPT Lộc Ninh, TP. Đồng Nai  
Made by Huycomf · Tiện ích giáo viên  
[Website Tiện ích giáo viên](https://huycomf2020.github.io/giao_vien/index.html)

## Hai phiên bản

- [Mở bản web](web/). Nếu GitHub Pages của kho đang bật, đường dẫn là `https://huycomf2020.github.io/giao_vien/cong_cu/so-tay-giao-vien/web/`.
- [Tải APK Android](So-tay-Giao-vien-2.0.apk). Android 8.0 trở lên. APK dùng chung nội dung trong `web/`, được đóng gói offline và ký bằng chứng chỉ phát triển. Đây là bản cài thử, chưa phải bản phát hành Google Play.
- [Mã nguồn Android](android/), [mã nguồn web](web/).

Mở `web/index.html` để dùng cục bộ; HTTPS hoặc localhost cần thiết cho service worker và thông báo web. Android phục vụ tài nguyên đóng gói tại origin HTTPS nội bộ; liên kết ngoài mở trong trình duyệt.

## Chức năng

- Hồ sơ họ tên lưu trên từng trình duyệt hoặc ứng dụng.
- Lịch lặp theo tuần, tiết 1–10, điều chỉnh giờ, sửa hoặc xóa tiết, phát hiện trùng tiết.
- Công việc theo nhóm Giảng dạy / Chủ nhiệm & Học sinh / Chuyên môn & Hành chính; tìm kiếm, lọc, hạn hoàn thành, nhắc trước, tệp đính kèm và liên kết tài liệu.
- Việc lặp tạo kỳ tiếp theo khi đánh dấu hoàn thành.
- Ghi chú, chuyển thành công việc, nhập giọng nói nếu thiết bị hỗ trợ.
- Tìm dòng có họ tên trong văn bản/TXT; kiểm tra và chỉnh ngày, giờ trước khi lưu.
- Xuất/khôi phục dữ liệu JSON. Android dùng trình chọn tệp, trình lưu tệp và nhận dạng giọng nói của hệ điều hành.
- Tab Giới thiệu có thông tin tác giả, phiên bản và Quyền riêng tư.

## Phạm vi & dữ liệu

GitHub đồng bộ **mã nguồn và gói ứng dụng**, không đồng bộ dữ liệu công việc giữa các thiết bị. Dữ liệu nằm trong bộ nhớ trình duyệt/WebView. Có thể chuyển bằng xuất/khôi phục JSON; cần sao lưu trước khi xóa dữ liệu hoặc gỡ cài đặt.

Nhắc việc hiện cần ứng dụng đang mở. Chưa có push khi đóng app, widget Android/iOS, AI đọc ảnh/PDF hay tích hợp API VnEdu/Drive. Họ tên tạo hồ sơ cục bộ, không phải xác thực tài khoản. Không có khóa API hoặc thông tin đăng nhập trong mã nguồn.

## Biên dịch lại APK trên Windows

Yêu cầu JDK **17**, Android SDK Platform **35**, Build Tools **34.0.0**, PowerShell. Không cần tải thư viện bên thứ ba để build wrapper.

```powershell
./android/build.ps1 -SdkRoot 'C:/path/to/android-sdk' -JdkRoot 'C:/path/to/jdk-17'
```

Script chép `web/` vào APK, biên dịch Java, tạo DEX, căn chỉnh, ký phát triển và kiểm tra chữ ký. Mặc định tạo khóa phát triển ở `android/build/debug.keystore` (đã bỏ qua Git). Giữ lại cùng khóa nếu muốn cài đè bản cũ mà không mất dữ liệu; không đưa khóa phát hành lên GitHub.

## Kiểm tra

Cú pháp JavaScript; giao diện điện thoại và desktop; tab Giới thiệu/Quyền riêng tư; APK biên dịch thành công, xác minh chữ ký v2/v3 và căn chỉnh ZIP. Chưa thử cài APK trên điện thoại thật; tính năng nhận giọng nói, thông báo Android và hộp chọn tệp cần kiểm tra thêm trên thiết bị.
