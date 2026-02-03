# 12. Luồng Hoạt Động Tổng Thể

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mục Đích

Tài liệu này mô tả các luồng hoạt động chính của hệ thống, từ đăng nhập đến xử lý công việc. Giúp QC và Mobile team hiểu rõ cách các tính năng liên kết với nhau.

---

## Luồng 1: Đăng Nhập Vào Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUỒNG ĐĂNG NHẬP                             │
└─────────────────────────────────────────────────────────────────┘

    [Mở ứng dụng]
          │
          ▼
    ┌─────────────┐
    │ Có session  │───── Có ─────► [Vào Portal ngay]
    │ hợp lệ?     │
    └─────────────┘
          │
         Không
          │
          ▼
    [Màn hình đăng nhập]
          │
          ▼
    [Nhập Username + Password]
          │
          ▼
    [Nhấn Đăng nhập]
          │
          ▼
    ┌─────────────┐
    │ Xác thực    │───── Fail ────► [Hiển thị lỗi]
    │ thành công? │                       │
    └─────────────┘                       ▼
          │                        [Nhập lại]
        Thành công
          │
          ▼
    [Lưu token]
          │
          ▼
    [Kết nối real-time]
          │
          ▼
    [Vào Portal]
```

---

## Luồng 2: Gửi và Nhận Tin Nhắn

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUỒNG NHẮN TIN                              │
└─────────────────────────────────────────────────────────────────┘

                        GỬI TIN NHẮN
                        ────────────
    [Chọn hội thoại từ sidebar]
          │
          ▼
    [Chat panel hiển thị]
          │
          ▼
    [Nhập nội dung / Đính kèm file]
          │
          ▼
    [Nhấn Gửi hoặc Enter]
          │
          ▼
    [Tin nhắn hiển thị với status "sending"]
          │
          ▼
    ┌─────────────┐
    │Server xác   │───── Fail ────► [Hiển thị error, retry]
    │nhận thành   │
    │công?        │
    └─────────────┘
          │
        Thành công
          │
          ▼
    [Status chuyển "sent", hiện timestamp]


                        NHẬN TIN NHẮN
                        ────────────
    [Tin mới từ SignalR]
          │
          ▼
    ┌─────────────────────┐
    │ Đang xem            │
    │ conversation này?   │
    └─────────────────────┘
          │               │
         Có              Không
          │               │
          ▼               ▼
    [Auto scroll   [Badge tăng,
     + animation]   conversation
                    lên đầu danh sách]
```

---

## Luồng 3: Tạo Task Từ Tin Nhắn

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUỒNG TẠO TASK                              │
└─────────────────────────────────────────────────────────────────┘

    [Leader trong chat]
          │
          ▼
    [Right-click vào tin nhắn]
          │
          ▼
    [Menu: Reply | Pin | Star | ★ TẠO TASK]
          │
          ▼
    [Modal Tạo Task mở]
          │
          ▼
    [Điền thông tin]
    • Title (từ nội dung tin nhắn)
    • Assignee (chọn nhân viên)
    • WorkType (chọn loại việc)
    • Priority (chọn mức độ)
    • Checklist (từ template)
          │
          ▼
    [Nhấn Tạo]
          │
          ▼
    ┌─────────────────────┐
    │ Tạo thành công?     │───── Fail ────► [Hiển thị lỗi]
    └─────────────────────┘
          │
        Thành công
          │
          ├────► [Task xuất hiện trong danh sách]
          │
          ├────► [Tin hệ thống: "Leader đã tạo task..."]
          │
          └────► [Nhân viên nhận notification]
```

---

## Luồng 4: Xử Lý Task (Staff)

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUỒNG XỬ LÝ TASK (STAFF)                    │
└─────────────────────────────────────────────────────────────────┘

    [Nhân viên nhận notification task mới]
          │
          ▼
    [Vào danh sách Tasks hoặc click notification]
          │
          ▼
    [Mở Task Detail]
          │
    Status: TODO
          │
          ▼
    [Click "Bắt đầu làm"]
          │
          ▼
    Status: DOING ←──────────────────────────────────┐
          │                                          │
          ▼                                          │
    [Thực hiện công việc]                           │
    [Tick checklist items]                          │
    [Có thể log vào Task Thread]                    │
          │                                          │
          ▼                                          │
    [Hoàn thành? Click "Gửi duyệt"]                 │
          │                                          │
          ▼                                          │
    Status: NEED VERIFY                              │
          │                                          │
          ▼                                          │
    [Leader nhận notification]                       │
          │                                          │
          ▼                                          │
    ┌─────────────────────┐                          │
    │ Leader duyệt?       │                          │
    └─────────────────────┘                          │
          │               │                          │
       Approve         Reject                        │
          │               │                          │
          ▼               └──────────────────────────┘
    Status: FINISHED      (Về DOING, kèm lý do reject)
          │
          ▼
    [Task hoàn thành]
```

