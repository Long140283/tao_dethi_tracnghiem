import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Check,
  XCircle,
  RefreshCw,
  HelpCircle,
  Share2,
  Copy,
  QrCode,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Flag,
  FileCheck,
  Building,
  User,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Flame
} from "lucide-react";
import { TestRecord, SubmissionRecord } from "../types";
import confetti from "canvas-confetti";

interface StudentExamViewProps {
  initialTestId?: string | null;
  tests: TestRecord[];
  onFinishExam: () => void;
}

export const StudentExamView: React.FC<StudentExamViewProps> = ({ initialTestId, tests, onFinishExam }) => {
  // Test selection state
  const [selectedTestId, setSelectedTestId] = useState<string>(initialTestId || (tests[0]?.id ?? ""));
  const [customTestInput, setCustomTestInput] = useState<string>("");
  const [currentTest, setCurrentTest] = useState<TestRecord | null>(null);
  const [isLoadingTest, setIsLoadingTest] = useState<boolean>(false);
  const [testNotFound, setTestNotFound] = useState<boolean>(false);

  // Student Info & State
  const [studentName, setStudentName] = useState<string>("");
  const [studentClass, setStudentClass] = useState<string>("");
  const [studentIdNum, setStudentIdNum] = useState<string>("");
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  // Exam Taking State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);

  // Submission Result State
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    totalQuestions: number;
    submissionId: string;
    submittedAt: string;
  } | null>(null);

  // Share link modal / copy feedback state
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Fetch test details
  const loadTest = async (testId: string) => {
    if (!testId) return;
    setIsLoadingTest(true);
    setTestNotFound(false);
    try {
      const res = await fetch(`/api/tests/${testId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentTest(data);
        setTimeLeftSeconds((data.duration || 45) * 60);
      } else {
        setTestNotFound(true);
        setCurrentTest(null);
      }
    } catch (err) {
      console.error(err);
      setTestNotFound(true);
    } finally {
      setIsLoadingTest(false);
    }
  };

  useEffect(() => {
    if (selectedTestId) {
      loadTest(selectedTestId);
    }
  }, [selectedTestId]);

  // Load from URL param if available
  useEffect(() => {
    if (initialTestId) {
      setSelectedTestId(initialTestId);
      loadTest(initialTestId);
    }
  }, [initialTestId]);

  // Countdown timer
  useEffect(() => {
    if (!isExamStarted || submittedResult || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true); // Auto submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamStarted, submittedResult, timeLeftSeconds]);

  // Anti-cheat: Track tab visibility switch during exam
  useEffect(() => {
    if (!isExamStarted || submittedResult) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarnings((prev) => {
          const next = prev + 1;
          setShowWarningModal(true);
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isExamStarted, submittedResult]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert("Vui lòng nhập họ và tên thí sinh để vào thi!");
      return;
    }
    setIsExamStarted(true);
    setStartedAt(new Date().toLocaleTimeString("vi-VN"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectMC = (idx: number, opt: string) => {
    setAnswers((prev) => ({ ...prev, [`mc_${idx}`]: opt }));
  };

  const handleEssayChange = (idx: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [`es_${idx}`]: val }));
  };

  const toggleFlagQuestion = (idx: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const scrollToQuestion = (idx: number) => {
    const el = document.getElementById(`q-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleSubmitExam = async (isAuto = false) => {
    if (!currentTest) return;

    const totalQuestions = (currentTest.questions.mc?.length || 0) + (currentTest.questions.es?.length || 0);
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    if (!isAuto) {
      let confirmMsg = "Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?";
      if (unansweredCount > 0) {
        confirmMsg = `⚠️ Chú ý: Bạn còn ${unansweredCount} câu chưa trả lời!\nBạn vẫn muốn nộp bài thi chứ?`;
      }
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_id: currentTest.id,
          student_name: `${studentName}${studentClass ? ` (${studentClass})` : ""}`,
          student_class: studentClass,
          student_id_num: studentIdNum,
          answers,
        }),
      });

      const data = await res.json();
      setSubmittedResult({
        score: data.score,
        totalQuestions: data.total_questions,
        submissionId: data.id,
        submittedAt: new Date().toLocaleTimeString("vi-VN"),
      });

      // Confetti fire
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {
        // ignore if canvas confetti not supported
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      alert(`Lỗi khi nộp bài: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyExamLink = () => {
    if (!currentTest) return;
    const link = `${window.location.origin}/?test_id=${currentTest.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Format Time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const mcList = currentTest?.questions?.mc || [];
  const esList = currentTest?.questions?.es || [];
  const totalQuestions = mcList.length + esList.length;
  const answeredCount = Object.keys(answers).length;
  const isTimeRunningLow = timeLeftSeconds < 300; // < 5 mins

  // ==========================================
  // VIEW 1: EXAM SUBMISSION RESULT & DETAILED REVIEW
  // ==========================================
  if (submittedResult && currentTest) {
    const correctMcCount = mcList.filter((q, idx) => answers[`mc_${idx}`] === q.answer).length;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Result Certificate Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />
          
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50">
            <Award className="w-10 h-10 text-emerald-600" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Nộp Bài Thành Công & Đã Ghi Nhận Vào Hệ Thống</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{studentName}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {studentClass && <span>Lớp: <b>{studentClass}</b> • </span>}
              Mã bài nộp: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700">{submittedResult.submissionId}</code> • Lúc: {submittedResult.submittedAt}
            </p>
          </div>

          {/* Test Metadata Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-xl mx-auto text-left text-xs text-slate-700 space-y-1.5">
            <div className="font-extrabold text-sm text-slate-900">{currentTest.title}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
              <span>Môn: <b>{currentTest.subject}</b></span>
              <span>Khối: <b>{currentTest.grade}</b></span>
              <span>Bộ SGK: <b>{currentTest.textbook?.replace("Bộ sách ", "") || "Chuẩn Bộ GD&ĐT"}</b></span>
              <span>Giáo viên: <b>{currentTest.teacherName || "Ban Khảo Thí"}</b></span>
            </div>
          </div>

          {/* Score Display */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-6 max-w-md mx-auto shadow-xs">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Điểm Đánh Giá Trắc Nghiệm</div>
            <div className="text-5xl font-black text-emerald-600 my-2">
              {Number(submittedResult.score).toFixed(2)}
              <span className="text-xl text-slate-400 font-semibold"> / 10</span>
            </div>
            <div className="text-xs text-emerald-900 font-medium">
              Đúng <b>{correctMcCount} / {mcList.length}</b> câu trắc nghiệm
              {esList.length > 0 && " • (Phần Tự luận sẽ được Giáo viên / AI chấm điểm thêm)"}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSubmittedResult(null);
                setIsExamStarted(false);
                setAnswers({});
                setFlaggedQuestions({});
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Làm Lại Đề Này</span>
            </button>

            <button
              onClick={onFinishExam}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Giáo Viên / Danh Sách Đề</span>
            </button>
          </div>
        </div>

        {/* Detailed Solutions & Explanations Review */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Đối Chiếu Chi Tiết Từng Câu Hỏi & Lời Giải Sư Phạm</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Đáp án chuẩn theo SGK {currentTest.textbook?.replace("Bộ sách ", "")}
            </span>
          </div>

          <div className="space-y-4">
            {mcList.map((q, idx) => {
              const studentChoice = answers[`mc_${idx}`];
              const isCorrect = studentChoice === q.answer;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border text-sm space-y-3 transition ${
                    isCorrect
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-red-50/40 border-red-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-slate-900 leading-relaxed">
                      <span className="text-blue-600 font-extrabold mr-2">Câu {idx + 1}:</span>
                      {q.question}
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isCorrect ? "✅ Chính xác" : "❌ Chưa chính xác"}
                    </span>
                  </div>

                  {/* Options Review */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const isStudentSelected = studentChoice === opt;
                      const isCorrectAnswer = q.answer === opt;

                      let optClass = "bg-white border-slate-200 text-slate-700";
                      if (isCorrectAnswer) {
                        optClass = "bg-emerald-100/80 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-500";
                      } else if (isStudentSelected && !isCorrect) {
                        optClass = "bg-red-100/80 border-red-400 text-red-950 font-semibold line-through";
                      }

                      return (
                        <div key={oIdx} className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${optClass}`}>
                          <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {letter}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrectAnswer && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                          {isStudentSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-700 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pedagogical Explanation */}
                  {q.explanation && (
                    <div className="text-xs text-slate-700 bg-white/90 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Lời giải sư phạm chi tiết:</span>
                      </div>
                      <p className="leading-relaxed text-slate-600">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Essay Solutions */}
            {esList.map((q, idx) => {
              const qNum = mcList.length + idx + 1;
              const studentText = answers[`es_${idx}`];

              return (
                <div key={idx} className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 text-sm space-y-3">
                  <div className="font-bold text-slate-900 leading-relaxed">
                    <span className="text-indigo-600 font-extrabold mr-2">Câu {qNum} (Tự luận):</span>
                    {q.question}
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs">
                    <b className="text-slate-500 block mb-1">Nội dung bài làm của bạn đã gửi:</b>
                    <p className="whitespace-pre-wrap text-slate-800 font-mono text-[13px] leading-relaxed">
                      {studentText || "(Thí sinh bỏ trống không nhập câu trả lời)"}
                    </p>
                  </div>

                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                    <b className="text-amber-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hướng dẫn chấm & Đáp án chuẩn:</span>
                    </b>
                    <p className="leading-relaxed">{q.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: STUDENT ENTRY & VERIFICATION SCREEN
  // ==========================================
  if (!isExamStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Phòng Thi Trực Tuyến Học Sinh</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hệ thống khảo thí số chuẩn Bộ Giáo dục & Đào tạo. Vui lòng kiểm tra mã đề thi và điền thông tin thí sinh để bắt đầu tính giờ.
            </p>
          </div>

          {/* Test Link Share / Direct Link Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Link Gửi Đề Cho Học Sinh:</span>
              </div>
              <button
                type="button"
                onClick={handleCopyExamLink}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 shadow-xs transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã Sao Chép Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link Làm Bài</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-blue-800">
              Giáo viên chỉ cần copy đường link này gửi qua Zalo / Messenger / Google Classroom, học sinh bấm vào sẽ tự động vào thẳng đề thi này.
            </p>
          </div>

          {/* Test Selector & Search by Code */}
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Chọn Đề Thi Trong Kho:
              </label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.duration} phút - {t.questions?.mc?.length || 0} TN, {t.questions?.es?.length || 0} TL)
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-bold uppercase">Hoặc nhập mã Test ID</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã đề (VD: 8 ký tự do giáo viên cung cấp)..."
                value={customTestInput}
                onChange={(e) => setCustomTestInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => {
                  if (customTestInput.trim()) {
                    setSelectedTestId(customTestInput.trim());
                    loadTest(customTestInput.trim());
                  }
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition shrink-0"
              >
                Tìm Đề
              </button>
            </div>

            {testNotFound && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Không tìm thấy đề thi với mã này. Vui lòng kiểm tra lại mã giáo viên cung cấp!</span>
              </div>
            )}
          </div>

          {/* Current Test Info Card */}
          {currentTest && (
            <div className="p-4 rounded-2xl bg-white border-2 border-indigo-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                  Thông Tin Đề Thi
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono">ID: {currentTest.id}</span>
              </div>
              <div className="font-black text-sm sm:text-base text-slate-900">{currentTest.title}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Môn học:</span>
                  <span className="font-bold text-slate-800">{currentTest.subject}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Khối lớp:</span>
                  <span className="font-bold text-slate-800">{currentTest.grade}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Thời gian:</span>
                  <span className="font-bold text-blue-700">{currentTest.duration} phút</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Cấu trúc:</span>
                  <span className="font-bold text-slate-800">
                    {currentTest.questions?.mc?.length || 0} TN + {currentTest.questions?.es?.length || 0} TL
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Student Information Form */}
          <form onSubmit={handleStartExam} className="space-y-4 pt-1">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Thông Tin Thí Sinh Dự Thi:
              </label>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Họ và tên học sinh (bắt buộc) *"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Lớp / Trường (VD: 10A1 - THPT Chuyên)"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />

                <input
                  type="text"
                  placeholder="Số báo danh / Mã HS (tùy chọn)"
                  value={studentIdNum}
                  onChange={(e) => setStudentIdNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Exam Rules & Instructions */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Quy chế thi trực tuyến:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-950">
                <li>Đồng hồ đếm ngược sẽ bắt đầu ngay khi bạn bấm nút làm bài.</li>
                <li>Hệ thống tự động lưu câu trả lời theo thời gian thực.</li>
                <li>Khi hết giờ, hệ thống sẽ tự động nộp bài và khóa chỉnh sửa.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={!currentTest || isLoadingTest}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Bắt Đầu Làm Bài Thi Ngay</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: ACTIVE EXAM IN PROGRESS
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24 animate-in fade-in duration-200">
      
      {/* Sticky Countdown & Progress Header */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-md flex items-center justify-between gap-3">
        
        {/* Student Name & Progress */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-inner">
            <span>{answeredCount}</span>
            <span className="text-[9px] text-blue-500 font-medium">/{totalQuestions}</span>
          </div>
          <div className="truncate">
            <div className="font-black text-xs sm:text-sm text-slate-900 truncate">{studentName}</div>
            <div className="text-[11px] text-slate-500 truncate">
              {currentTest?.title} • {studentClass || "Thí sinh tự do"}
            </div>
          </div>
        </div>

        {/* Timer, Fullscreen & Submit Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-mono text-sm sm:text-base font-black transition ${
              isTimeRunningLow
                ? "bg-red-100 text-red-700 animate-pulse border border-red-300"
                : "bg-slate-100 text-slate-800 border border-slate-200"
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeRunningLow ? "text-red-600" : "text-slate-500"}`} />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình phòng thi"}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleSubmitExam(false)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Đang Nộp..." : "Nộp Bài"}</span>
          </button>
        </div>
      </div>

      {/* Tab Switch Warning Modal */}
      {showWarningModal && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Cảnh báo: Bạn vừa rời khỏi tab bài thi (Đã ghi nhận <b>{tabSwitchWarnings} lần</b>). Vui lòng tập trung làm bài!
            </span>
          </div>
          <button
            onClick={() => setShowWarningModal(false)}
            className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Layout Grid: Left Content (Questions) + Right Sidebar (Question Palette) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Exam Questions Container */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Part I: Multiple Choice Questions */}
          {mcList.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-slate-900">
                    Phần I: Trắc Nghiệm Khách Quan ({mcList.length} câu)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Chọn 1 đáp án đúng nhất
                </span>
              </div>

              <div className="space-y-6">
                {mcList.map((q, idx) => {
                  const selectedOpt = answers[`mc_${idx}`];
                  const isFlagged = flaggedQuestions[idx];

                  return (
                    <div
                      key={idx}
                      id={`q-${idx}`}
                      className={`p-5 rounded-2xl border text-sm space-y-4 transition ${
                        isFlagged
                          ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-400"
                          : selectedOpt
                          ? "bg-slate-50/90 border-blue-200"
                          : "bg-slate-50/40 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-slate-900 flex items-start gap-2 leading-relaxed text-sm sm:text-base">
                          <span className="text-blue-600 font-black shrink-0">Câu {idx + 1}:</span>
                          <span>{q.question}</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => toggleFlagQuestion(idx)}
                          title="Đặt cờ xem lại sau"
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            isFlagged
                              ? "bg-amber-100 text-amber-800"
                              : "text-slate-400 hover:text-amber-600 hover:bg-slate-100"
                          }`}
                        >
                          <Flag className={`w-3.5 h-3.5 ${isFlagged ? "fill-amber-500 text-amber-600" : ""}`} />
                        </button>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 sm:pl-4">
                        {q.options.map((opt, oIdx) => {
                          const isChecked = selectedOpt === opt;
                          const letter = String.fromCharCode(65 + oIdx);

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleSelectMC(idx, opt)}
                              className={`p-3 sm:p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center gap-3 transition cursor-pointer ${
                                isChecked
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isChecked ? "bg-white text-blue-600" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="flex-1 leading-snug">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Part II: Essay Questions */}
          {esList.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                  <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-slate-900">
                    Phần II: Tự Luận ({esList.length} câu)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Trình bày bài làm chi tiết
                </span>
              </div>

              <div className="space-y-6">
                {esList.map((q, idx) => {
                  const qNum = mcList.length + idx + 1;
                  const val = answers[`es_${idx}`] || "";

                  return (
                    <div
                      key={idx}
                      id={`q-${mcList.length + idx}`}
                      className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 text-sm space-y-3"
                    >
                      <div className="font-bold text-slate-900 flex items-start gap-2 leading-relaxed text-sm sm:text-base">
                        <span className="text-indigo-600 font-black shrink-0">Câu {qNum}:</span>
                        <span>{q.question}</span>
                      </div>

                      <textarea
                        rows={6}
                        placeholder="Nhập nội dung bài làm tự luận của bạn tại đây..."
                        value={val}
                        onChange={(e) => handleEssayChange(idx, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition leading-relaxed font-sans"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Complete Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              Bạn đã hoàn thành <b>{answeredCount}/{totalQuestions}</b> câu hỏi. Hãy rà soát kỹ trước khi nộp bài!
            </p>
            <button
              onClick={() => handleSubmitExam(false)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Đang Gửi Kết Quả..." : "Nộp Bài Thi & Xem Điểm Số"}</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Quick Question Navigation Matrix Palette */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-36 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Bảng Câu Hỏi ({totalQuestions})
              </span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {answeredCount} Đã làm
              </span>
            </div>

            {/* Quick Palette Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: totalQuestions }).map((_, qIdx) => {
                const isMc = qIdx < mcList.length;
                const isAnswered = isMc ? Boolean(answers[`mc_${qIdx}`]) : Boolean(answers[`es_${qIdx - mcList.length}`]);
                const isFlagged = flaggedQuestions[qIdx];

                let btnClass = "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
                if (isFlagged) {
                  btnClass = "bg-amber-400 text-amber-950 font-black border-amber-500 ring-2 ring-amber-300";
                } else if (isAnswered) {
                  btnClass = "bg-blue-600 text-white font-bold border-blue-600 shadow-xs";
                }

                return (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => scrollToQuestion(qIdx)}
                    className={`h-8 rounded-lg text-xs font-bold border flex items-center justify-center transition cursor-pointer ${btnClass}`}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-400 inline-block"></span>
                <span>Đặt cờ xem lại</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block"></span>
                <span>Chưa làm</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
