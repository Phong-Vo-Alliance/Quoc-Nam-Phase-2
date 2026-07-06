# Phase 2 — Bộ tài liệu FSD theo feature

> Tài liệu mô tả nghiệp vụ chi tiết cho **từng tính năng** của Phase 2 (tích hợp Zalo Vendor). Mỗi feature là 1 file Markdown độc lập theo layout 7-section chuẩn (Tóm tắt · Giá trị nghiệp vụ · Vai trò · Dòng chảy · Kịch bản chấp nhận · Mô tả giao diện · Tham chiếu & Q&A).

## Cách dùng tài liệu này

- **PO / BA:** mở từng file theo nhu cầu — Tóm tắt và Dòng chảy đủ để review nghiệp vụ; Kịch bản chấp nhận dùng để chốt hành vi với client.
- **DEV:** Kịch bản chấp nhận (Gherkin) là spec implement chính. Mô tả giao diện là UI structure. Q&A là chỗ KHÔNG được tự đoán — phải chờ PO/BA trả lời.
- **QC:** Mỗi `Tình huống` Gherkin là 1 test case sẵn sàng. `Khung tình huống` + `Dữ liệu` là test data.

## Nguồn gốc

- **Scope canonical (single source of truth nghiệp vụ):** [`../scope-and-features.md`](../scope-and-features.md) — 31 feature đánh số #1-#31.
- **Tài liệu FSD cũ (legacy, đang dần được tách):** [`../FSD-Admin-Site.md`](../FSD-Admin-Site.md), [`../FSD-Chat-Portal.md`](../FSD-Chat-Portal.md). Sau khi feature đã có file riêng trong thư mục này, nội dung tương ứng ở 2 file legacy sẽ rút gọn thành cross-ref.

## Danh sách feature

> Trạng thái: **draft** (chưa review) · **reviewed** (BA/PO đã đọc) · **approved** (chốt để DEV implement).

### A. Kết nối & Đồng bộ Zalo

| #   | Tài liệu | Trạng thái |
| --- | -------- | ---------- |
| **#1** Kết nối tài khoản Zalo cá nhân (QR) | [`01-ket-noi-tai-khoan-zalo.md`](01-ket-noi-tai-khoan-zalo.md) | draft |
| **#2** Đồng bộ nhóm chat vendor | [`02-dong-bo-nhom-chat-vendor.md`](02-dong-bo-nhom-chat-vendor.md) | draft |
| **#3** Đồng bộ tin nhắn gần thực (Zalo → Portal) | [`03-dong-bo-tin-nhan-gan-thuc.md`](03-dong-bo-tin-nhan-gan-thuc.md) | draft |
| **#4** Đồng bộ lịch sử chat (Zalo → Portal) | [`04-dong-bo-lich-su-chat.md`](04-dong-bo-lich-su-chat.md) | draft |
| **#27** Kết nối lại & Thử lại kết nối | [`27-ket-noi-lai-va-thu-lai.md`](27-ket-noi-lai-va-thu-lai.md) | draft |

### B. Nhắn tin & Tương tác

| #   | Tài liệu | Trạng thái |
| --- | -------- | ---------- |
| **#5** Gửi/nhận tin nhắn văn bản (TXT) | [`05-gui-nhan-tin-nhan-van-ban.md`](05-gui-nhan-tin-nhan-van-ban.md) | draft |
| **#6** Gửi/nhận hình ảnh, tập tin, video | [`06-gui-nhan-media-va-file.md`](06-gui-nhan-media-va-file.md) | draft |
| **#7** Reply (trích dẫn tin nhắn) | [`07-reply-trich-dan-tin-nhan.md`](07-reply-trich-dan-tin-nhan.md) | draft |
| **#8** Thả cảm xúc (react emoji) | [`08-tha-cam-xuc-emoji.md`](08-tha-cam-xuc-emoji.md) | draft |
| **#9** Thu hồi tin nhắn | [`09-thu-hoi-tin-nhan.md`](09-thu-hoi-tin-nhan.md) | draft |
| **#10** Ghim tin nhắn | [`10-ghim-tin-nhan.md`](10-ghim-tin-nhan.md) | draft |
| **#11** Forward tin nhắn đến Admin | [`11-forward-tin-nhan-den-admin.md`](11-forward-tin-nhan-den-admin.md) | draft |
| **#25** Đánh dấu tin nhắn (Bookmark) | [`25-danh-dau-tin-nhan.md`](25-danh-dau-tin-nhan.md) | draft |

### C. Quản lý hội thoại