---

## Luồng 5: Preview File Với Watermark

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUỒNG PREVIEW FILE                          │
└─────────────────────────────────────────────────────────────────┘

    [Click vào file trong chat hoặc File Explorer]
          │
          ▼
    ┌─────────────────────┐
    │ Loại file là gì?    │
    └─────────────────────┘
          │               │               │
        Ảnh             PDF           Excel/Word
          │               │               │
          ▼               ▼               ▼
    [Image Modal]   [PDF Viewer]    [Table/Text View]
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
                [Render watermark]
                • Tên user đang xem
                • Timestamp hiện tại
                • Session ID
                          │
                          ▼
                [Áp dụng security]
                • Chặn right-click
                • Chặn Ctrl+C/S/P
                          │
                          ▼
                [Hiển thị cho user]
```

---

## Luồng 6: Upload File

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUỒNG UPLOAD FILE                           │
└─────────────────────────────────────────────────────────────────┘

    [Click nút đính kèm 📎]
          │
          ▼
    [File Picker mở]
          │
          ▼
    [Chọn file(s)]
          │
          ▼
    ┌─────────────────────┐
    │ Validate file       │
    │ • Loại file OK?     │───── Fail ────► [Thông báo lỗi]
    │ • Size ≤ 50MB?      │
    └─────────────────────┘
          │
        Pass
          │
          ▼
    [Preview/Thumbnail hiển thị]
          │
          ▼
    [Thêm caption (tùy chọn)]
          │
          ▼
    [Nhấn Gửi]
          │
          ▼
    [Upload với progress bar]
          │
          ▼
    [File hiện trong chat]
    [Auto sync vào File Explorer]
```

---

## Sơ Đồ Điều Hướng Tổng Thể

```
┌─────────────────────────────────────────────────────────────────┐
│                     NAVIGATION MAP                              │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │    LOGIN     │
                          └──────────────┘
                                 │
                          (đăng nhập thành công)
                                 │
                                 ▼
                          ┌──────────────┐
                          │    PORTAL    │
                          └──────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
    ┌───────────┐         ┌───────────┐         ┌───────────┐
    │  Sidebar  │◄───────►│   Chat    │◄───────►│   Right   │
    │   (Hội    │ click   │   Panel   │ toggle  │   Panel   │
    │  thoại)   │         │           │         │           │
    └───────────┘         └───────────┘         └───────────┘
          │                      │                      │
          │ quick actions        │ context menu         │ tabs
          ▼                      ▼                      ▼
    ┌───────────┐         ┌───────────┐         ┌───────────┐
    │• Pinned   │         │• Reply    │         │• Info     │
    │• Todo     │         │• Pin      │         │• Pinned   │
    │• Quick    │         │• Create   │         │• Media    │
    │  Message  │         │  Task     │         │• Files    │
    └───────────┘         └───────────┘         │• Tasks    │
                                                └───────────┘
                                                      │
                                                      ▼
                                                ┌───────────┐
                                                │  Modals   │
                                                │• Task     │
                                                │  Detail   │
                                                │• File     │
                                                │  Explorer │
                                                │• Image    │
                                                │  Preview  │
                                                └───────────┘

    ────────────────────────────────────────────────────────────

                              LEADER ONLY
                          ┌──────────────┐
                          │  LEAD VIEW   │
                          │  (Kanban +   │
                          │  Dashboard)  │
                          └──────────────┘
```

---

## Bảng Điều Hướng Chi Tiết

| Từ màn hình | Action | Đến màn hình |
|-------------|--------|--------------|
| Login | Đăng nhập thành công | Portal |
| Portal | Logout | Login |
| Sidebar | Click conversation | Chat Panel |
| Sidebar | Click Pinned | Pinned Modal |
| Sidebar | Click Todo | Task List |
| Chat Panel | Click message file | File Preview |
| Chat Panel | Right-click message | Context Menu |
| Context Menu | Create Task | Task Create Modal |
| Right Panel | Click task | Task Detail Modal |
| Right Panel | View All Files | File Explorer Modal |
| Task Detail | Change status | (Cập nhật UI) |
| Lead View | Click task card | Task Detail Modal |
| Lead View | Drag card | (Thay đổi status) |

