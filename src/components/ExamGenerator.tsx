import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  FileText,
  Camera,
  Link2,
  FolderDown,
  Download,
  Printer,
  Share2,
  PlayCircle,
  CheckCircle2,
  BookOpen,
  Settings2,
  Sliders,
  AlertCircle,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Layers,
  Bot,
  Building2,
  User,
  Calendar,
  Zap,
  Database,
  Lock,
  ShieldCheck,
  UserCheck,
  Shuffle,
  GraduationCap,
  Flame,
  Award,
} from "lucide-react";
import {
  SUBJECTS,
  GRADES,
  SEMESTERS,
  TEXTBOOKS,
  EXAM_PERIODS,
  ACADEMIC_YEARS,
  GRADE_LEVELS,
  SUBJECTS_BY_LEVEL,
  STANDARD_EXAM_PRESETS,
  StandardExamPreset,
  TestQuestions,
  FolderRecord,
  MultipleChoiceQ,
  EssayQ,
  TeacherProfile,
  TestRecord,
} from "../types";
import { generateTestQuestions } from "../data/questionBank";
import { generateExamPDF, printExamLayout } from "../utils/pdfExport";
import { BatchExamGeneratorModal } from "./BatchExamGeneratorModal";
import mammoth from "mammoth";

interface ExamGeneratorProps {
  folders: FolderRecord[];
  onTestSaved: () => void;
  onTakeTest: (testId: string) => void;
  onOpenAiAssistant: () => void;
  onOpenCurriculumDownloader?: () => void;
  currentTeacher: TeacherProfile | null;
  onOpenAuthModal?: (mode?: "switch" | "edit" | "register") => void;
}

