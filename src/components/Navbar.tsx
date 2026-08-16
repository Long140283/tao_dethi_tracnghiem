import React from "react";
import { GraduationCap, Layers, BarChart3, History, UserCheck, Sparkles, Bot } from "lucide-react";
import { TeacherProfile } from "../types";
import { TeacherProfileBadge } from "./TeacherProfileBadge";

interface NavbarProps {
  activeTab: "generator" | "bank" | "results" | "history" | "student";
  setActiveTab: (tab: "generator" | "bank" | "results" | "history" | "student") => void;
  isStudentMode: boolean;
  setIsStudentMode: (val: boolean) => void;
  studentActiveTestId: string | null;
  onOpenAiAssistant: () => void;
  currentTeacher: TeacherProfile | null;
  teachers: TeacherProfile[];
  onSelectTeacher: (teacher: TeacherProfile) => void;
  onOpenAuthModal: (mode?: "switch" | "edit" | "register") => void;
  isIsolatedMode: boolean;
  setIsIsolatedMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isStudentMode,
  setIsStudentMode,
  onOpenAiAssistant,
  currentTeacher,
  teachers,
  onSelectTeacher,
  onOpenAuthModal,
  isIsolatedMode,
  setIsIsolatedMode,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none shrink-0"
            onClick={() => {
              setIsStudentMode(false);
              setActiveTab("generator");
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">Hệ Thống Thi Online</span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                  Lớp 1 - 12
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden xl:block">Phân quyền Giáo viên theo Khối • Trợ Lý AI 4.0</p>
            </div>
          </div>

          {/* Navigation Controls */}
          {!isStudentMode ? (
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
              <nav className="flex items-center space-x-1 sm:space-x-1.5">
                <button
                  id="nav-tab-gen"
                  onClick={() => setActiveTab("generator")}
                  className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === "generator"
                      ? "bg-blue-50 text-blue-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="hidden lg:inline">Tạo Đề Thi Mới</span>
                  <span className="lg:hidden">Tạo đề</span>
                </button>

                <button
                  id="nav-tab-bank"
                  onClick={() => setActiveTab("bank")}
                  className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === "bank"
                      ? "bg-blue-50 text-blue-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="hidden lg:inline">Ngân Hàng SGK</span>
                  <span className="lg:hidden">Ngân hàng</span>
                </button>

                <button
                  id="nav-tab-results"
                  onClick={() => setActiveTab("results")}
                  className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === "results"
                      ? "bg-blue-50 text-blue-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span className="hidden lg:inline">Chấm Điểm & Kết Quả</span>
                  <span className="lg:hidden">Kết quả</span>
                </button>

                <button
                  id="nav-tab-history"
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === "history"
                      ? "bg-blue-50 text-blue-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <History className="w-4 h-4 text-amber-600" />
                  <span className="hidden lg:inline">Kho Đề & Xuất PDF</span>
                  <span className="lg:hidden">Kho đề</span>
                </button>

                {/* AI Assistant Trigger Button */}
                <button
                  id="btn-open-ai-assistant"
                  onClick={onOpenAiAssistant}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-xs transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Trợ Lý AI</span>
                </button>
              </nav>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

              {/* Teacher Profile Switcher & Isolated Status */}
              <TeacherProfileBadge
                currentTeacher={currentTeacher}
                teachers={teachers}
                onSelectTeacher={onSelectTeacher}
                onOpenAuthModal={onOpenAuthModal}
                isIsolatedMode={isIsolatedMode}
                setIsIsolatedMode={setIsIsolatedMode}
              />

              <button
                id="btn-switch-student-mode"
                onClick={() => setIsStudentMode(true)}
                className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thí Sinh</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Giao diện Thí sinh Làm bài Trực tuyến
              </span>
              <button
                id="btn-exit-student-mode"
                onClick={() => setIsStudentMode(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-300"
              >
                Về Trang Giáo Viên
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
