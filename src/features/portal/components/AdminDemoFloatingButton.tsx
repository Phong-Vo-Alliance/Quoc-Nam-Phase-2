import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

export function AdminDemoFloatingButton() {
  return (
    <Link
      to="/admin-demo"
      className="group fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-700 shadow-lg transition-all hover:w-auto hover:gap-2 hover:px-4 hover:bg-green-800"
      title="Admin Demo Site"
    >
      <Settings className="h-5 w-5 shrink-0 text-white" />
      <span className="hidden whitespace-nowrap text-sm font-medium text-white group-hover:inline">
        Admin Demo
      </span>
    </Link>
  );
}
