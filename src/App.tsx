import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { ExamGenerator } from "./components/ExamGenerator";
import { QuestionBankManager } from "./components/QuestionBankManager";
import { StudentResults } from "./components/StudentResults";
import { ExamHistory } from "./components/ExamHistory";
import { StudentExamView } from "./components/StudentExamView";
import { AiAssistantModal } from "./components/AiAssistantModal";
import { CurriculumBankDownloaderModal } from "./components/CurriculumBankDownloaderModal";
import { TeacherAuthModal } from "./components/TeacherAuthModal";
import { FolderRecord, TestRecord, SubmissionRecord, TeacherProfile } from "./types";

export function App() {
  const [activeTab, setActiveTab] = useState<"generator" | "bank" | "results" | "history" | "student">("generator");
  const [isStudentMode, setIsStudentMode] = useState<boolean>(false);
  const [studentActiveTestId, setStudentActiveTestId] = useState<string | null>(null);

  // Modals state
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"switch" | "edit" | "register">("switch");

  // Teacher Profile & Security State
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile | null>(null);
  const [isIsolatedMode, setIsIsolatedMode] = useState<boolean>(false);

  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);

  // Fetch Teachers
  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      if (res.ok) {
        const list: TeacherProfile[] = await res.json();
        setTeachers(list);
        if (!currentTeacher && list.length > 0) {
          // Check local storage for saved active teacher or default to first teacher
          const savedId = localStorage.getItem("active_teacher_id");
          const found = list.find((t) => t.id === savedId) || list[0];
          setCurrentTeacher(found);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch initial data
  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) setFolders(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTests = async () => {
    try {
      const url = isIsolatedMode && currentTeacher
        ? `/api/tests?teacher_id=${currentTeacher.id}`
        : "/api/tests";
      const res = await fetch(url);
      if (res.ok) setTests(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const url = isIsolatedMode && currentTeacher
        ? `/api/submissions?teacher_id=${currentTeacher.id}`
        : "/api/submissions";
      const res = await fetch(url);
      if (res.ok) setSubmissions(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchFolders();
    fetchTests();
    fetchSubmissions();

    // Check URL parameters for direct student test link (?test_id=...)
    const params = new URLSearchParams(window.location.search);
    const testIdFromUrl = params.get("test_id");
    if (testIdFromUrl) {
      setStudentActiveTestId(testIdFromUrl);
      setIsStudentMode(true);
    }
  }, []);

  useEffect(() => {
    fetchTests();
    fetchSubmissions();
  }, [currentTeacher, isIsolatedMode]);

  const handleSelectTeacher = (teacher: TeacherProfile) => {
    setCurrentTeacher(teacher);
    localStorage.setItem("active_teacher_id", teacher.id);
  };

  const handleOpenAuthModal = (mode: "switch" | "edit" | "register" = "switch") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleTakeTest = (testId: string) => {
    setStudentActiveTestId(testId);
    setIsStudentMode(true);
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await fetch(`/api/tests/${testId}`, { method: "DELETE" });
      fetchTests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiCommandCreatedTest = (test: TestRecord) => {
    fetchTests();
    setActiveTab("history");
  };

  const handleAiCommandDownloadedBank = () => {
    fetchFolders();
    setActiveTab("bank");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isStudentMode={isStudentMode}
        setIsStudentMode={setIsStudentMode}
        studentActiveTestId={studentActiveTestId}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        currentTeacher={currentTeacher}
        teachers={teachers}
        onSelectTeacher={handleSelectTeacher}
        onOpenAuthModal={handleOpenAuthModal}
        isIsolatedMode={isIsolatedMode}
        setIsIsolatedMode={setIsIsolatedMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isStudentMode ? (
          <StudentExamView
            initialTestId={studentActiveTestId}
            tests={tests}
            onFinishExam={() => {
              setIsStudentMode(false);
              setActiveTab("results");
              fetchSubmissions();
            }}
          />
        ) : (
          <>
            {activeTab === "generator" && (
              <ExamGenerator
                folders={folders}
                onTestSaved={() => {
                  fetchTests();
                  setActiveTab("history");
                }}
                onTakeTest={handleTakeTest}
                onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
                onOpenCurriculumDownloader={() => setIsCurriculumModalOpen(true)}
                currentTeacher={currentTeacher}
                onOpenAuthModal={handleOpenAuthModal}
              />
            )}

            {activeTab === "bank" && (
              <QuestionBankManager
                folders={folders}
                onRefreshFolders={fetchFolders}
                onOpenCurriculumDownloader={() => setIsCurriculumModalOpen(true)}
                onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
                currentTeacher={currentTeacher}
              />
            )}

            {activeTab === "results" && (
              <StudentResults
                submissions={submissions}
                onRefresh={fetchSubmissions}
                currentTeacher={currentTeacher}
                isIsolatedMode={isIsolatedMode}
              />
            )}

            {activeTab === "history" && (
              <ExamHistory
                tests={tests}
                onTakeTest={handleTakeTest}
                onDeleteTest={handleDeleteTest}
                currentTeacher={currentTeacher}
                isIsolatedMode={isIsolatedMode}
              />
            )}
          </>
        )}
      </main>

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onCreatedTest={handleAiCommandCreatedTest}
        onDownloadedBank={handleAiCommandDownloadedBank}
        currentTeacher={currentTeacher}
      />

      {/* Curriculum Bank Downloader Modal */}
      <CurriculumBankDownloaderModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
        onSuccess={() => {
          fetchFolders();
          setActiveTab("bank");
        }}
        currentTeacher={currentTeacher}
      />

      {/* Teacher Authentication & Profile Modal */}
      <TeacherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentTeacher={currentTeacher}
        teachers={teachers}
        onSelectTeacher={handleSelectTeacher}
        onRefreshTeachers={fetchTeachers}
        mode={authModalMode}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Hệ Thống Khảo Thí & Tạo Đề Thi Trực Tuyến Chuẩn SGK Bộ GD&ĐT (Lớp 1 - 12)
        </p>
        <p className="mt-1">
          Bảo mật phân quyền giáo viên theo khối • Hỗ trợ bóc tách đề cương AI (Word, PDF, Camera) • Xuất bản PDF in ấn • Chấm bài tự luận 4.0
        </p>
      </footer>
    </div>
  );
}

export default App;