export const ExamGenerator: React.FC<ExamGeneratorProps> = ({
  folders,
  onTestSaved,
  onTakeTest,
  onOpenAiAssistant,
  onOpenCurriculumDownloader,
  currentTeacher,
  onOpenAuthModal,
}) => {
  // Configuration State
  const [academicYear, setAcademicYear] = useState<string>(ACADEMIC_YEARS[0]);
  const [grade, setGrade] = useState<string>(currentTeacher?.primaryGrade || "Lớp 10");
  const [gradeLevel, setGradeLevel] = useState<"Tiểu học" | "THCS" | "THPT">(currentTeacher?.level || "THPT");
  const [subject, setSubject] = useState<string>(currentTeacher?.primarySubject || "Toán");
  const [textbook, setTextbook] = useState<string>(TEXTBOOKS[0]);
  const [period, setPeriod] = useState<string>(EXAM_PERIODS[0]); // default to 15m
  const [semester, setSemester] = useState<string>("Học kỳ 1");
  const [duration, setDuration] = useState<number>(15);
  const [testType, setTestType] = useState<"Trắc nghiệm" | "Tự luận" | "Kết hợp">("Trắc nghiệm");
  const [mcRatio, setMcRatio] = useState<number>(100);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [schoolName, setSchoolName] = useState<string>(currentTeacher?.schoolName || "TRƯỜNG THCS / THPT CHUẨN QUỐC GIA");
  const [teacherName, setTeacherName] = useState<string>(currentTeacher?.name || "Ban Khảo Thí & Chuyên Môn");
  const [customTeacherRequirement, setCustomTeacherRequirement] = useState<string>("");
  const [isSecretTest, setIsSecretTest] = useState<boolean>(true);

  // Preset Selection & Batch Generation Modal State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("15m");
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchSuccessToast, setBatchSuccessToast] = useState<string | null>(null);

  // Sync with current teacher profile whenever teacher changes
  useEffect(() => {
    if (currentTeacher) {
      setGrade(currentTeacher.primaryGrade);
      setGradeLevel(currentTeacher.level);
      setSubject(currentTeacher.primarySubject);
      setSchoolName(currentTeacher.schoolName);
      setTeacherName(currentTeacher.name);
    }
  }, [currentTeacher]);

  const applyPreset = (preset: StandardExamPreset) => {
    setSelectedPresetId(preset.id);
    const lvl = gradeLevel;
    const dur = preset.defaultDurationByLevel[lvl] || 45;
    const qCfg = preset.defaultQuestionsByLevel[lvl] || { mc: 12, es: 2, mcRatio: 70 };
    
    setDuration(dur);
    setPeriod(preset.category);
    setSemester(preset.semester);
    
    if (qCfg.es === 0) {
      setTestType("Trắc nghiệm");
      setMcRatio(100);
      setNumQuestions(qCfg.mc);
    } else if (qCfg.mc === 0) {
      setTestType("Tự luận");
      setMcRatio(0);
      setNumQuestions(qCfg.es);
    } else {
      setTestType("Kết hợp");
      setMcRatio(qCfg.mcRatio || 70);
      setNumQuestions(qCfg.mc + qCfg.es);
    }

    setCustomTeacherRequirement(
      `[Mẫu ${preset.name}] Cấu trúc: ${qCfg.mc} câu trắc nghiệm + ${qCfg.es} câu tự luận. Mô tả: ${preset.description}. Căn cứ: ${preset.moetStandard}.`
    );
  };

  // Source Selection (4 distinct modes)
  const [sourceType, setSourceType] = useState<"bank_repository" | "ai_custom" | "folder" | "file_extract">("bank_repository");

  // File / AI extraction state
  const [aiSubTab, setAiSubTab] = useState<"file" | "camera" | "link">("file");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileText, setUploadedFileText] = useState<string>("");
  const [cameraImageBase64, setCameraImageBase64] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [linkInput, setLinkInput] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiExtractedQs, setAiExtractedQs] = useState<{ "Multiple Choice": MultipleChoiceQ[]; Essay: EssayQ[] } | null>(null);
  const [selectedFolderForSave, setSelectedFolderForSave] = useState<number>(folders[0]?.id || 0);

  // Selected Folder Source
  const [selectedSourceFolder, setSelectedSourceFolder] = useState<number>(folders[0]?.id || 0);

  // Generated Test State
  const [currentQuestions, setCurrentQuestions] = useState<TestQuestions | null>(null);
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const lvl = GRADE_LEVELS[newGrade] || "THPT";
    setGradeLevel(lvl);
    const availableSubjects = SUBJECTS_BY_LEVEL[lvl] || [];
    if (!availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0] || "Toán");
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod.includes("15 phút") || newPeriod.includes("thường xuyên")) {
      setDuration(15);
      setTestType("Trắc nghiệm");
      setNumQuestions(10);
      setMcRatio(100);
    } else if (newPeriod.includes("1 tiết") || newPeriod.includes("45 phút")) {
      setDuration(45);
      setTestType("Kết hợp");
      setNumQuestions(14);
      setMcRatio(70);
    } else if (newPeriod.includes("Giữa")) {
      setDuration(60);
      setTestType("Kết hợp");
      setNumQuestions(18);
      setMcRatio(70);
    } else if (newPeriod.includes("Cuối") || newPeriod.includes("Tốt nghiệp") || newPeriod.includes("ĐGNL")) {
      setDuration(90);
      setTestType("Kết hợp");
      setNumQuestions(23);
      setMcRatio(70);
    }
  };

  // 1. Generate directly from stored SGK bank repository
  const generateFromStoredBank = async () => {
    setIsAiLoading(true);
    setErrorMessage(null);
    setSourceInfo(null);
    try {
      const res = await fetch("/api/ai/generate-from-stored-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          grade,
          academicYear,
          period,
          textbook,
          numQuestions,
          customRequirement: customTeacherRequirement,
          teacherProfile: currentTeacher,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể trích xuất đề từ ngân hàng lưu trữ");
      }

      if (data.questions) {
        setCurrentQuestions(data.questions);
        if (data.duration) setDuration(data.duration);
        setSourceInfo(data.sourceInfo || "Trích xuất thành công từ ngân hàng SGK chuẩn đã lưu trữ.");
      }
      setCreatedTestId(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi tạo đề từ ngân hàng lưu trữ");
    } finally {
      setIsAiLoading(false);
    }
  };

  // 2. Generate custom exam from AI based on teacher instructions
  const generateCustomByAI = async () => {
    setIsAiLoading(true);
    setErrorMessage(null);
    setSourceInfo(null);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Yêu cầu của giáo viên: ${customTeacherRequirement || `Tạo đề thi ${subject} ${grade} (${period}) theo bộ sách ${textbook}`}. Ma trận: ${numQuestions} câu hỏi bám sát chuẩn kiến thức kĩ năng GDPT.`,
          subject,
          grade,
          academicYear,
          textbook,
          period,
          numQuestions,
          teacherProfile: currentTeacher,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể khởi tạo đề thi AI");
      }

      const mcList = data["Multiple Choice"] || [];
      const esList = data.Essay || [];

      setCurrentQuestions({ mc: mcList, es: esList });
      setSourceInfo(`AI đã tự động thiết kế đề thi theo yêu cầu riêng của giáo viên cho ${subject} ${grade}.`);
      setCreatedTestId(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi AI tự tạo đề");
    } finally {
      setIsAiLoading(false);
    }
  };

  // 3. Generate from Specific Folder
  const generateFromFolder = async () => {
    if (!selectedSourceFolder) {
      setErrorMessage("Vui lòng chọn thư mục chứa câu hỏi");
      return;
    }
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/folders/${selectedSourceFolder}/questions`);
      const data = await res.json();
      if (!data["Multiple Choice"]?.length && !data.Essay?.length) {
        setErrorMessage("Thư mục này hiện chưa có câu hỏi nào. Hãy tải thêm câu hỏi từ Ngân hàng SGK!");
        return;
      }
      const test = generateTestQuestions(subject, grade, testType, mcRatio, numQuestions, data);
      setCurrentQuestions(test);
      setSourceInfo(`Trích xuất trực tiếp từ thư mục ID #${selectedSourceFolder}.`);
      setCreatedTestId(null);
    } catch (err: any) {
      setErrorMessage(`Lỗi lấy dữ liệu thư mục: ${err.message}`);
    }
  };

  // 4. File / Image Extract
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setErrorMessage(null);

    try {
      if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setUploadedFileText(result.value);
      } else if (file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
        const text = await file.text();
        setUploadedFileText(text);
      } else {
        const text = await file.text();
        setUploadedFileText(text);
      }
    } catch (err: any) {
      setErrorMessage(`Lỗi đọc file: ${err.message}`);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setErrorMessage("Không thể truy cập máy ảnh. Vui lòng cho phép quyền Camera trên trình duyệt.");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCameraImageBase64(dataUrl);

        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsCameraActive(false);
      }
    }
  };

  const processFileExtraction = async () => {
    setIsAiLoading(true);
    setErrorMessage(null);

    try {
      let payload: any = {
        numQuestions,
        subject,
        grade,
        academicYear,
        textbook,
        period,
        teacherProfile: currentTeacher,
      };

      if (aiSubTab === "file") {
        if (!uploadedFileText) throw new Error("Vui lòng tải lên tài liệu cần bóc tách");
        payload.text = uploadedFileText;
      } else if (aiSubTab === "camera") {
        if (!cameraImageBase64) throw new Error("Vui lòng chụp ảnh hoặc tải lên hình ảnh đề cương");
        payload.imageBase64 = cameraImageBase64;
      } else if (aiSubTab === "link") {
        if (!linkInput) throw new Error("Vui lòng nhập đường dẫn");
        payload.text = `Trích xuất từ đường dẫn tài liệu: ${linkInput}`;
      }

      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Không thể bóc tách");

      setAiExtractedQs(data);
      const mcList = data["Multiple Choice"] || [];
      const esList = data.Essay || [];
      setCurrentQuestions({ mc: mcList, es: esList });
      setSourceInfo("Đã bóc tách thành công từ tài liệu / hình ảnh đính kèm.");
      setCreatedTestId(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi bóc tách câu hỏi");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save Exam to Cloud / Database
  const saveAndShareTest = async () => {
    if (!currentQuestions) return;
    setIsSaving(true);
    try {
      const title = `Đề thi ${subject} - ${grade} (${period} • ${textbook.replace("Bộ sách ", "")})`;
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          grade,
          semester,
          academicYear,
          textbook,
          period,
          sourceType,
          duration,
          questions: currentQuestions,
          schoolName,
          teacherName,
          teacherId: currentTeacher?.id || "system",
          isSecret: isSecretTest,
        }),
      });
      const savedTest = await res.json();
      setCreatedTestId(savedTest.id);
      onTestSaved();
    } catch (err: any) {
      setErrorMessage(`Lỗi khi lưu đề thi: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getShareLink = (testId: string) => {
    return `${window.location.origin}/?test_id=${testId}`;
  };

  const copyShareLink = () => {
    if (!createdTestId) return;
    navigator.clipboard.writeText(getShareLink(createdTestId));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const currentSubjects = SUBJECTS_BY_LEVEL[gradeLevel] || [];

  return (
    <div className="space-y-8">
      {/* Top Banner AI Command Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-5 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">Trợ Lý AI Khảo Thí Chuẩn SGK Bộ Giáo Dục</h2>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
                Thế Hệ 4.0
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Hỗ trợ đầy đủ các môn từ Lớp 1 - 12 theo năm học (2026-2027...) & giai đoạn kiểm tra (15 phút, 1 tiết, giữa kỳ, cuối kỳ)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAiAssistant}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-800 shadow-md hover:bg-blue-50 transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span>Ra Lệnh Bằng Giọng Nói / Chat Cho AI</span>
        </button>
      </div>

      {/* 1. Exam Configuration Card */}
      <div id="section-exam-config" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        
        {/* Header with Teacher Profile and Batch Button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cấu hình Đề Thi & Phân Phối Chương Trình</h2>
              <p className="text-xs text-slate-500">Thiết lập năm học, khối lớp, môn học và giai đoạn kiểm tra theo chuẩn Bộ GD&ĐT</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-300" />
              <span>Mẫu Đề Chuẩn & Tạo Hàng Loạt</span>
              <span className="bg-white/20 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase">Mới</span>
            </button>

            {currentTeacher && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 px-3.5 py-1.5 rounded-xl text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-blue-900">Giáo viên: </span>
                  <span className="font-semibold text-slate-800">{currentTeacher.name}</span>
                  <span className="text-slate-500 ml-1">({currentTeacher.primaryGrade} • {currentTeacher.primarySubject})</span>
                </div>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => onOpenAuthModal("switch")}
                    className="ml-2 text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  >
                    Đổi
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick MoET Preset Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                  Mẫu Đề Chuẩn Theo Quy Định Bộ GD&ĐT ({gradeLevel}):
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Chuẩn GDPT 2018
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Chọn mẫu đề để tự động nạp thời lượng, cấu trúc trắc nghiệm/tự luận và ma trận năng lực chuẩn:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedPresetId}
              onChange={(e) => {
                const found = STANDARD_EXAM_PRESETS.find((p) => p.id === e.target.value);
                if (found) applyPreset(found);
              }}
              className="bg-slate-800 border border-slate-700 hover:border-blue-400 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer flex-1 md:flex-none"
            >
              {STANDARD_EXAM_PRESETS.filter((p) => p.applicableLevels.includes(gradeLevel)).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.defaultDurationByLevel[gradeLevel]} Phút)
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
              title="Mở toàn bộ danh mục mẫu đề & Tạo hàng loạt"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tạo Hàng Loạt</span>
            </button>
          </div>
        </div>

        {/* Batch Success Toast */}
        {batchSuccessToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{batchSuccessToast}</span>
            </div>
            <button
              onClick={() => setBatchSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Năm Học Áp Dụng:</span>
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                Khối lớp (Lớp 1 - 12):
              </label>
              <select
                value={grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g} ({GRADE_LEVELS[g]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Môn học ({gradeLevel}):
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {currentSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bộ Sách Giáo Khoa:</span>
                </label>
                {onOpenCurriculumDownloader && (
                  <button
                    type="button"
                    onClick={onOpenCurriculumDownloader}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Check / Tải Thêm SGK</span>
                  </button>
                )}
              </div>
              <select
                value={textbook}
                onChange={(e) => setTextbook(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {TEXTBOOKS.map((tb) => (
                  <option key={tb} value={tb}>
                    {tb}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Giai đoạn khảo thí / Đánh giá:</span>
              </label>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-indigo-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {EXAM_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Học kỳ:
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Thời gian (phút):
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Số câu hỏi:
                </label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Hình thức đề thi:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Trắc nghiệm", "Tự luận", "Kết hợp"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTestType(type)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      testType === type
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {testType === "Kết hợp" && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tỉ lệ TN / Tự luận
                  </label>
                  <span className="text-xs font-bold text-blue-600">{mcRatio}% / {100 - mcRatio}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={10}
                  value={mcRatio}
                  onChange={(e) => setMcRatio(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Teacher Custom Matrix / Instruction requirement */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Yêu cầu chuyên môn & ma trận trọng tâm của Giáo viên (Tùy chọn):</span>
          </label>
          <input
            type="text"
            placeholder="VD: Tập trung vào chương 2 và bài 3, tăng cường 2 câu vận dụng cao thực tiễn, phân hóa học sinh..."
            value={customTeacherRequirement}
            onChange={(e) => setCustomTeacherRequirement(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        {/* School & Teacher info for official header */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Tiêu đề Đơn vị / Trường học (In trên đề thi):</span>
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Giáo viên / Ban Ra Đề:</span>
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Exam Security / Confidentiality Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSecretTest ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}>
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Chế Độ Bảo Mật Bí Mật Đề Thi (Tránh Lộ Đề Thi Sang Khối Khác)</span>
                {isSecretTest && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    Bảo Mật Riêng Tư
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Chỉ tài khoản giáo viên khối này mới có thể quản lý, sửa đổi và truy cập đề thi sau khi lưu.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSecretTest}
              onChange={(e) => setIsSecretTest(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* 2. Source Selection & Generation Hub */}
      <div id="section-source-selection" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chọn Chế Độ Khởi Tạo Đề Thi</h2>
            <p className="text-xs text-slate-500">
              Lựa chọn lấy từ Ngân hàng SGK đã lưu trữ, AI tự tạo theo yêu cầu giáo viên, hay bóc tách từ tài liệu
            </p>
          </div>
        </div>

        {/* 4 Source Switcher Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSourceType("bank_repository")}
            className={`p-4 rounded-xl border transition text-left cursor-pointer ${
              sourceType === "bank_repository"
                ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950"
                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${sourceType === "bank_repository" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              <Database className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs leading-snug">Lấy từ Ngân Hàng SGK Đã Lưu Trữ</div>
            <div className="text-[11px] text-slate-500 mt-1">Chính xác theo năm học & giai đoạn học</div>
          </button>

          <button
            type="button"
            onClick={() => setSourceType("ai_custom")}
            className={`p-4 rounded-xl border transition text-left cursor-pointer ${
              sourceType === "ai_custom"
                ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 text-purple-950"
                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${sourceType === "ai_custom" ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs leading-snug">AI Tự Tạo Theo Yêu Cầu Riêng</div>
            <div className="text-[11px] text-slate-500 mt-1">Thiết kế theo ma trận & chủ đề riêng</div>
          </button>

          <button
            type="button"
            onClick={() => setSourceType("folder")}
            className={`p-4 rounded-xl border transition text-left cursor-pointer ${
              sourceType === "folder"
                ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-950"
                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${sourceType === "folder" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              <FolderDown className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs leading-snug">Thư Mục Cụ Thể Trong Máy</div>
            <div className="text-[11px] text-slate-500 mt-1">Kho câu hỏi riêng của thầy cô ({folders.length})</div>
          </button>

          <button
            type="button"
            onClick={() => setSourceType("file_extract")}
            className={`p-4 rounded-xl border transition text-left cursor-pointer ${
              sourceType === "file_extract"
                ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-amber-950"
                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${sourceType === "file_extract" ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              <FileText className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs leading-snug">Bóc Tách File / Ảnh / Link</div>
            <div className="text-[11px] text-slate-500 mt-1">Trích xuất từ tài liệu Word, PDF, Camera</div>
          </button>
        </div>

        {/* Action Panels */}
        {sourceType === "bank_repository" && (
          <div className="bg-emerald-50/60 rounded-xl p-5 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {academicYear}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-200 text-teal-900">
                  {period}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mt-1.5">
                Trích xuất đề chuẩn SGK: {subject} - {grade} ({textbook})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                AI sẽ tổng hợp và cân bằng ma trận câu hỏi chuẩn xác tuyệt đối từ Kho Dữ Liệu Ngân Hàng SGK đã tải về.
              </p>
            </div>
            <button
              disabled={isAiLoading}
              onClick={generateFromStoredBank}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm hover:shadow disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4" />
              <span>{isAiLoading ? "AI Đang Trích Xuất & Cân Bằng..." : "⚡ Trích Xuất & Tạo Đề Ngay"}</span>
            </button>
          </div>
        )}

        {sourceType === "ai_custom" && (
          <div className="bg-purple-50/60 rounded-xl p-5 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                AI Soạn Đề Mới Theo Chỉ Đạo Sư Phạm: {subject} {grade}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                AI tự động sinh các câu hỏi mới hoàn toàn theo ma trận đề, chương bài và yêu cầu đặc biệt của Thầy/Cô.
              </p>
            </div>
            <button
              disabled={isAiLoading}
              onClick={generateCustomByAI}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition shadow-sm hover:shadow disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAiLoading ? "AI Đang Soạn Đề..." : "✨ AI Tự Soạn Đề Thi"}</span>
            </button>
          </div>
        )}

        {sourceType === "folder" && (
          <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-200 space-y-4">
            {folders.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Thư Mục Nguồn:</label>
                  <select
                    value={selectedSourceFolder}
                    onChange={(e) => setSelectedSourceFolder(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📂 {f.name} ({f.questions?.["Multiple Choice"]?.length || 0} TN, {f.questions?.Essay?.length || 0} TL)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateFromFolder}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm hover:shadow cursor-pointer"
                >
                  <FolderDown className="w-4 h-4" />
                  <span>🚀 Tạo Đề Từ Thư Mục Đã Chọn</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Chưa có thư mục nào.</p>
                <p className="text-xs text-slate-500">
                  Thầy/Cô có thể vào tab "Ngân Hàng SGK" để tải về bộ sách bất kỳ hoặc nhấn "Trợ lý AI" để tải tự động!
                </p>
              </div>
            )}
          </div>
        )}

        {sourceType === "file_extract" && (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex space-x-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setAiSubTab("file")}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  aiSubTab === "file" ? "bg-white text-amber-800 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tải File (Word/PDF/Text)</span>
              </button>

              <button
                type="button"
                onClick={() => setAiSubTab("camera")}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  aiSubTab === "camera" ? "bg-white text-amber-800 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Chụp Ảnh Đề Cương / Sách</span>
              </button>

              <button
                type="button"
                onClick={() => setAiSubTab("link")}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  aiSubTab === "link" ? "bg-white text-amber-800 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Dán Link Web / YouTube</span>
              </button>
            </div>

            {aiSubTab === "file" && (
              <div className="space-y-3">
                <label className="block border-2 border-dashed border-slate-300 hover:border-amber-500 bg-white rounded-xl p-6 text-center cursor-pointer transition">
                  <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-slate-800">
                    {uploadedFileName ? `Đã chọn: ${uploadedFileName}` : "Kéo thả hoặc nhấn để chọn file Word (.docx), PDF hoặc .txt"}
                  </span>
                  <input type="file" accept=".docx,.pdf,.txt,.md" onChange={handleFileUpload} className="hidden" />
                </label>
                {uploadedFileText && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600 max-h-24 overflow-y-auto">
                    <b>Nội dung trích xuất ({uploadedFileText.length} ký tự):</b>
                    <p className="mt-1 line-clamp-2 text-slate-500">{uploadedFileText}</p>
                  </div>
                )}
              </div>
            )}

            {aiSubTab === "camera" && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                {!cameraImageBase64 ? (
                  <div className="text-center space-y-3">
                    {isCameraActive ? (
                      <div className="space-y-3">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-w-md mx-auto rounded-lg bg-black aspect-video object-cover" />
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
                        >
                          📸 Chụp Ảnh Ngay
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Bật Camera Chụp Ảnh</span>
                        </button>

                        <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition">
                          <Upload className="w-4 h-4" />
                          <span>Tải Ảnh Từ Máy</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setCameraImageBase64(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={cameraImageBase64} alt="Captured" className="w-14 h-14 object-cover rounded-lg border" />
                      <div>
                        <div className="text-xs font-bold text-emerald-700 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đã nạp ảnh thành công
                        </div>
                        <div className="text-xs text-slate-400">Sẵn sàng để AI phân tích và tạo đề</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCameraImageBase64(null)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold"
                    >
                      Chụp lại
                    </button>
                  </div>
                )}
              </div>
            )}

            {aiSubTab === "link" && (
              <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700">Đường dẫn Website hoặc Video YouTube bài học:</label>
                <input
                  type="url"
                  placeholder="VD: https://youtube.com/watch?v=... hoặc link bài giảng"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            )}

            <button
              type="button"
              disabled={isAiLoading}
              onClick={processFileExtraction}
              className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAiLoading ? "AI Đang Phân Tích..." : "🔍 AI Bóc Tách & Tạo Đề Ngay"}</span>
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 3. Generated Exam Preview & Export Section */}
      {currentQuestions && (
        <div id="section-exam-preview" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  ✅ Đề thi chuẩn: {academicYear}
                </span>
                {sourceInfo && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    ℹ️ {sourceInfo}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Đề Thi: {subject} - {grade} ({period})
              </h2>
              <p className="text-xs text-slate-500">
                Thời gian: {duration} phút | Quy mô: {currentQuestions.mc.length} câu trắc nghiệm & {currentQuestions.es.length} câu tự luận
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-export-pdf"
                onClick={() =>
                  generateExamPDF({
                    title: `Đề thi ${subject} - ${grade} (${period})`,
                    subject,
                    grade,
                    semester,
                    duration,
                    questions: currentQuestions,
                    schoolName,
                    teacherName,
                    includeAnswerKey: true,
                  })
                }
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Bản PDF</span>
              </button>

              <button
                id="btn-print-exam"
                onClick={() =>
                  printExamLayout({
                    title: `Đề thi ${subject} - ${grade} (${period})`,
                    subject,
                    grade,
                    semester,
                    duration,
                    questions: currentQuestions,
                    schoolName,
                    teacherName,
                  })
                }
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Đề Ra Giấy</span>
              </button>

              <button
                id="btn-save-share"
                disabled={isSaving}
                onClick={saveAndShareTest}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isSaving ? "Đang lưu..." : "🔗 Lưu & Gửi Link Cho Học Sinh"}</span>
              </button>
            </div>
          </div>

          {/* Share Modal / Banner if saved */}
          {createdTestId && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đề thi đã được lưu và sẵn sàng gửi link trực tiếp đến học sinh!</span>
                </div>
                <button
                  type="button"
                  onClick={() => onTakeTest(createdTestId)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Học Sinh Làm Bài Ngay</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mã Đề Thi (Test ID)</div>
                  <div className="font-mono text-base font-bold text-blue-700">{createdTestId}</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Đường Link Trực Tiếp Cho Học Sinh Làm Bài</div>
                    <div className="font-mono text-xs text-slate-700 truncate">{getShareLink(createdTestId)}</div>
                  </div>
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex-shrink-0 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Đã chép!" : "Sao chép Link"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Question List Preview */}
          <div className="space-y-6">
            {/* Multiple Choice Section */}
            {currentQuestions.mc.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                      Phần I: Trắc Nghiệm Khách Quan ({currentQuestions.mc.length} Câu)
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {currentQuestions.mc.map((q, idx) => (
                    <div key={idx} className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-sm space-y-3">
                      <div className="font-bold text-slate-900 flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 flex-shrink-0">Câu {idx + 1}:</span>
                          <span>{q.question}</span>
                        </div>
                        {q.cognitiveLevel && (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0 ml-2">
                            {q.cognitiveLevel}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = opt === q.answer;
                          const letter = String.fromCharCode(65 + oIdx);
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border text-xs flex items-center space-x-2 transition ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                  : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                                {letter}
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100">
                          💡 <b>Giải thích chi tiết:</b> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Essay Section */}
            {currentQuestions.es.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                    Phần II: Tự Luận & Vận Dụng ({currentQuestions.es.length} Câu)
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {currentQuestions.es.map((q, idx) => (
                    <div key={idx} className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-sm space-y-3">
                      <div className="font-bold text-slate-900 flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <span className="text-indigo-600 flex-shrink-0">
                            Câu {currentQuestions.mc.length + idx + 1}:
                          </span>
                          <span>{q.question}</span>
                        </div>
                        {q.cognitiveLevel && (
                          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shrink-0 ml-2">
                            {q.cognitiveLevel}
                          </span>
                        )}
                      </div>

                      <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/80 text-xs text-amber-950">
                        <span className="font-bold text-amber-800">🎯 Hướng dẫn chấm & Biểu điểm:</span>
                        <p className="mt-1 leading-relaxed">{q.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Exam Generator & MoET Presets Catalog Modal */}
      <BatchExamGeneratorModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        currentTeacher={currentTeacher}
        currentSubject={subject}
        currentGrade={grade}
        academicYear={academicYear}
        textbook={textbook}
        currentQuestions={currentQuestions}
        onApplyPreset={(preset) => applyPreset(preset)}
        onBatchCreated={(createdTests) => {
          onTestSaved();
          setBatchSuccessToast(`Đã tạo thành công ${createdTests.length} đề thi và cập nhật vào Kho Đề Thi của Thầy/Cô!`);
        }}
      />
    </div>
  );
};
