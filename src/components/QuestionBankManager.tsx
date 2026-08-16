import React, { useState } from "react";
import {
  FolderPlus,
  Folder,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Layers,
  BookOpen,
  AlertCircle,
  Sparkles,
  Download,
  Search,
  Filter,
  PlayCircle,
  PlusCircle,
  FileCheck,
  Calendar,
  Zap,
  GraduationCap
} from "lucide-react";
import { FolderRecord, SUBJECTS, GRADES, ACADEMIC_YEARS, TeacherProfile } from "../types";

interface QuestionBankManagerProps {
  folders: FolderRecord[];
  onRefreshFolders: () => void;
  onOpenCurriculumDownloader: () => void;
  onOpenAiAssistant: () => void;
  onGenerateFromFolder?: (folder: FolderRecord) => void;
  currentTeacher?: TeacherProfile | null;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  folders,
  onRefreshFolders,
  onOpenCurriculumDownloader,
  onOpenAiAssistant,
  onGenerateFromFolder,
  currentTeacher,
}) => {
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderNote, setNewFolderNote] = useState("");
  const [newFolderYear, setNewFolderYear] = useState(ACADEMIC_YEARS[0]);
  const [expandedFolderId, setExpandedFolderId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<"all" | "Tiểu học" | "THCS" | "THPT">("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("all");

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      setErrorMsg("Vui lòng nhập tên thư mục!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          note: newFolderNote,
          academicYear: newFolderYear,
        }),
      });
      if (!res.ok) throw new Error("Không thể tạo thư mục");
      setNewFolderName("");
      setNewFolderNote("");
      onRefreshFolders();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFolder = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thư mục "${name}" cùng toàn bộ câu hỏi bên trong?`)) return;
    try {
      await fetch(`/api/folders/${id}`, { method: "DELETE" });
      onRefreshFolders();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFolders = folders.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (f.note && f.note.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (f.subject && f.subject.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (f.textbook && f.textbook.toLowerCase().includes(searchKeyword.toLowerCase()));
    
    const matchYear = selectedYearFilter === "all" || !f.academicYear || f.academicYear === selectedYearFilter;
    const matchLevel = selectedLevelFilter === "all" || f.level === selectedLevelFilter;
    const matchSubject = selectedSubjectFilter === "all" || f.subject === selectedSubjectFilter;
    const matchGrade = selectedGradeFilter === "all" || f.grade === selectedGradeFilter;
    
    return matchSearch && matchYear && matchLevel && matchSubject && matchGrade;
  });

  return (
    <div className="space-y-8">
      {/* Top Action Banner for Curriculum Downloader */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>Tải Toàn Bộ Ngân Hàng SGK Chuẩn Bộ Giáo Dục Theo Năm Học</span>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                AI TẢI TỰ ĐỘNG
              </span>
            </h2>
            <p className="text-xs text-blue-100 mt-1">
              Phân loại rõ ràng theo từng Khối (1 - 12), Bộ Môn chuẩn và Bộ Sách (Kết nối tri thức, Cánh Diều, Chân trời sáng tạo) lưu trữ trực tiếp vào kho dữ liệu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenCurriculumDownloader}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs shadow-sm hover:bg-indigo-50 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Check & Tải Ma Trận SGK (12 Khối)</span>
          </button>
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500/30 hover:bg-purple-500/40 border border-white/20 text-white font-bold text-xs transition cursor-pointer"
          >
            <span>Trợ Lý AI</span>
          </button>
        </div>
      </div>

      {/* Level Quick Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSelectedLevelFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            selectedLevelFilter === "all"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Tất cả cấp học
        </button>
        <button
          onClick={() => setSelectedLevelFilter("Tiểu học")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            selectedLevelFilter === "Tiểu học"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Tiểu học (Lớp 1 - 5)</span>
        </button>
        <button
          onClick={() => setSelectedLevelFilter("THCS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            selectedLevelFilter === "THCS"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>THCS (Lớp 6 - 9)</span>
        </button>
        <button
          onClick={() => setSelectedLevelFilter("THPT")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            selectedLevelFilter === "THPT"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>THPT (Lớp 10 - 12)</span>
        </button>

        {currentTeacher && (
          <button
            onClick={() => {
              setSelectedLevelFilter(currentTeacher.level);
              setSelectedGradeFilter(currentTeacher.primaryGrade);
              setSelectedSubjectFilter(currentTeacher.primarySubject);
            }}
            className="ml-auto px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 hover:bg-blue-100 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Kho SGK của tôi: {currentTeacher.primaryGrade} • {currentTeacher.primarySubject}</span>
          </button>
        )}
      </div>

      {/* Create New Custom Folder Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tạo Thư Mục Chuyên Đề Mới</h2>
            <p className="text-xs text-slate-500">Tự tạo kho lưu trữ theo từng chương, chuyên đề bồi dưỡng học sinh</p>
          </div>
        </div>

        <form onSubmit={handleCreateFolder} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Năm Học
            </label>
            <select
              value={newFolderYear}
              onChange={(e) => setNewFolderYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tên Thư Mục
            </label>
            <input
              type="text"
              required
              placeholder="VD: Ôn tập Hình Học 10 - Cánh Diều..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Ghi chú mô tả (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Trọng tâm đề thi giữa kỳ 1..."
              value={newFolderNote}
              onChange={(e) => setNewFolderNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isSubmitting ? "Đang tạo..." : "Tạo Thư Mục"}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Folders List & Search Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Kho Ngân Hàng SGK & Thư Mục Đã Lưu Trữ ({filteredFolders.length})
            </h2>
            <p className="text-xs text-slate-500">Quản lý và tra cứu toàn bộ ngân hàng câu hỏi bám sát chuẩn Bộ Giáo Dục</p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm môn, sách..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">Tất cả năm học</option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">Tất cả môn</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">Tất cả khối</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredFolders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa có thư mục nào phù hợp với bộ lọc</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Thầy/Cô hãy bấm nút <b>"Mở Bảng Tải SGK"</b> ở góc trên để AI tải về trọn bộ ngân hàng câu hỏi bám sát sách giáo khoa chuẩn.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFolders.map((f) => {
              const isExpanded = expandedFolderId === f.id;
              const mcCount = f.questions?.["Multiple Choice"]?.length || 0;
              const esCount = f.questions?.Essay?.length || 0;

              return (
                <div key={f.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 transition hover:border-slate-300">
                  <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-sm text-slate-900">{f.name}</span>
                          {f.academicYear && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {f.academicYear}
                            </span>
                          )}
                          {f.textbook && (
                            <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                              {f.textbook}
                            </span>
                          )}
                          {f.period && (
                            <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                              {f.period}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                            {mcCount} trắc nghiệm
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                            {esCount} tự luận
                          </span>
                          {f.note && <span className="text-slate-600 font-normal">({f.note})</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {onGenerateFromFolder && (
                        <button
                          onClick={() => onGenerateFromFolder(f)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Tạo Đề Từ Thư Mục Này</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedFolderId(isExpanded ? null : f.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isExpanded ? "Thu gọn" : "Xem câu hỏi"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDeleteFolder(f.id, f.name)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                        title="Xóa thư mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200 space-y-4">
                      {mcCount === 0 && esCount === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Thư mục hiện chưa có câu hỏi nào. Bạn có thể thêm câu hỏi bằng AI ở tab "Tạo Đề Thi Mới" hoặc tải từ ngân hàng SGK.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {mcCount > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Phần Trắc Nghiệm ({mcCount} câu):</span>
                              </h4>
                              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {f.questions["Multiple Choice"].map((q, idx) => (
                                  <div key={idx} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100">
                                    <div className="font-semibold text-slate-800 flex justify-between">
                                      <span>{idx + 1}. {q.question}</span>
                                      {q.cognitiveLevel && (
                                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                                          {q.cognitiveLevel}
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pl-2">
                                      {q.options.map((opt, oIdx) => (
                                        <span key={oIdx} className={opt === q.answer ? "font-bold text-emerald-700" : ""}>
                                          {String.fromCharCode(65 + oIdx)}. {opt} {opt === q.answer ? "✓" : ""}
                                        </span>
                                      ))}
                                    </div>
                                    {q.explanation && (
                                      <p className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-100">
                                        💡 {q.explanation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {esCount > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Phần Tự Luận & Hướng Dẫn Chấm ({esCount} câu):</span>
                              </h4>
                              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {f.questions.Essay.map((q, idx) => (
                                  <div key={idx} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100">
                                    <div className="font-semibold text-slate-800 flex justify-between">
                                      <span>{idx + 1}. {q.question}</span>
                                      {q.cognitiveLevel && (
                                        <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                                          {q.cognitiveLevel}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-amber-900 bg-amber-50/70 p-2 rounded border border-amber-200 text-[11px]">
                                      <b>Biểu điểm & Gợi ý:</b> {q.answer}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