| #   | Tài liệu | Trạng thái |
| --- | -------- | ---------- |
| **#12** Ghim hội thoại (per-user) | [`12-ghim-hoi-thoai.md`](12-ghim-hoi-thoai.md) | draft |
| **#13** Watermark hình ảnh | [`13-watermark-hinh-anh.md`](13-watermark-hinh-anh.md) | draft |
| **#14** Phân quyền tải tập tin (Chat Portal enforce) | [`14-phan-quyen-tai-tap-tin.md`](14-phan-quyen-tai-tap-tin.md) | draft |
| **#26** Đặt tên hiển thị nhóm chat | [`26-dat-ten-hien-thi-nhom-chat.md`](26-dat-ten-hien-thi-nhom-chat.md) | draft |
| **#28** Mask SĐT & gửi yêu cầu xem (Staff side) | [`28-an-hien-so-dien-thoai-staff.md`](28-an-hien-so-dien-thoai-staff.md) | draft |
| **#28a** Admin duyệt yêu cầu xem SĐT ngay trong nhóm chat | [`28a-admin-duyet-yeu-cau-tu-chat.md`](28a-admin-duyet-yeu-cau-tu-chat.md) | draft |
| **#31** Lọc hội thoại NCC theo thẻ (Chat Portal) | [`31-loc-hoi-thoai-theo-the.md`](31-loc-hoi-thoai-theo-the.md) | draft |
| **#31a** Lọc nhóm NCC theo thẻ (Admin Site) | [`31a-loc-nhom-ncc-admin-site.md`](31a-loc-nhom-ncc-admin-site.md) | draft |

### D. Phân quyền & Multi-account

| #   | Tài liệu | Trạng thái |
| --- | -------- | ---------- |
| **#15** Phân quyền tài khoản Zalo | [`15-phan-quyen-tai-khoan-zalo.md`](15-phan-quyen-tai-khoan-zalo.md) | draft |
| **#16** Phân quyền nhóm chat | [`16-phan-quyen-nhom-chat.md`](16-phan-quyen-nhom-chat.md) | draft |
| **#23a** Modal "Quản lý thành viên" trên Chat Portal (thêm/xóa + quyền tải) | [`23a-quan-ly-thanh-vien-chat-portal.md`](23a-quan-ly-thanh-vien-chat-portal.md) | draft |
| **#17** Cấu trúc vai trò trong nhóm | [`17-cau-truc-vai-tro.md`](17-cau-truc-vai-tro.md) | draft |
| **D.4** Multi-account cho 1 vendor group [EXTRA] | [`D4-multi-account-vendor-group.md`](D4-multi-account-vendor-group.md) | draft |

### E. Công việc nội bộ

| #   | Tài liệu | Trạng thái |
| --- | -------- | ---------- |
| **#18** Giao việc nội bộ trong nhóm | [`18-giao-viec-noi-bo.md`](18-giao-viec-noi-bo.md) | draft |
| **#19** Nhật Ký công việc | [`19-nhat-ky-cong-viec.md`](19-nhat-ky-cong-viec.md) | draft |

### F. Admin Site

| #   | Tài liệu | Trạng thái |
| --- | -------- | ---------- |
| **#20** Liên kết tài khoản Zalo | [`20-lien-ket-tai-khoan-zalo.md`](20-lien-ket-tai-khoan-zalo.md) | draft |
| **#21** Đồng bộ dữ liệu | [`21-dong-bo-du-lieu.md`](21-dong-bo-du-lieu.md) | draft |
| **#22** Quản lý nhóm NCC | [`22-quan-ly-nhom-ncc.md`](22-quan-ly-nhom-ncc.md) | draft |
| **#23** Cập nhật quyền tải xuống theo nhóm chat (cấu hình) | [`23-cap-nhat-quyen-tai-xuong.md`](23-cap-nhat-quyen-tai-xuong.md) | draft |
| **#24** Theo dõi file lớn | [`24-theo-doi-file-lon.md`](24-theo-doi-file-lon.md) | draft |
| **#30** Quản lý thẻ phân loại nhóm NCC | [`30-quan-ly-the-phan-loai.md`](30-quan-ly-the-phan-loai.md) | draft |
| **#29** Trang Yêu Cầu Xem SĐT (Admin Site) | [`29-trang-yeu-cau-xem-sdt.md`](29-trang-yeu-cau-xem-sdt.md) | draft |
| **#29a** Cấu hình bật/tắt ẩn SĐT cho nhóm | [`29a-cau-hinh-an-sdt.md`](29a-cau-hinh-an-sdt.md) | draft |

### Shared / Cross-cutting

| Tài liệu | Trạng thái |
| -------- | ---------- |
| (chưa có) | — |

## Quy ước viết FSD

Bộ skill nội bộ tóm tắt quy ước viết các tài liệu trong thư mục này. Khi cần update hoặc viết feature mới, gõ:

```
/fsd-write
```

(Skill này không được mention trong nội dung FSD chính thức.)
