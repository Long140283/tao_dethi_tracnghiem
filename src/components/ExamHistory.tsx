import React, { useState } from "react";
import {
  History,
  Download,
  Printer,
  PlayCircle,
  Copy,
  Check,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Search,
  Layers,
  FileText,
  Lock,
  UserCheck,
  ShieldCheck,
  Building,
  Filter,
  Tag,
  Shuffle,
} from "lucide-react";
import { TestRecord, SUBJECTS, GRADES, EXAM_PERIODS, TeacherProfile } from "../types";
import { generateExamPDF, printExamLayout } from "../utils/pdfExport";

interface ExamHistoryProps {
  tests: TestRecord[];
  onTakeTest: (testId: string) => void;
  onDeleteTest: (testId: string) => void;
  currentTeacher?: TeacherProfile | null;
  isIsolatedMode?: boolean;
}

export const ExamHistory: React.FC<ExamHistoryProps> = ({
  tests,
  onTakeTest,
  onDeleteTest,
  currentTeacher,
  isIsolatedMode = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [onlyMyTests, setOnlyMyTests] = useState<boolean>(isIsolatedMode || false);

  const copyTestLink = (testId: string) => {
    const link = `${window.location.origin}/?test_id=${testId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(testId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredTests = tests.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      t.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (t.period && t.period.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (t.teacherName && t.teacherName.toLowerCase().includes(searchKeyword.toLowerCase()));
    const matchSub = filterSubject === "all" || t.subject === filterSubject;
    const matchGrd = filterGrade === "all" || t.grade === filterGrade;
    const matchPrd = filterPeriod === "all" || (t.period && t.period.toLowerCase().includes(filterPeriod.toLowerCase()));

    let matchTeacher = true;
    if (onlyMyTests && currentTeacher) {
      matchTeacher = t.teacherId === currentTeacher.id || t.teacherName === currentTeacher.name;
    }

    return matchSearch && matchSub && matchGrd && matchPrd && matchTeacher;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Kho Lưu Trữ Đề Thi & Quản Lý Khảo Thí</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                  {filteredTests.length} / {tests.length} đề thi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Toàn bộ đề thi được lưu trữ bảo mật theo khối lớp, môn học, phân phối chương trình và giáo viên ra đề
              </p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {currentTeacher && (
              <button
                type="button"
                onClick={() => setOnlyMyTests(!onlyMyTests)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  onlyMyTests
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Chỉ đề của tôi</span>
              </button>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên đề, mã đề, giáo viên..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden"
              />
            </div>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả môn</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả khối</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-800 cursor-pointer"
            >
              <option value="all">Tất cả kỳ thi</option>
              <option value="15 phút">Kiểm tra 15 phút</option>
              <option value="1 tiết">Kiểm tra 1 tiết (45p)</option>
              <option value="Giữa Học Kỳ 1">Giữa Học Kỳ 1</option>
              <option value="Cuối Học Kỳ 1">Cuối Học Kỳ 1</option>
              <option value="Giữa Học Kỳ 2">Giữa Học Kỳ 2</option>
              <option value="Cuối Học Kỳ 2">Cuối Học Kỳ 2 (Cuối năm)</option>
              <option value="Mã đề">Mã đề hoán vị</option>
              <option value="Tốt nghiệp">Tốt nghiệp THPT / ĐGNL</option>
            </select>
          </div>
        </div>

        {filteredTests.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa có đề thi nào trong kho</p>
            <p className="text-xs text-slate-400 mt-1">
              Khi bạn tạo và lưu đề thi ở tab "Tạo Đề Thi Mới", đề thi sẽ tự động lưu vĩnh viễn tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {filteredTests.map((test) => {
              const mcCount = test.questions?.mc?.length || 0;
              const esCount = test.questions?.es?.length || 0;
              const totalQ = mcCount + esCount;
              const isMine = currentTeacher && (test.teacherId === currentTeacher.id || test.teacherName === currentTeacher.name);

              return (
                <div
                  key={test.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-extrabold text-base text-slate-900">{test.title}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {test.grade}
                        </span>
                        {test.textbook && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            {test.textbook}
                          </span>
                        )}
                        {test.period && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {test.period}
                          </span>
                        )}
                        {test.isSecret && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Lock className="w-3 h-3" /> Bí mật đề thi
                          </span>
                        )}
                        {isMine && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ShieldCheck className="w-3 h-3" /> Đề của tôi
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="flex items-center font-medium text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                          {test.teacherName || "Ban Khảo Thí"}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> {test.duration} phút
                        </span>
                        <span>• {totalQ} câu ({mcCount} TN, {esCount} TL)</span>
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> {new Date(test.created_at).toLocaleDateString("vi-VN")}
                        </span>
                        <span>
                          • Mã: <code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{test.id}</code>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onTakeTest(test.id)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Vào Thi Thử</span>
                      </button>

                      <button
                        onClick={() =>
                          generateExamPDF({
                            title: test.title,
                            subject: test.subject,
                            grade: test.grade,
                            semester: test.semester,
                            duration: test.duration,
                            questions: test.questions,
                            schoolName: test.schoolName,
                            teacherName: test.teacherName,
                            includeAnswerKey: true,
                          })
                        }
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                        title="Tải đề thi PDF chuẩn in ấn kèm đáp án"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải PDF</span>
                      </button>

                      <button
                        onClick={() =>
                          printExamLayout({
                            title: test.title,
                            subject: test.subject,
                            grade: test.grade,
                            semester: test.semester,
                            duration: test.duration,
                            questions: test.questions,
                            schoolName: test.schoolName,
                            teacherName: test.teacherName,
                          })
                        }
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        title="In đề thi ra giấy"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => copyTestLink(test.id)}
                        className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
                        title="Sao chép link làm bài trực tiếp cho học sinh"
                      >
                        {copiedId === test.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === test.id ? "Đã chép!" : "Link thi"}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa đề thi "${test.title}"?`)) {
                            onDeleteTest(test.id);
                          }
                        }}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
