import Link from "next/link";
import { Shield, BookOpen, Home, FileText, Terminal } from "lucide-react";

export default function Navigation() {
  return (
    <nav className="border-b border-red-900/50 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-red-500 font-bold"
          >
            <Shield className="w-6 h-6" />
            <span className="text-xl">SHAI-HULUD SCAN</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/education"
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Education
            </Link>
            <Link
              href="/analyze"
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Analyze
            </Link>
            <Link
              href="/developers"
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              Developers
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