---

## Luồng Lỗi: Mất Kết Nối

```
    [Đang sử dụng Portal]
          │
          ▼
    ┌─────────────────────┐
    │ Mất kết nối mạng /  │
    │ Server không phản   │
    │ hồi                 │
    └─────────────────────┘
          │
          ▼
    [Banner lỗi hiển thị]
    "Mất kết nối. Đang thử lại..."
          │
          ▼
    [Retry tự động mỗi 5 giây]
          │
          ▼
    ┌─────────────────────┐
    │ Kết nối lại được?   │
    └─────────────────────┘
          │               │
         Có              Không (quá số lần)
          │               │
          ▼               ▼
    [Banner ẩn]    [Button "Thử lại" thủ công]
    [Sync lại dữ liệu]
```

---

## Luồng Lỗi: Session Hết Hạn

```
    [Đang sử dụng Portal]
          │
          ▼
    ┌─────────────────────┐
    │ Token hết hạn       │
    │ (hoặc bị revoke)    │
    └─────────────────────┘
          │
          ▼
    [Popup hiển thị]
    "Phiên làm việc đã hết hạn.
     Vui lòng đăng nhập lại."
          │
          ▼
    [Redirect về Login]
          │
          ▼
    [Clear local data]
```

---

## [QC] End-to-End Test Scenarios

### Scenario 1: Workflow Hoàn Chỉnh

1. Đăng nhập với tài khoản Leader
2. Chọn một hội thoại
3. Gửi một tin nhắn có nội dung task
4. Right-click → Tạo Task
5. Giao cho Staff A
6. Logout

7. Đăng nhập với tài khoản Staff A
8. Xem task được giao
9. Bắt đầu làm (Todo → Doing)
10. Tick một số checklist items
11. Gửi duyệt (Doing → Need Verify)
12. Logout

13. Đăng nhập lại với Leader
14. Duyệt task (Need Verify → Finished)
15. Xác nhận task hoàn thành

### Scenario 2: File Upload và Preview

1. Đăng nhập
2. Chọn hội thoại
3. Upload ảnh từ máy
4. Xác nhận ảnh hiển thị trong chat
5. Click preview → Xác nhận watermark hiển thị
6. Thử right-click → Không có menu save
7. Mở File Explorer → Xác nhận file xuất hiện

### Scenario 3: Real-time Messaging

1. Mở 2 browser, login 2 user khác nhau
2. User A gửi tin nhắn
3. User B nhận tin ngay (không cần refresh)
4. User B reply
5. User A thấy reply ngay

---

## [Mobile] Navigation Stack

```
                 Stack Navigator
          ┌──────────────────────────┐
          │ Login Screen             │
          │                          │
          └──────────────────────────┘
                      │
                      ▼
          ┌──────────────────────────┐
          │ Tab Navigator            │
          │ ┌────┬────┬────┬────┐   │
          │ │Chat│Task│File│More│   │
          │ └────┴────┴────┴────┘   │
          └──────────────────────────┘
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
      ┌─────────┐ ┌─────────┐ ┌─────────┐
      │ Chat    │ │ Task    │ │ File    │
      │ List    │ │ List    │ │ Manager │
      └─────────┘ └─────────┘ └─────────┘
           │          │          │
           ▼          ▼          ▼
      ┌─────────┐ ┌─────────┐ ┌─────────┐
      │ Chat    │ │ Task    │ │ Folder  │
      │ Detail  │ │ Detail  │ │ View    │
      │ (push)  │ │ (modal) │ │ (push)  │
      └─────────┘ └─────────┘ └─────────┘
           │
           ▼
      ┌─────────┐
      │ Group   │
      │ Info    │
      │ (modal) │
      └─────────┘
```

---

## Lưu Ý Navigation Cho Mobile

| Hành vi | Implementation |
|---------|----------------|
| Back button | Pop current screen |
| Deep link | Navigate đến màn hình cụ thể |
| Push notification tap | Navigate đến conversation/task tương ứng |
| Swipe from edge | Go back (iOS) |

---

**Kết thúc bộ tài liệu.**

Để quay về mục lục: [00-muc-luc.md](./00-muc-luc.md)
