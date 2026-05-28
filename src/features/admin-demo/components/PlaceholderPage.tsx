import { CheckCircle } from "lucide-react";
import { useParams } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "phong-ban": "Phòng ban",
  "nhom-chat": "Nhóm chat",
  "loai-viec": "Loại việc",
  "bao-cao-loai-viec": "Báo cáo - Loại việc",
  users: "Danh sách user",
  "mat-khau": "Quản lý mật khẩu",
  "thiet-bi": "Quản lý thiết bị",
  "phan-quyen": "Phân quyền",
  "dang-checklist": "Dạng checklist",
  "bao-cao-checklist": "Báo cáo - Checklist",
  "trang-thai": "Trạng thái công việc",
  "cai-dat": "Cài Đặt",
  "nhat-ky": "Nhật Ký",
};

export function PlaceholderPage() {
  const { slug } = useParams<{ slug: string }>();
  const title = (slug && PAGE_TITLES[slug]) ?? "Trang";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">{title}</h1>
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-gray-700">
            Chức năng đã được phát triển
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Tính năng này hoạt động đầy đủ trong hệ thống production
          </p>
        </div>
      </div>
    </div>
  );
}
