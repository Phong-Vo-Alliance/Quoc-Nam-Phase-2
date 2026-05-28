import { Link, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ArrowLeft, Moon, User } from "lucide-react";
import { AdminDemoSidebar } from "./components/AdminDemoSidebar";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { NhaCungCapPage } from "./pages/NhaCungCapPage";
import { NhomNCCPage } from "./pages/NhomNCCPage";
import { YeuCauXemSdtPage } from "./pages/YeuCauXemSdtPage";

function AdminDemoHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <Link
        to="/"
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Về Portal
      </Link>
      <div className="flex items-center gap-3">
        <button className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
          <Moon className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-gray-800">Admin</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AdminDemoApp() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <AdminDemoSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminDemoHeader />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Routes>
            <Route index element={<Navigate to="nha-cung-cap" replace />} />
            <Route path="nha-cung-cap" element={<NhaCungCapPage />} />
            <Route path="nhom-ncc" element={<NhomNCCPage />} />
            <Route path="yeu-cau-xem-sdt" element={<YeuCauXemSdtPage />} />
            <Route path=":slug" element={<PlaceholderPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
