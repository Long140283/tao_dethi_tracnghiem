import React, { useState } from "react";
import {
  BarChart3,
  Search,
  User,
  Clock,
  Award,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileCheck,
  RefreshCw,
  AlertCircle,
  Layers,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { SubmissionRecord, TestRecord, TeacherProfile } from "../types";

interface StudentResultsProps {
  submissions: SubmissionRecord[];
  onRefresh: () => void;
  currentTeacher?: TeacherProfile | null;
  isIsolatedMode?: boolean;
}

export const StudentResults: React.FC<StudentResultsProps> = ({
  submissions,
  onRefresh,
  currentTeacher,
  isIsolatedMode = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [testDetailsMap, setTestDetailsMap] = useState<Record<string, TestRecord>>({});
  const [gradingState, setGradingState] = useState<Record<string, { loading: boolean; comments: string[] }>>({});
  const [isBatchGrading, setIsBatchGrading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [onlyMySubmissions, setOnlyMySubmissions] = useState<boolean>(isIsolatedMode || false);

  // Fetch test details for expanded submission
  const fetchTestDetails = async (testId: string) => {
    if (testDetailsMap[testId]) return;
    try {
      const res = await fetch(`/api/tests/${testId}`);
      if (res.ok) {
        const data = await res.json();
        setTestDetailsMap((prev) => ({ ...prev, [testId]: data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleExpand = (sub: SubmissionRecord) => {
    if (selectedSubId === sub.id) {
      setSelectedSubId(null);
    } else {
      setSelectedSubId(sub.id);
      fetchTestDetails(sub.test_id);
    }
  };

  // Grade Single Submission with AI (Gemini)
  const handleAIGradeEssay = async (sub: SubmissionRecord) => {
    const test = testDetailsMap[sub.test_id];
    if (!test || !test.questions.es || test.questions.es.length === 0) {
      alert("Đề thi này không có câu hỏi tự luận để chấm!");
      return;
    }

    setGradingState((prev) => ({
      ...prev,
      [sub.id]: { loading: true, comments: [] },
    }));

    try {
      let additionalScore = 0;
      const feedbackList: string[] = [];

      for (let i = 0; i < test.questions.es.length; i++) {
        const q = test.questions.es[i];
        const studentAns = sub.answers[`es_${i}`] || "";

        const res = await fetch("/api/ai/grade-essay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q.question,
            student_answer: studentAns,
            reference_answer: q.answer,
          }),
        });

        const gradeResult = await res.json();
        const score = Number(gradeResult.score) || 0;
        additionalScore += (score / 10) * (10 / (sub.total_questions || 1));
        feedbackList.push(`Câu TL ${i + 1} (${score}/10đ): ${gradeResult.comment}`);
      }

      const newTotalScore = Math.min(10, Math.round((sub.score + additionalScore) * 100) / 100);

      // Update score in backend
      await fetch(`/api/submissions/${sub.id}/score`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: newTotalScore,
          aiFeedback: feedbackList.join("\n"),
        }),
      });

      setGradingState((prev) => ({
        ...prev,
        [sub.id]: { loading: false, comments: feedbackList },
      }));

      onRefresh();
    } catch (err: any) {
      alert(`Lỗi khi AI chấm điểm: ${err.message}`);
      setGradingState((prev) => ({
        ...prev,
        [sub.id]: { loading: false, comments: ["Lỗi khi chấm"] },
      }));
    }
  };

  // Grade All Essays in Batch
  const handleBatchGradeAll = async () => {
    if (!confirm("Bạn có muốn AI tự động chấm toàn bộ bài tự luận chưa được chấm điểm?")) return;

    setIsBatchGrading(true);
    try {
      const res = await fetch("/api/ai/batch-grade-essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      alert(`Đã hoàn tất chấm hàng loạt! Có ${data.gradedCount || 0} bài thi được AI phân tích và nâng cấp điểm số.`);
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi khi chấm hàng loạt: ${err.message}`);
    } finally {
      setIsBatchGrading(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa kết quả bài làm này?")) return;
    try {
      await fetch(`/api/submissions/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      s.student_name.toLowerCase().includes(term) ||
      s.test_id.toLowerCase().includes(term) ||
      (s.test_title && s.test_title.toLowerCase().includes(term));

    let matchTeacher = true;
    if (onlyMySubmissions && currentTeacher) {
      matchTeacher = Boolean(
        s.teacherId === currentTeacher.id ||
        (s.test_title && s.test_title.includes(currentTeacher.primarySubject))
      );
    }

    return matchSearch && matchTeacher;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Khảo Thí & Chấm Điểm Bài Làm</h2>
              <p className="text-xs text-slate-500">Phân tích kết quả theo từng giáo viên và khối lớp, sử dụng AI chấm bài tự luận chuẩn sư phạm</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentTeacher && (
              <button
                type="button"
                onClick={() => setOnlyMySubmissions(!onlyMySubmissions)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  onlyMySubmissions
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Chỉ học sinh lớp của tôi</span>
              </button>
            )}

            {submissions.length > 0 && (
              <button
                onClick={handleBatchGradeAll}
                disabled={isBatchGrading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isBatchGrading ? "AI Đang Chấm Hàng Loạt..." : "⚡ AI Chấm Hàng Loạt"}</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsRefreshing(true);
                onRefresh();
                setTimeout(() => setIsRefreshing(false), 500);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo tên học sinh, mã đề thi (Test ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Award className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa có bài thi nào được nộp</p>
            <p className="text-xs text-slate-400 mt-1">
              Gửi link đề thi cho học sinh làm bài trực tuyến. Kết quả sẽ tự động gửi về theo mã tài khoản giáo viên.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((sub) => {
              const isExpanded = selectedSubId === sub.id;
              const test = testDetailsMap[sub.test_id];
              const isGradingThis = gradingState[sub.id]?.loading;
              const comments = gradingState[sub.id]?.comments || (sub.aiFeedback ? [sub.aiFeedback] : []);

              return (
                <div
                  key={sub.id}
                  className="border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition shadow-2xs bg-white"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => handleToggleExpand(sub)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-white hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                        {sub.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-base text-slate-900">{sub.student_name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            {sub.student_class}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Đề: <span className="font-medium text-slate-700">{sub.test_title || sub.test_id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-4">
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-600">
                          {sub.score.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Đúng {sub.correct_count}/{sub.total_questions} câu
                        </div>
                      </div>

                      <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                      <div className="text-xs text-slate-400 hidden sm:block">
                        <div>{new Date(sub.submitted_at).toLocaleTimeString("vi-VN")}</div>
                        <div>{new Date(sub.submitted_at).toLocaleDateString("vi-VN")}</div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubmission(sub.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Xóa bài nộp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-1 rounded-lg text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-6">
                      {/* AI Grading Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100">
                        <div>
                          <h4 className="font-bold text-sm text-purple-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span>AI Trợ Lý Khảo Thí & Chấm Điểm Tự Luận</span>
                          </h4>
                          <p className="text-xs text-purple-700 mt-0.5">
                            AI so sánh bài làm của học sinh với biểu điểm chuẩn và tự động cho điểm nhận xét chi tiết
                          </p>
                        </div>

                        <button
                          onClick={() => handleAIGradeEssay(sub)}
                          disabled={isGradingThis}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isGradingThis ? "Đang Phân Tích & Chấm..." : "Chấm Bài Bằng AI"}</span>
                        </button>
                      </div>

                      {/* AI Comments Feed */}
                      {comments.length > 0 && (
                        <div className="p-4 bg-white rounded-xl border border-purple-200 text-xs text-slate-700 space-y-1.5">
                          <div className="font-bold text-purple-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Nhận xét chi tiết từ AI:
                          </div>
                          {comments.map((c, idx) => (
                            <div key={idx} className="pl-5 text-slate-600 whitespace-pre-line">
                              {c}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Test Answer Sheet Analysis */}
                      {test ? (
                        <div className="space-y-4">
                          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                            Chi tiết bài làm từng câu hỏi
                          </h4>

                          {/* Multiple Choice Answers */}
                          {test.questions.mc && test.questions.mc.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-700">Phần Trắc Nghiệm:</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {test.questions.mc.map((q, idx) => {
                                  const studentChoice = sub.answers[`mc_${idx}`];
                                  const isCorrect = studentChoice === q.answer;

                                  return (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-xl border text-xs ${
                                        isCorrect
                                          ? "bg-emerald-50/50 border-emerald-200"
                                          : "bg-red-50/50 border-red-200"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-slate-800">Câu {idx + 1}:</span>
                                        {isCorrect ? (
                                          <span className="flex items-center text-emerald-600 font-bold">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đúng
                                          </span>
                                        ) : (
                                          <span className="flex items-center text-red-600 font-bold">
                                            <XCircle className="w-3.5 h-3.5 mr-1" /> Sai
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-slate-600 truncate">{q.question}</div>
                                      <div className="mt-1 flex items-center space-x-2 text-[11px]">
                                        <span>
                                          Học sinh chọn: <strong>{studentChoice || "Chưa làm"}</strong>
                                        </span>
                                        <span>• Đáp án: <strong className="text-emerald-700">{q.answer}</strong></span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Essay Answers */}
                          {test.questions.es && test.questions.es.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-700">Phần Tự Luận:</div>
                              <div className="space-y-3">
                                {test.questions.es.map((q, idx) => {
                                  const studentAns = sub.answers[`es_${idx}`] || "(Không có bài làm)";

                                  return (
                                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
                                      <div className="font-bold text-slate-800">
                                        Câu {idx + 1}: {q.question}
                                      </div>
                                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className="font-semibold text-slate-500 mb-1">Bài làm của học sinh:</div>
                                        <div className="text-slate-900 whitespace-pre-line">{studentAns}</div>
                                      </div>
                                      <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                        <div className="font-semibold text-emerald-800 mb-1">Đáp án & Biểu điểm chuẩn:</div>
                                        <div className="text-emerald-900 whitespace-pre-line">{q.answer}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 flex items-center justify-center p-4">
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Đang tải chi tiết đề thi...
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
