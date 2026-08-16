import React, { useState, useEffect } from "react";
import {
  DownloadCloud,
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  Calendar,
  CheckSquare,
  Square,
  RefreshCw,
  FolderCheck,
  Zap,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  School,
  Check
} from "lucide-react";
import {
  ACADEMIC_YEARS,
  GRADES,
  GRADE_LEVELS,
  SUBJECTS_BY_LEVEL,
  TEXTBOOKS,
  EXAM_PERIODS,
  TeacherProfile
} from "../types";

interface CurriculumBankDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentTeacher?: TeacherProfile | null;
}

interface MatrixSubjectItem {
  subject: string;
  grade: string;
  level: "Tiểu học" | "THCS" | "THPT";
  academicYear: string;
  isDownloaded: boolean;
  folderId: number | null;
  folderName: string | null;
  textbook: string;
  questionCount: { mc: number; es: number; total: number };
  approvedTextbooks: string[];
  officialApproved: boolean;
  moetStandard: string;
}

interface MatrixGradeItem {
  grade: string;
  level: "Tiểu học" | "THCS" | "THPT";
  totalSubjects: number;
  downloadedSubjects: number;
  isFullySynced: boolean;
  subjects: MatrixSubjectItem[];
}

export const CurriculumBankDownloaderModal: React.FC<CurriculumBankDownloaderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentTeacher,
}) => {
  const [activeMode, setActiveMode] = useState<"matrix_check" | "custom_single">("matrix_check");
  const [academicYear, setAcademicYear] = useState<string>(ACADEMIC_YEARS[0]);
  const [levelFilter, setLevelFilter] = useState<"all" | "Tiểu học" | "THCS" | "THPT">("all");
  const [defaultTextbook, setDefaultTextbook] = useState<string>(TEXTBOOKS[0]);
  
  // Matrix state
  const [matrixData, setMatrixData] = useState<MatrixGradeItem[]>([]);
  const [matrixSummary, setMatrixSummary] = useState<{
    totalSubjects: number;
    downloadedSubjects: number;
    syncPercentage: number;
    totalGrades: number;
  }>({ totalSubjects: 0, downloadedSubjects: 0, syncPercentage: 0, totalGrades: 12 });
  
  // Selection checklist state: keys in format `${grade}__${subject}`
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({});
  const [isLoadingMatrix, setIsLoadingMatrix] = useState<boolean>(false);

  // Single download state
  const [singleGrade, setSingleGrade] = useState<string>(currentTeacher?.primaryGrade || "Lớp 10");
  const [singleGradeLevel, setSingleGradeLevel] = useState<"Tiểu học" | "THCS" | "THPT">(currentTeacher?.level || "THPT");
  const [singleSubject, setSingleSubject] = useState<string>(currentTeacher?.primarySubject || "Toán");
  const [singleTextbook, setSingleTextbook] = useState<string>(TEXTBOOKS[0]);
  const [singlePeriod, setSinglePeriod] = useState<string>(EXAM_PERIODS[0]);
  const [singleNumQuestions, setSingleNumQuestions] = useState<number>(20);

  // Syncing execution state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    currentSubject: string;
    logs: string[];
  }>({ current: 0, total: 0, currentSubject: "", logs: [] });
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Matrix Data on open or when academicYear changes
  const fetchMatrix = async () => {
    setIsLoadingMatrix(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/curriculum/matrix?academicYear=${encodeURIComponent(academicYear)}`);
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data.grades || []);
        if (data.summary) setMatrixSummary(data.summary);
      }
    } catch (err: any) {
      console.error("Failed to fetch matrix", err);
      setErrorMsg("Không thể tải ma trận SGK từ máy chủ");
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMatrix();
      // Initialize expand state for teacher's grade or top 3 grades
      const initExpanded: Record<string, boolean> = {};
      if (currentTeacher?.primaryGrade) {
        initExpanded[currentTeacher.primaryGrade] = true;
      } else {
        initExpanded["Lớp 10"] = true;
        initExpanded["Lớp 11"] = true;
        initExpanded["Lớp 12"] = true;
      }
      setExpandedGrades(initExpanded);
    }
  }, [isOpen, academicYear]);

  if (!isOpen) return null;

  // Toggle individual item
  const handleToggleItem = (grade: string, subject: string) => {
    const key = `${grade}__${subject}`;
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all subjects in a grade
  const handleToggleGrade = (gradeItem: MatrixGradeItem) => {
    const allSelected = gradeItem.subjects.every((s) => selectedItems[`${gradeItem.grade}__${s.subject}`]);
    const updated = { ...selectedItems };
    gradeItem.subjects.forEach((s) => {
      updated[`${gradeItem.grade}__${s.subject}`] = !allSelected;
    });
    setSelectedItems(updated);
  };

  // Select all 12 grades
  const handleSelectAll = () => {
    const updated: Record<string, boolean> = {};
    matrixData.forEach((g) => {
      g.subjects.forEach((s) => {
        updated[`${g.grade}__${s.subject}`] = true;
      });
    });
    setSelectedItems(updated);
  };

  // Select only not-yet-downloaded items
  const handleSelectUndownloadedOnly = () => {
    const updated: Record<string, boolean> = {};
    matrixData.forEach((g) => {
      g.subjects.forEach((s) => {
        if (!s.isDownloaded) {
          updated[`${g.grade}__${s.subject}`] = true;
        }
      });
    });
    setSelectedItems(updated);
  };

  // Select specific Level (Tiểu học, THCS, or THPT)
  const handleSelectLevel = (level: "Tiểu học" | "THCS" | "THPT") => {
    const updated = { ...selectedItems };
    matrixData
      .filter((g) => g.level === level)
      .forEach((g) => {
        g.subjects.forEach((s) => {
          updated[`${g.grade}__${s.subject}`] = true;
        });
      });
    setSelectedItems(updated);
  };

  // Select only Teacher's primary and assigned subjects
  const handleSelectTeacherSubjects = () => {
    if (!currentTeacher) return;
    const updated = { ...selectedItems };
    const grades = currentTeacher.assignedGrades || [currentTeacher.primaryGrade];
    const subjects = currentTeacher.assignedSubjects || [currentTeacher.primarySubject];

    matrixData
      .filter((g) => grades.includes(g.grade))
      .forEach((g) => {
        g.subjects.forEach((s) => {
          if (subjects.some((tSub) => s.subject.toLowerCase().includes(tSub.toLowerCase()))) {
            updated[`${g.grade}__${s.subject}`] = true;
          }
        });
      });
    setSelectedItems(updated);
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedItems({});
  };

  const countSelected = Object.values(selectedItems).filter(Boolean).length;

  // Execute Batch Sync with AI
  const handleExecuteSync = async () => {
    if (countSelected === 0) {
      setErrorMsg("Vui lòng check chọn ít nhất 1 môn học để yêu cầu AI tải về!");
      return;
    }

    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Build payload list
    const itemsToSync: Array<{
      grade: string;
      subject: string;
      textbook: string;
      academicYear: string;
      period: string;
      numQuestions: number;
    }> = [];

    matrixData.forEach((g) => {
      g.subjects.forEach((s) => {
        if (selectedItems[`${g.grade}__${s.subject}`]) {
          itemsToSync.push({
            grade: g.grade,
            subject: s.subject,
            textbook: s.textbook || defaultTextbook,
            academicYear,
            period: "Kiểm tra định kỳ Giữa Học Kỳ 1",
            numQuestions: 15,
          });
        }
      });
    });

    setSyncProgress({
      current: 0,
      total: itemsToSync.length,
      currentSubject: "Đang khởi tạo kết nối AI...",
      logs: [`Bắt đầu tải ${itemsToSync.length} môn học chuẩn Bộ GD&ĐT cho năm học ${academicYear}...`],
    });

    try {
      // Process in batches of 4 for speed & stability
      const BATCH_SIZE = 3;
      let completedCount = 0;

      for (let i = 0; i < itemsToSync.length; i += BATCH_SIZE) {
        const batch = itemsToSync.slice(i, i + BATCH_SIZE);
        const batchNames = batch.map((b) => `${b.subject} (${b.grade})`).join(", ");

        setSyncProgress((prev) => ({
          ...prev,
          current: completedCount,
          currentSubject: `Đang tải: ${batchNames}...`,
          logs: [...prev.logs, `[${completedCount + 1}/${itemsToSync.length}] Đang xử lý: ${batchNames} theo SGK chuẩn...`],
        }));

        const res = await fetch("/api/curriculum/sync-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: batch,
            academicYear,
            teacherId: currentTeacher?.id || "system",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Lỗi khi AI tải dữ liệu");
        }

        completedCount += batch.length;
        setSyncProgress((prev) => ({
          ...prev,
          current: completedCount,
          logs: [...prev.logs, `✔ Đã hoàn tất và lưu vào thư mục: ${batchNames}`],
        }));
      }

      setSuccessMsg(`Đã tải thành công và lưu trữ trọn vẹn ${itemsToSync.length} bộ SGK vào kho dữ liệu chuẩn Bộ GD&ĐT (${academicYear})!`);
      await fetchMatrix();
      setSelectedItems({});
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Lỗi khi đồng bộ dữ liệu SGK qua AI");
    } finally {
      setIsSyncing(false);
    }
  };

  // Single download execution
  const handleSingleDownload = async () => {
    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/ai/download-curriculum-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: singleSubject,
          grade: singleGrade,
          academicYear,
          textbook: singleTextbook,
          period: singlePeriod,
          numQuestions: singleNumQuestions,
          teacherId: currentTeacher?.id || "system",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tải dữ liệu");

      setSuccessMsg(`Đã tải thành công ngân hàng SGK môn ${singleSubject} (${singleGrade}) theo ${singleTextbook}!`);
      await fetchMatrix();
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi tải");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSingleGradeChange = (newGrade: string) => {
    setSingleGrade(newGrade);
    const lvl = GRADE_LEVELS[newGrade] || "THPT";
    setSingleGradeLevel(lvl);
    const avail = SUBJECTS_BY_LEVEL[lvl] || [];
    if (!avail.includes(singleSubject)) {
      setSingleSubject(avail[0] || "Toán");
    }
  };

  const filteredMatrixGrades = levelFilter === "all" ? matrixData : matrixData.filter((g) => g.level === levelFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-5 backdrop-blur-md">
      <div className="flex w-full max-w-5xl flex-col max-h-[92vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 px-6 py-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <DownloadCloud className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">Trung Tâm Kiểm Tra & Tải Toàn Bộ SGK Chuẩn Bộ GD&ĐT</h3>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Chương Trình GDPT Mới
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Kiểm tra ma trận 12 khối, tự chọn hoặc tải toàn bộ SGK phê duyệt theo từng Năm Học lưu trữ trực tiếp vào kho hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switch & Global Filters */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveMode("matrix_check")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeMode === "matrix_check"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Check & Tải Ma Trận 12 Khối</span>
            </button>
            <button
              onClick={() => setActiveMode("custom_single")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeMode === "custom_single"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tải Tùy Chọn Từng Môn</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">Năm học chuẩn:</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                disabled={isSyncing}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={fetchMatrix}
              disabled={isLoadingMatrix || isSyncing}
              title="Làm mới trạng thái"
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMatrix ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mx-6 mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs font-medium shrink-0 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 mt-3 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-3 text-red-800 text-xs font-medium shrink-0 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sync Progress Banner */}
        {isSyncing && (
          <div className="mx-6 mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2.5 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                {syncProgress.currentSubject}
              </span>
              <span>
                {syncProgress.current} / {syncProgress.total} môn (
                {syncProgress.total > 0 ? Math.round((syncProgress.current / syncProgress.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-indigo-200/60 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 5}%`,
                }}
              />
            </div>
            {syncProgress.logs.length > 0 && (
              <div className="text-[11px] text-indigo-700 bg-white/70 p-2 rounded-lg max-h-16 overflow-y-auto font-mono">
                {syncProgress.logs.slice(-3).map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeMode === "matrix_check" ? (
            <>
              {/* Summary Metrics & Quick Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-700 font-medium block">Trạng thái đồng bộ SGK</span>
                    <span className="text-lg font-black text-blue-950">
                      {matrixSummary.downloadedSubjects} / {matrixSummary.totalSubjects} bộ môn
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                      {matrixSummary.syncPercentage}% Sẵn sàng
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Số mục đang được Check</span>
                    <span className="text-lg font-black text-indigo-700">
                      {countSelected} môn được chọn
                    </span>
                  </div>
                  {countSelected > 0 && (
                    <button
                      onClick={handleClearSelection}
                      disabled={isSyncing}
                      className="text-xs text-slate-500 hover:text-red-600 font-semibold underline"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-700 font-medium block">Bộ sách chuẩn Bộ GD&ĐT</span>
                    <span className="text-xs font-bold text-emerald-950 block">KNTT • Cánh Diều • Chân Trời</span>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                </div>
              </div>

              {/* Quick Filter & Bulk Check Toolbars */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600 mr-1">Bộ lọc cấp:</span>
                  {(["all", "Tiểu học", "THCS", "THPT"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevelFilter(lvl)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        levelFilter === lvl
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {lvl === "all" ? "Tất cả 12 Khối" : lvl}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    disabled={isSyncing}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition"
                  >
                    + Check Chọn Tất Cả (12 Khối)
                  </button>
                  <button
                    onClick={handleSelectUndownloadedOnly}
                    disabled={isSyncing}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-100 transition"
                  >
                    + Chỉ Chọn Môn Chưa Tải
                  </button>
                  {currentTeacher && (
                    <button
                      onClick={handleSelectTeacherSubjects}
                      disabled={isSyncing}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs hover:bg-purple-100 transition flex items-center gap-1"
                    >
                      <School className="w-3.5 h-3.5" />
                      <span>Chọn môn của tôi ({currentTeacher.primarySubject} - {currentTeacher.primaryGrade})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Matrix Grade Accordion Checklist */}
              {isLoadingMatrix ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs font-semibold">Đang kiểm tra ma trận dữ liệu SGK theo năm học...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMatrixGrades.map((gradeItem) => {
                    const isExpanded = expandedGrades[gradeItem.grade] !== false;
                    const allSelectedInGrade = gradeItem.subjects.every((s) => selectedItems[`${gradeItem.grade}__${s.subject}`]);
                    const someSelectedInGrade = gradeItem.subjects.some((s) => selectedItems[`${gradeItem.grade}__${s.subject}`]);

                    return (
                      <div
                        key={gradeItem.grade}
                        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition"
                      >
                        {/* Grade Header */}
                        <div className="bg-slate-50/80 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={allSelectedInGrade}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelectedInGrade && !allSelectedInGrade;
                              }}
                              onChange={() => handleToggleGrade(gradeItem)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-extrabold text-sm text-slate-800 mr-2">
                                {gradeItem.grade} ({gradeItem.level})
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                • {gradeItem.downloadedSubjects}/{gradeItem.totalSubjects} môn đã có trong kho
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {gradeItem.isFullySynced ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Đã đầy đủ</span>
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                Còn {gradeItem.totalSubjects - gradeItem.downloadedSubjects} môn chưa tải
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedGrades((prev) => ({
                                  ...prev,
                                  [gradeItem.grade]: !prev[gradeItem.grade],
                                }))
                              }
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Subjects Grid */}
                        {isExpanded && (
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {gradeItem.subjects.map((sub) => {
                              const isChecked = Boolean(selectedItems[`${gradeItem.grade}__${sub.subject}`]);
                              const isTeacherSubject =
                                currentTeacher &&
                                currentTeacher.assignedGrades?.includes(gradeItem.grade) &&
                                currentTeacher.assignedSubjects?.includes(sub.subject);

                              return (
                                <label
                                  key={sub.subject}
                                  className={`relative flex items-start gap-2.5 p-3 rounded-xl border transition cursor-pointer select-none ${
                                    isChecked
                                      ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400"
                                      : sub.isDownloaded
                                      ? "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                                      : "bg-white border-amber-200 hover:border-amber-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleItem(gradeItem.grade, sub.subject)}
                                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-xs text-slate-800 truncate">
                                        {sub.subject}
                                      </span>
                                      {sub.isDownloaded ? (
                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 flex items-center gap-0.5">
                                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                                          <span>{sub.questionCount.total} câu</span>
                                        </span>
                                      ) : (
                                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                          Chưa có
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                                      {sub.textbook.replace("Bộ sách ", "")}
                                    </p>
                                    {isTeacherSubject && (
                                      <span className="inline-block mt-1 text-[9px] font-extrabold text-purple-700 bg-purple-100/80 px-1.5 py-0.2 rounded">
                                        Môn của tôi
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Custom Single Subject Mode */
            <div className="max-w-xl mx-auto space-y-4 py-2">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Chế độ tải chi tiết: Cho phép bạn chỉ định số lượng câu hỏi và giai đoạn học cụ thể cho một môn học để AI trích xuất chuyên sâu.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khối lớp:</label>
                  <select
                    value={singleGrade}
                    onChange={(e) => handleSingleGradeChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g} ({GRADE_LEVELS[g]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Môn học:</label>
                  <select
                    value={singleSubject}
                    onChange={(e) => setSingleSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800"
                  >
                    {(SUBJECTS_BY_LEVEL[singleGradeLevel] || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bộ sách giáo khoa:</label>
                <select
                  value={singleTextbook}
                  onChange={(e) => setSingleTextbook(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800"
                >
                  {TEXTBOOKS.map((tb) => (
                    <option key={tb} value={tb}>
                      {tb}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giai đoạn học:</label>
                <select
                  value={singlePeriod}
                  onChange={(e) => setSinglePeriod(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800"
                >
                  {EXAM_PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Số lượng câu hỏi cần tải:</label>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {singleNumQuestions} câu trắc nghiệm + 3 câu tự luận
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={5}
                  value={singleNumQuestions}
                  onChange={(e) => setSingleNumQuestions(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSingleDownload}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>AI đang phân tích và tải SGK...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Yêu Cầu AI Tải Ngân Hàng SGK {singleSubject} {singleGrade}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {activeMode === "matrix_check" && (
              <span>
                Đã chọn <strong className="text-indigo-700 font-bold">{countSelected}</strong> bộ môn để yêu cầu AI tải và lưu vào thư mục sẵn.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isSyncing}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Đóng
            </button>

            {activeMode === "matrix_check" && (
              <button
                onClick={handleExecuteSync}
                disabled={isSyncing || countSelected === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI Đang Tải & Lưu Trữ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Yêu Cầu AI Tải Về & Lưu Vào Thư Mục ({countSelected} môn)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
