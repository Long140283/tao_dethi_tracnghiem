import React, { useState } from "react";
import {
  X,
  Sparkles,
  Layers,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Shuffle,
  Calendar,
  Award,
  Zap,
  GraduationCap,
  FileCheck,
  Check,
  Building,
  User,
  ArrowRight,
  Flame,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import {
  STANDARD_EXAM_PRESETS,
  StandardExamPreset,
  GRADE_LEVELS,
  GRADES,
  SUBJECTS_BY_LEVEL,
  TeacherProfile,
  TestRecord,
  TestQuestions,
} from "../types";

interface BatchExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeacher: TeacherProfile | null;
  currentSubject: string;
  currentGrade: string;
  academicYear: string;
  textbook: string;
  currentQuestions: TestQuestions | null;
  onApplyPreset: (preset: StandardExamPreset) => void;
  onBatchCreated: (createdTests: TestRecord[]) => void;
}

export const BatchExamGeneratorModal: React.FC<BatchExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  currentTeacher,
  currentSubject,
  currentGrade,
  academicYear,
  textbook,
  currentQuestions,
  onApplyPreset,
  onBatchCreated,
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "batch_periods" | "batch_variants" | "batch_grades">("catalog");
  const [selectedLevel, setSelectedLevel] = useState<"Tiểu học" | "THCS" | "THPT">(
    GRADE_LEVELS[currentGrade] || currentTeacher?.level || "THPT"
  );

  // Batch periods state
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([
    "Kiểm tra đánh giá Giữa Học Kỳ 1",
    "Kiểm tra đánh giá Cuối Học Kỳ 1",
    "Kiểm tra đánh giá Giữa Học Kỳ 2",
    "Kiểm tra đánh giá Cuối Học Kỳ 2 (Cuối năm)",
  ]);

  // Batch variants state
  const [variantCount, setVariantCount] = useState<number>(4);
  const [variantPrefix, setVariantPrefix] = useState<string>("10");

  // Batch grades state
  const [selectedGrades, setSelectedGrades] = useState<string[]>(
    currentTeacher?.assignedGrades?.length ? currentTeacher.assignedGrades : [currentGrade]
  );

  // Loading and feedback
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter presets by selected level
  const filteredPresets = STANDARD_EXAM_PRESETS.filter((p) =>
    p.applicableLevels.includes(selectedLevel)
  );

  const togglePeriod = (pName: string) => {
    setSelectedPeriods((prev) =>
      prev.includes(pName) ? prev.filter((p) => p !== pName) : [...prev, pName]
    );
  };

  const toggleGrade = (gName: string) => {
    setSelectedGrades((prev) =>
      prev.includes(gName) ? prev.filter((g) => g !== gName) : [...prev, gName]
    );
  };

  // 1. Batch Generate Across Periods (Trọn bộ kỳ thi)
  const handleGenerateBatchPeriods = async () => {
    if (selectedPeriods.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 loại kỳ thi để tạo hàng loạt!");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setResultMsg(null);
    setProgressMsg(`Đang khởi tạo ${selectedPeriods.length} đề thi theo chuẩn ma trận Bộ GD&ĐT...`);

    try {
      const res = await fetch("/api/tests/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "periods",
          periods: selectedPeriods,
          subject: currentSubject,
          grade: currentGrade,
          academicYear,
          textbook,
          schoolName: currentTeacher?.schoolName || "TRƯỜNG CHUẨN QUỐC GIA",
          teacherName: currentTeacher?.name || "Ban Khảo Thí & Chuyên Môn",
          teacherId: currentTeacher?.id || "system",
          teacherProfile: currentTeacher,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể tạo đề thi hàng loạt");
      }

      setResultMsg(`🎉 ${data.message || `Đã tạo thành công ${data.count} đề thi!`}`);
      if (data.tests) {
        onBatchCreated(data.tests);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi tạo đề thi hàng loạt");
    } finally {
      setIsGenerating(false);
      setProgressMsg("");
    }
  };

  // 2. Batch Generate Variants (Mã đề hoán vị)
  const handleGenerateBatchVariants = async () => {
    if (!currentQuestions || (currentQuestions.mc.length === 0 && currentQuestions.es.length === 0)) {
      setErrorMsg("Chưa có đề thi gốc trên màn hình soạn thảo! Vui lòng tạo hoặc nạp một đề thi trước khi tạo mã đề hoán vị.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setResultMsg(null);

    const variantCodes: string[] = [];
    for (let i = 1; i <= variantCount; i++) {
      variantCodes.push(`${variantPrefix}${i}`);
    }

    setProgressMsg(`Đang xáo trộn câu hỏi và phương án A/B/C/D cho ${variantCount} mã đề (${variantCodes.join(", ")})...`);

    try {
      const res = await fetch("/api/tests/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "variants",
          variants: variantCodes,
          baseQuestions: currentQuestions,
          subject: currentSubject,
          grade: currentGrade,
          academicYear,
          textbook,
          schoolName: currentTeacher?.schoolName || "TRƯỜNG CHUẨN QUỐC GIA",
          teacherName: currentTeacher?.name || "Ban Khảo Thí & Chuyên Môn",
          teacherId: currentTeacher?.id || "system",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể tạo mã đề hoán vị");
      }

      setResultMsg(`🎉 Đã tạo thành công ${data.count} mã đề hoán vị (${variantCodes.join(", ")}) với đáp án riêng biệt!`);
      if (data.tests) {
        onBatchCreated(data.tests);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi tạo mã đề hoán vị");
    } finally {
      setIsGenerating(false);
      setProgressMsg("");
    }
  };

  // 3. Batch Generate Across Multiple Grades
  const handleGenerateBatchGrades = async () => {
    if (selectedGrades.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 khối lớp!");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setResultMsg(null);
    setProgressMsg(`Đang khởi tạo đề thi cho ${selectedGrades.length} khối lớp (${selectedGrades.join(", ")})...`);

    try {
      const res = await fetch("/api/tests/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "grades",
          grades: selectedGrades,
          subject: currentSubject,
          academicYear,
          textbook,
          schoolName: currentTeacher?.schoolName || "TRƯỜNG CHUẨN QUỐC GIA",
          teacherName: currentTeacher?.name || "Ban Khảo Thí & Chuyên Môn",
          teacherId: currentTeacher?.id || "system",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể tạo đề thi cho các khối");
      }

      setResultMsg(`🎉 Đã tạo thành công đề thi cho ${data.count} khối lớp!`);
      if (data.tests) {
        onBatchCreated(data.tests);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi tạo đề cho các khối");
    } finally {
      setIsGenerating(false);
      setProgressMsg("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                <span>Mẫu Đề Chuẩn Bộ GD&ĐT & Tạo Hàng Loạt</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  12 Khối Lớp
                </span>
              </h2>
              <p className="text-xs text-blue-100">
                Lựa chọn định dạng đề thi chuẩn theo học kỳ hoặc tạo đồng loạt nhiều đề, mã đề hoán vị lưu vào kho dữ liệu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab("catalog"); setResultMsg(null); setErrorMsg(null); }}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "catalog"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mẫu Đề Chuẩn Theo Học Kỳ ({filteredPresets.length} Loại)</span>
          </button>

          <button
            onClick={() => { setActiveTab("batch_periods"); setResultMsg(null); setErrorMsg(null); }}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "batch_periods"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tạo Trọn Bộ Đề Cả Năm Học</span>
          </button>

          <button
            onClick={() => { setActiveTab("batch_variants"); setResultMsg(null); setErrorMsg(null); }}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "batch_variants"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>Tạo 4 - 6 Mã Đề Hoán Vị (Phòng Thi)</span>
          </button>

          <button
            onClick={() => { setActiveTab("batch_grades"); setResultMsg(null); setErrorMsg(null); }}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "batch_grades"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Tạo Đề Cho Nhiều Khối Lớp</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Notifications */}
          {resultMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{resultMsg}</span>
              </div>
              <button
                onClick={() => onClose()}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
              >
                Xem Kho Đề Ngay
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: CATALOG OF STANDARD PRESETS ACCORDING TO MOET */}
          {/* ========================================================= */}
          {activeTab === "catalog" && (
            <div className="space-y-4">
              
              {/* Level Filter Switcher */}
              <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl max-w-md">
                {(["Tiểu học", "THCS", "THPT"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      selectedLevel === lvl
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Cấp {lvl}
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPresets.map((preset) => {
                  const duration = preset.defaultDurationByLevel[selectedLevel];
                  const qConfig = preset.defaultQuestionsByLevel[selectedLevel];

                  return (
                    <div
                      key={preset.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition p-4 flex flex-col justify-between space-y-3 relative group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                            {preset.shortBadge}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{duration} Phút</span>
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug group-hover:text-blue-600 transition">
                          {preset.name}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                            Cấu trúc: <b>{qConfig.mc} TN + {qConfig.es} TL</b>
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                            Học kỳ: <b>{preset.semester}</b>
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-100">
                            {preset.moetStandard}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onApplyPreset(preset);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>Chọn Mẫu Này & Soạn Đề Ngay</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: BATCH ACROSS ALL PERIODS OF ACADEMIC YEAR */}
          {/* ========================================================= */}
          {activeTab === "batch_periods" && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
                <b className="flex items-center gap-1 text-blue-950">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Tự động hóa xây dựng trọn bộ đề thi trong năm học:</span>
                </b>
                <p className="text-blue-800">
                  Hệ thống AI sẽ tự động khởi tạo trọn gói các bài kiểm tra theo đúng chuẩn ma trận cho môn <b>{currentSubject}</b> - <b>{currentGrade}</b> ({academicYear}) và lưu trữ toàn bộ vào Kho Đề Thi của Thầy/Cô.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Chọn Các Kỳ Kiểm Tra Cần Tạo Hàng Loạt:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: "Kiểm tra thường xuyên / 15 phút", time: "15 phút", desc: "Đánh giá thường xuyên" },
                    { name: "Kiểm tra định kỳ 1 tiết (45 phút)", time: "45 phút", desc: "Sau khi hết 1 chương" },
                    { name: "Kiểm tra đánh giá Giữa Học Kỳ 1", time: "60 phút", desc: "Định kỳ giữa kỳ 1" },
                    { name: "Kiểm tra đánh giá Cuối Học Kỳ 1", time: "60 - 90 phút", desc: "Đánh giá cuối kỳ 1" },
                    { name: "Kiểm tra đánh giá Giữa Học Kỳ 2", time: "60 phút", desc: "Định kỳ giữa kỳ 2" },
                    { name: "Kiểm tra đánh giá Cuối Học Kỳ 2 (Cuối năm)", time: "60 - 90 phút", desc: "Tổng kết cuối năm học" },
                    { name: "Khảo sát chất lượng đầu năm học", time: "45 phút", desc: "Khảo sát mặt bằng đầu năm" },
                    { name: "Ôn thi Tuyển sinh vào Lớp 10", time: "90 phút", desc: "Thi thử vào 10 (Lớp 9)" },
                    { name: "Ôn thi Tốt nghiệp THPT & ĐGNL", time: "50 - 90 phút", desc: "Thi thử tốt nghiệp THPT" },
                  ].map((item) => {
                    const isChecked = selectedPeriods.includes(item.name);
                    return (
                      <label
                        key={item.name}
                        onClick={() => togglePeriod(item.name)}
                        className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                          isChecked
                            ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>Thời gian: <b>{item.time}</b></span>
                            <span>•</span>
                            <span>{item.desc}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isGenerating || selectedPeriods.length === 0}
                  onClick={handleGenerateBatchPeriods}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{progressMsg || "Đang xử lý tạo hàng loạt..."}</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Tạo Ngay {selectedPeriods.length} Đề Thi Hàng Loạt Vào Kho</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: BATCH GENERATE EXAM VARIANTS (MÃ ĐỀ HOÁN VỊ) */}
          {/* ========================================================= */}
          {activeTab === "batch_variants" && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <b className="flex items-center gap-1 text-amber-950">
                  <Shuffle className="w-4 h-4 text-amber-600" />
                  <span>Xáo trộn mã đề chống nhìn bài trong phòng thi:</span>
                </b>
                <p className="text-amber-800">
                  Hệ thống sẽ giữ nguyên nội dung chuyên môn nhưng tự động đảo trật tự các câu hỏi và hoán vị 4 phương án A/B/C/D, đồng thời tạo bảng đáp án riêng biệt cho từng mã đề.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Số Lượng Mã Đề Cần Tạo:
                  </label>
                  <select
                    value={variantCount}
                    onChange={(e) => setVariantCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={2}>2 Mã Đề (101, 102)</option>
                    <option value={4}>4 Mã Đề (101, 102, 103, 104) - Chuẩn phòng thi</option>
                    <option value={6}>6 Mã Đề (101, 102, 103, 104, 105, 106)</option>
                    <option value={8}>8 Mã Đề (101 - 108)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Tiền Tố Mã Đề (VD: 10, 20, 30):
                  </label>
                  <input
                    type="text"
                    value={variantPrefix}
                    onChange={(e) => setVariantPrefix(e.target.value)}
                    placeholder="VD: 10, 20, 13..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {currentQuestions ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                  <span>Đề gốc hiện tại: <b>{currentQuestions.mc?.length || 0} câu trắc nghiệm, {currentQuestions.es?.length || 0} câu tự luận</b></span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Sẵn sàng hoán vị</span>
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Chưa có đề thi trên màn hình chính. Hãy tạo hoặc nạp một đề thi trước!</span>
                </div>
              )}

              <button
                type="button"
                disabled={isGenerating || !currentQuestions}
                onClick={handleGenerateBatchVariants}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || "Đang tạo mã đề..."}</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4" />
                    <span>Tạo Ngay Bộ {variantCount} Mã Đề Hoán Vị</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: BATCH GENERATE BY ASSIGNED GRADES */}
          {/* ========================================================= */}
          {activeTab === "batch_grades" && (
            <div className="space-y-5">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-1">
                <b className="flex items-center gap-1 text-purple-950">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Tạo đề thi đồng thời cho các khối lớp được phân công:</span>
                </b>
                <p className="text-purple-800">
                  Giáo viên dạy nhiều khối (ví dụ dạy cả Lớp 10, Lớp 11 và Lớp 12) có thể chọn tạo đồng loạt đề kiểm tra cho tất cả các khối trong 1 lượt bấm.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Chọn Các Khối Lớp Cần Tạo Đề:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRADES.map((g) => {
                    const isChecked = selectedGrades.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGrade(g)}
                        className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-between transition cursor-pointer ${
                          isChecked
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{g}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={isGenerating || selectedGrades.length === 0}
                onClick={handleGenerateBatchGrades}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || "Đang khởi tạo đề cho các khối..."}</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Tạo Đề Cho {selectedGrades.length} Khối Lớp Đã Chọn</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Giáo viên: <b>{currentTeacher?.name || "Ban Khảo Thí"}</b> ({currentTeacher?.schoolName || "Chuẩn Quốc Gia"})</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
