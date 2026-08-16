import React, { useState } from "react";
import {
  UserCheck,
  Lock,
  Building,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  X,
  UserPlus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { TeacherProfile, GRADES, GRADE_LEVELS, SUBJECTS_BY_LEVEL } from "../types";

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeacher: TeacherProfile | null;
  teachers: TeacherProfile[];
  onSelectTeacher: (teacher: TeacherProfile) => void;
  onRefreshTeachers: () => void;
  mode?: "switch" | "edit" | "register";
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  currentTeacher,
  teachers,
  onSelectTeacher,
  onRefreshTeachers,
  mode: initialMode = "switch",
}) => {
  const [mode, setMode] = useState<"switch" | "edit" | "register">(initialMode);

  // Switch / Login state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(currentTeacher?.id || (teachers[0]?.id || ""));
  const [pinInput, setPinInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [loginSuccess, setLoginSuccess] = useState<string>("");

  // Register / Edit form state
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    schoolName: "Trường THPT Chuyên Chuẩn Quốc Gia",
    level: "THPT" as "Tiểu học" | "THCS" | "THPT",
    primaryGrade: "Lớp 10",
    primarySubject: "Toán",
    assignedGrades: ["Lớp 10"] as string[],
    pinCode: "123456",
  });

  if (!isOpen) return null;

  const handleQuickLogin = async (targetTeacher: TeacherProfile, enteredPin?: string) => {
    setLoginError("");
    setLoginSuccess("");

    try {
      const res = await fetch("/api/teachers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: targetTeacher.username,
          pinCode: enteredPin || pinInput || "123456",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Mã PIN không đúng.");
        return;
      }

      onSelectTeacher(data.teacher);
      setLoginSuccess(`Đã chuyển sang tài khoản: ${data.teacher.name}`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setLoginError("Lỗi kết nối máy chủ");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!formData.name.trim()) {
      setLoginError("Vui lòng nhập họ tên giáo viên");
      return;
    }

    try {
      if (mode === "register") {
        const res = await fetch("/api/teachers/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username || `gv_${Date.now().toString(36)}`,
            name: formData.name,
            schoolName: formData.schoolName,
            level: formData.level,
            primaryGrade: formData.primaryGrade,
            primarySubject: formData.primarySubject,
            assignedGrades: [formData.primaryGrade],
            assignedSubjects: [formData.primarySubject],
            pinCode: formData.pinCode || "123456",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLoginError(data.error || "Lỗi tạo tài khoản");
          return;
        }
        onRefreshTeachers();
        onSelectTeacher(data.teacher);
        onClose();
      } else if (mode === "edit" && currentTeacher) {
        const res = await fetch(`/api/teachers/${currentTeacher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) {
          setLoginError(data.error || "Lỗi cập nhật hồ sơ");
          return;
        }
        onRefreshTeachers();
        onSelectTeacher(data.teacher);
        onClose();
      }
    } catch (err: any) {
      setLoginError("Lỗi khi lưu dữ liệu");
    }
  };

  const availableSubjects = SUBJECTS_BY_LEVEL[formData.level] || [];

  return (
    <div id="teacher-auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Quản Lý Tài Khoản Giáo Viên Theo Khối
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/20">
                  Bảo Mật & Phân Quyền
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Cô lập dữ liệu đề thi theo từng giáo viên, tránh chồng chéo các khối học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation in Modal */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setMode("switch");
              setLoginError("");
            }}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              mode === "switch"
                ? "border-blue-600 text-blue-700 bg-white rounded-t-lg border-t border-x border-slate-200"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Đăng Nhập / Chọn Giáo Viên ({teachers.length})
          </button>

          <button
            onClick={() => {
              setMode("register");
              setLoginError("");
              setFormData({
                username: `gv_${Date.now().toString(36)}`,
                name: "",
                schoolName: "Trường THPT Chuyên Chuẩn Quốc Gia",
                level: "THPT",
                primaryGrade: "Lớp 10",
                primarySubject: "Toán",
                assignedGrades: ["Lớp 10"],
                pinCode: "123456",
              });
            }}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              mode === "register"
                ? "border-blue-600 text-blue-700 bg-white rounded-t-lg border-t border-x border-slate-200"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Tạo Tài Khoản Giáo Viên Mới
          </button>

          {currentTeacher && (
            <button
              onClick={() => {
                setMode("edit");
                setLoginError("");
                setFormData({
                  username: currentTeacher.username,
                  name: currentTeacher.name,
                  schoolName: currentTeacher.schoolName,
                  level: currentTeacher.level,
                  primaryGrade: currentTeacher.primaryGrade,
                  primarySubject: currentTeacher.primarySubject,
                  assignedGrades: currentTeacher.assignedGrades || [currentTeacher.primaryGrade],
                  pinCode: currentTeacher.pinCode || "123456",
                });
              }}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
                mode === "edit"
                  ? "border-blue-600 text-blue-700 bg-white rounded-t-lg border-t border-x border-slate-200"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Sửa Hồ Sơ Giảng Dạy
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {loginSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{loginSuccess}</span>
            </div>
          )}

          {mode === "switch" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Chọn Giáo Viên Theo Khối & Bộ Môn Để Đăng Nhập Làm Việc:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teachers.map((t) => {
                  const isCurrent = currentTeacher?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleQuickLogin(t, "123456")}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                        isCurrent
                          ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold text-white bg-gradient-to-r ${
                              t.avatarColor || "from-blue-600 to-indigo-600"
                            }`}
                          >
                            {t.level} • {t.primaryGrade}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Đang chọn
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                        <p className="text-xs text-indigo-700 font-medium mt-0.5">
                          Môn chuyên trách: {t.primarySubject}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          {t.schoolName}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Mã: {t.username}</span>
                        <span className="text-blue-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                          Đăng nhập <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Tính năng Bảo mật & Phân quyền thông minh:</span> Khi đăng nhập, toàn bộ đề thi được tạo sẽ tự động gắn mã của Thầy/Cô, ưu tiên ngân hàng SGK đúng khối lớp và AI sẽ được định hình tối đa cho môn học phụ trách mà không làm rò rỉ hay xáo trộn đề thi giữa các khối học khác nhau.
                </div>
              </div>
            </div>
          )}

          {(mode === "register" || mode === "edit") && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và Tên Giáo Viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Thầy Nguyễn Văn A..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Đăng Nhập / Mã Định Danh
                  </label>
                  <input
                    type="text"
                    disabled={mode === "edit"}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="VD: gv_toan10..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cấp Học Phụ Trách
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => {
                      const newLevel = e.target.value as "Tiểu học" | "THCS" | "THPT";
                      const defaultGrade = newLevel === "Tiểu học" ? "Lớp 3" : newLevel === "THCS" ? "Lớp 7" : "Lớp 10";
                      const defaultSubject = SUBJECTS_BY_LEVEL[newLevel][0] || "Toán";
                      setFormData({
                        ...formData,
                        level: newLevel,
                        primaryGrade: defaultGrade,
                        primarySubject: defaultSubject,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Tiểu học">Tiểu học (Lớp 1 - 5)</option>
                    <option value="THCS">THCS (Lớp 6 - 9)</option>
                    <option value="THPT">THPT (Lớp 10 - 12)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối Lớp Chính
                  </label>
                  <select
                    value={formData.primaryGrade}
                    onChange={(e) => {
                      const g = e.target.value;
                      const level = GRADE_LEVELS[g] || "THPT";
                      setFormData({ ...formData, primaryGrade: g, level });
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {GRADES.filter((g) => GRADE_LEVELS[g] === formData.level).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn Học Chuyên Trách
                  </label>
                  <select
                    value={formData.primarySubject}
                    onChange={(e) => setFormData({ ...formData, primarySubject: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đơn Vị Trường Công Tác
                </label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="VD: Trường THPT Chuyên Chuẩn Quốc Gia..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Bảo Mật PIN (Mật khẩu cá nhân)
                  </label>
                  <input
                    type="password"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="Mặc định: 123456"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Dùng để xác thực khi tạo đề và truy cập đề thi mật.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMode("switch")}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
                >
                  {mode === "register" ? "Lưu & Kích Hoạt Tài Khoản" : "Cập Nhật Thông Tin"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
