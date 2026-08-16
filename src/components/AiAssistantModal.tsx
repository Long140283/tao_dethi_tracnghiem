import React, { useState, useEffect } from "react";
import { Bot, Sparkles, Send, Loader2, CheckCircle2, ArrowRight, X, ShieldCheck } from "lucide-react";
import { TestRecord, TeacherProfile } from "../types";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedExam?: (examConfig: any, generatedQuestions?: any) => void;
  onCreatedTest?: (test: TestRecord) => void;
  onDownloadedBank?: () => void;
  currentTeacher?: TeacherProfile | null;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedExam,
  onCreatedTest,
  onDownloadedBank,
  currentTeacher,
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{ sender: "user" | "ai"; message: string; action?: any }>
  >([
    {
      sender: "ai",
      message: currentTeacher
        ? `Xin chào Thầy/Cô ${currentTeacher.name} (${currentTeacher.primarySubject} - ${currentTeacher.primaryGrade} - ${currentTeacher.schoolName})!\n\nTôi là Trợ Lý AI Chuyên Sâu phụ trách khối ${currentTeacher.primaryGrade}. Thầy/Cô có thể ra lệnh bằng văn bản hoặc chọn lệnh gợi ý dưới đây:\n\n• "Tạo đề kiểm tra 15 phút môn ${currentTeacher.primarySubject} ${currentTeacher.primaryGrade}"\n• "Tải ngân hàng đề SGK môn ${currentTeacher.primarySubject} năm học 2026-2027"\n• "Soạn ma trận đề thi giữa kỳ môn ${currentTeacher.primarySubject} có câu tự luận vận dụng cao"`
        : "Xin chào Thầy/Cô! Tôi là Trợ Lý AI Khảo Thí 4.0. Thầy/Cô có thể ra lệnh cho tôi bằng văn bản hoặc chọn lệnh mẫu bên dưới:\n\n• \"Tạo đề kiểm tra giữa kỳ 1 môn Toán lớp 9 bộ Cánh Diều\"\n• \"Tải ngân hàng đề Lịch sử 11 bộ Kết nối tri thức\"\n• \"Soạn đề ôn tập học kỳ 2 Tiếng Anh 12 gồm 20 câu trắc nghiệm\"\n• \"Soạn đề khảo sát đầu năm Hóa học 10 có câu hỏi tự luận\"",
    },
  ]);

  useEffect(() => {
    if (currentTeacher) {
      setHistory([
        {
          sender: "ai",
          message: `Xin chào Thầy/Cô ${currentTeacher.name} (${currentTeacher.primarySubject} - ${currentTeacher.primaryGrade} - ${currentTeacher.schoolName})!\n\nTôi là Trợ Lý AI Chuyên Sâu phụ trách khối ${currentTeacher.primaryGrade}. Thầy/Cô có thể ra lệnh bằng văn bản hoặc chọn lệnh gợi ý dưới đây:\n\n• "Tạo đề kiểm tra 15 phút môn ${currentTeacher.primarySubject} ${currentTeacher.primaryGrade}"\n• "Tải ngân hàng đề SGK môn ${currentTeacher.primarySubject} năm học 2026-2027"\n• "Soạn ma trận đề thi giữa kỳ môn ${currentTeacher.primarySubject} có câu tự luận vận dụng cao"`,
        },
      ]);
    }
  }, [currentTeacher]);

  if (!isOpen) return null;

  const handleSend = async (userPromptText?: string) => {
    const textToSend = userPromptText || prompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setHistory((prev) => [...prev, { sender: "user", message: userMsg }]);
    if (!userPromptText) setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, teacherProfile: currentTeacher }),
      });
      const data = await res.json();

      if (data.actionType === "download_bank") {
        // Automatically trigger download of curriculum bank
        await fetch("/api/ai/download-curriculum-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: data.subject || "Toán",
            grade: data.grade || "Lớp 10",
            textbook: data.textbook || "Bộ sách Kết nối tri thức với cuộc sống",
            period: data.period || "Kiểm tra định kỳ Giữa Học Kỳ 1",
            numQuestions: data.numQuestions || 15,
          }),
        });
        if (onDownloadedBank) onDownloadedBank();
      }

      setHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          message: data.reply || "Tôi đã hoàn thành yêu cầu của Thầy/Cô!",
          action: data,
        },
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          message: `Đã có lỗi xảy ra: ${err.message || "Vui lòng thử lại"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = (action: any) => {
    if (action.actionType === "create_exam") {
      if (onApplyGeneratedExam) {
        onApplyGeneratedExam({
          subject: action.subject || "Toán",
          grade: action.grade || "Lớp 10",
          textbook: action.textbook || "Bộ sách Kết nối tri thức với cuộc sống",
          period: action.period || "Kiểm tra định kỳ Giữa Học Kỳ 1",
          numQuestions: action.numQuestions || 10,
          title: `Đề thi ${action.subject || "Toán"} ${action.grade || "Lớp 10"} - ${action.period || "Giữa kỳ"} (${action.textbook ? action.textbook.replace("Bộ sách ", "") : "Chuẩn GDPT"})`,
        });
      }
      onClose();
    }
  };

  const samplePrompts = [
    "Tạo đề kiểm tra giữa kỳ 1 Toán 9 bộ Cánh Diều",
    "Tải ngân hàng đề Lịch sử 11 bộ Kết nối tri thức",
    "Soạn đề thi Cuối kỳ 1 Tiếng Anh 12 bộ Chân trời sáng tạo",
    "Tạo đề khảo sát đầu năm môn Hóa học 10 (Chuẩn GDPT 2018)",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex h-[620px] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-none">Trợ Lý AI Khảo Thí 4.0</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
                  <Sparkles className="h-3 w-3" /> Trực tuyến
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Tự động hóa toàn bộ quy trình: Tạo đề, Tải ngân hàng SGK, Chấm bài theo SGK Bộ GD&ĐT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {history.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
                  AI
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>

                {msg.action && msg.action.actionType === "create_exam" && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      🎯 {msg.action.subject} • {msg.action.grade} • {msg.action.period || "Giữa kỳ"}
                    </span>
                    <button
                      onClick={() => handleExecuteAction(msg.action)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition"
                    >
                      <span>Mở & Sinh đề ngay</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {msg.action && msg.action.actionType === "download_bank" && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Đã tự động tải ngân hàng câu hỏi vào Thư mục lưu trữ của Thầy/Cô!</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold animate-pulse">
                AI
              </div>
              <div className="rounded-2xl rounded-bl-none bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>AI đang phân tích yêu cầu và thực hiện tác vụ theo chuẩn Bộ GD&ĐT...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompt chips */}
        <div className="bg-white border-t border-slate-100 px-4 py-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Lệnh mẫu nhanh:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {samplePrompts.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sample)}
                className="whitespace-nowrap text-xs rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 px-3 py-1 text-slate-600 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập câu lệnh của bạn (VD: Tạo đề kiểm tra Cuối kỳ 1 Toán 10 Kết nối tri thức...)"
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Thực hiện</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
