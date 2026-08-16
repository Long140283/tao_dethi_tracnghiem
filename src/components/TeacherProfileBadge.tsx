import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Shield,
  ChevronDown,
  Lock,
  Layers,
  Sparkles,
  School,
  LogOut,
  UserCheck,
  Building,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { TeacherProfile } from "../types";

interface TeacherProfileBadgeProps {
  currentTeacher: TeacherProfile | null;
  teachers: TeacherProfile[];
  onSelectTeacher: (teacher: TeacherProfile) => void;
  onOpenAuthModal: (mode?: "switch" | "edit" | "register") => void;
  isIsolatedMode: boolean;
  setIsIsolatedMode: (val: boolean) => void;
}

export const TeacherProfileBadge: React.FC<TeacherProfileBadgeProps> = ({
  currentTeacher,
  teachers,
  onSelectTeacher,
  onOpenAuthModal,
  isIsolatedMode,
  setIsIsolatedMode,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentTeacher) {
    return (
      <button
        onClick={() => onOpenAuthModal("switch")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
      >
        <User className="w-3.5 h-3.5" />
        <span>Đăng Nhập Giáo Viên</span>
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="btn-teacher-profile-dropdown"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-slate-50 transition shadow-2xs group"
      >
        <div
          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
            currentTeacher.avatarColor || "from-blue-600 to-indigo-600"
          } flex items-center justify-center text-white text-xs font-black shadow-xs`}
        >
          {currentTeacher.name.charAt(currentTeacher.name.lastIndexOf(" ") + 1) || "G"}
        </div>

        <div className="text-left hidden md:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition truncate max-w-[130px]">
              {currentTeacher.name}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
              {currentTeacher.primaryGrade}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
            {currentTeacher.primarySubject} • {currentTeacher.level}
          </p>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Info */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                  currentTeacher.avatarColor || "from-blue-600 to-indigo-600"
                } flex items-center justify-center text-white text-sm font-black shadow-sm`}
              >
                {currentTeacher.name.charAt(currentTeacher.name.lastIndexOf(" ") + 1) || "G"}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{currentTeacher.name}</h4>
                <p className="text-[11px] font-semibold text-indigo-600 truncate">
                  Môn: {currentTeacher.primarySubject} ({currentTeacher.primaryGrade})
                </p>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Building className="w-3 h-3 shrink-0" />
                  {currentTeacher.schoolName}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Isolation Switch */}
          <div className="px-3 py-2.5 border-b border-slate-100">
            <div
              onClick={() => setIsIsolatedMode(!isIsolatedMode)}
              className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                isIsolatedMode
                  ? "bg-blue-50 border border-blue-200 text-blue-800"
                  : "bg-slate-50 border border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                {isIsolatedMode ? (
                  <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {isIsolatedMode ? "Chế độ Bảo Mật Cá Nhân" : "Xem Toàn Bộ Trường"}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {isIsolatedMode ? "Chỉ hiển thị đề thi của Thầy/Cô" : "Hiển thị đề thi của mọi khối"}
                  </div>
                </div>
              </div>
              <div
                className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                  isIsolatedMode ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
              </div>
            </div>
          </div>

          {/* Switch to other teacher profiles */}
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
              Chuyển nhanh giáo viên khối khác:
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {teachers.map((t) => {
                const isActive = currentTeacher.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTeacher(t);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      />
                      <span className="truncate">{t.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {t.primaryGrade} • {t.primarySubject}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action links */}
          <div className="p-1 space-y-0.5 text-xs">
            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenAuthModal("edit");
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chỉnh sửa hồ sơ & môn phụ trách</span>
            </button>

            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenAuthModal("register");
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thêm tài khoản giáo viên mới</span>
            </button>

            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenAuthModal("switch");
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 transition"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Quản lý danh sách giáo viên ({teachers.length})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
