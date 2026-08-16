export interface MultipleChoiceQ {
  question: string;
  options: string[];
  answer: string;
  translation?: string;
  explanation?: string;
  cognitiveLevel?: "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";
  topic?: string;
}

export interface EssayQ {
  question: string;
  answer: string;
  translation?: string;
  maxScore?: number;
  rubric?: string;
  cognitiveLevel?: "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";
}

export interface TestQuestions {
  mc: MultipleChoiceQ[];
  es: EssayQ[];
}

export interface TeacherProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  schoolName: string;
  level: "Tiểu học" | "THCS" | "THPT";
  primaryGrade: string;
  assignedGrades: string[];
  primarySubject: string;
  assignedSubjects: string[];
  avatarColor?: string;
  pinCode?: string;
  role?: "teacher" | "head_of_department" | "admin";
  created_at?: string;
}

export interface TestRecord {
  id: string;
  title: string;
  subject: string;
  grade: string;
  semester: string;
  academicYear?: string;
  textbook?: string;
  period?: string;
  sourceType?: "bank_repository" | "ai_custom" | "folder" | "file_extract";
  duration: number;
  questions: TestQuestions;
  created_at: string;
  schoolName?: string;
  teacherName?: string;
  teacherId?: string;
  isSecret?: boolean;
}

export interface SubmissionRecord {
  id: string;
  test_id: string;
  student_name: string;
  student_class?: string;
  student_id_num?: string;
  answers: Record<string, string>;
  score: number;
  total_questions: number;
  correct_count?: number;
  submitted_at: string;
  grade?: string;
  subject?: string;
  test_title?: string;
  teacherId?: string;
  ai_graded?: boolean;
  ai_feedback?: string[];
  aiFeedback?: string;
  teacher_score?: number;
  teacher_comment?: string;
  status?: "pending" | "graded" | "reviewed";
}

export interface FolderRecord {
  id: number;
  name: string;
  note: string;
  academicYear?: string;
  textbook?: string;
  subject?: string;
  grade?: string;
  period?: string;
  level?: "Tiểu học" | "THCS" | "THPT";
  teacherId?: string;
  isSystemShared?: boolean;
  created_at: string;
  questions: {
    "Multiple Choice": MultipleChoiceQ[];
    Essay: EssayQ[];
  };
}

export const ACADEMIC_YEARS = [
  "Năm học 2026 - 2027",
  "Năm học 2025 - 2026",
  "Năm học 2024 - 2025",
  "Năm học 2023 - 2024",
];

export const GRADES = [
  "Lớp 1",
  "Lớp 2",
  "Lớp 3",
  "Lớp 4",
  "Lớp 5",
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9",
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
];

export const GRADE_LEVELS: Record<string, "Tiểu học" | "THCS" | "THPT"> = {
  "Lớp 1": "Tiểu học",
  "Lớp 2": "Tiểu học",
  "Lớp 3": "Tiểu học",
  "Lớp 4": "Tiểu học",
  "Lớp 5": "Tiểu học",
  "Lớp 6": "THCS",
  "Lớp 7": "THCS",
  "Lớp 8": "THCS",
  "Lớp 9": "THCS",
  "Lớp 10": "THPT",
  "Lớp 11": "THPT",
  "Lớp 12": "THPT",
};

// Official Subjects by Educational Level according to MoET
export const SUBJECTS_BY_LEVEL: Record<"Tiểu học" | "THCS" | "THPT", string[]> = {
  "Tiểu học": [
    "Toán",
    "Tiếng Việt",
    "Tiếng Anh",
    "Tự nhiên và Xã hội",
    "Khoa học",
    "Lịch sử và Địa lí",
    "Đạo đức",
    "Tin học và Công nghệ",
    "Âm nhạc",
    "Mĩ thuật",
    "Hoạt động trải nghiệm",
  ],
  "THCS": [
    "Toán",
    "Ngữ văn",
    "Tiếng Anh",
    "Khoa học tự nhiên",
    "Lịch sử và Địa lí",
    "Giáo dục công dân",
    "Tin học",
    "Công nghệ",
    "Âm nhạc",
    "Mĩ thuật",
    "Hoạt động trải nghiệm, hướng nghiệp",
  ],
  "THPT": [
    "Toán",
    "Ngữ văn",
    "Tiếng Anh",
    "Vật lí",
    "Hóa học",
    "Sinh học",
    "Lịch sử",
    "Địa lí",
    "Giáo dục kinh tế và pháp luật",
    "Tin học",
    "Công nghệ",
    "Hoạt động trải nghiệm, hướng nghiệp",
  ],
};

export const SUBJECTS: string[] = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Tiếng Việt",
  "Vật lí",
  "Hóa học",
  "Sinh học",
  "Khoa học tự nhiên",
  "Lịch sử",
  "Địa lí",
  "Lịch sử và Địa lí",
  "Tự nhiên và Xã hội",
  "Khoa học",
  "Giáo dục công dân",
  "Giáo dục kinh tế và pháp luật",
  "Tin học",
  "Công nghệ",
  "Tin học và Công nghệ",
  "Đạo đức",
  "Âm nhạc",
  "Mĩ thuật",
];

export const TEXTBOOKS = [
  "Bộ sách Kết nối tri thức với cuộc sống",
  "Bộ sách Cánh Diều",
  "Bộ sách Chân trời sáng tạo",
  "Bộ sách Cùng học để phát triển năng lực",
  "Chương trình GDPT Chuẩn Bộ GD&ĐT 2018",
];

export const EXAM_PERIODS = [
  "Kiểm tra thường xuyên / 15 phút",
  "Kiểm tra định kỳ 1 tiết (45 phút)",
  "Kiểm tra đánh giá Giữa Học Kỳ 1",
  "Kiểm tra đánh giá Cuối Học Kỳ 1",
  "Kiểm tra đánh giá Giữa Học Kỳ 2",
  "Kiểm tra đánh giá Cuối Học Kỳ 2 (Cuối năm)",
  "Khảo sát chất lượng đầu năm học",
  "Ôn thi Tuyển sinh vào Lớp 10",
  "Ôn thi Tốt nghiệp THPT & ĐGNL",
  "Khảo sát năng lực / Học sinh giỏi cấp trường",
];

export const SEMESTERS = ["Học kỳ 1", "Học kỳ 2", "Cả năm"];

export interface StandardExamPreset {
  id: string;
  category: string;
  name: string;
  shortBadge: string;
  semester: "Học kỳ 1" | "Học kỳ 2" | "Cả năm";
  applicableLevels: ("Tiểu học" | "THCS" | "THPT")[];
  defaultDurationByLevel: Record<"Tiểu học" | "THCS" | "THPT", number>;
  defaultQuestionsByLevel: Record<"Tiểu học" | "THCS" | "THPT", { mc: number; es: number; mcRatio: number }>;
  description: string;
  moetStandard: string;
  suggestedTitlePattern: string;
}

export const STANDARD_EXAM_PRESETS: StandardExamPreset[] = [
  {
    id: "preset_15m",
    category: "Kiểm tra thường xuyên / 15 phút",
    name: "Kiểm tra Đánh giá Thường Xuyên (15 Phút)",
    shortBadge: "15 Phút",
    semester: "Học kỳ 1",
    applicableLevels: ["Tiểu học", "THCS", "THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 15,
      "THCS": 15,
      "THPT": 15,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 8, es: 1, mcRatio: 90 },
      "THCS": { mc: 10, es: 1, mcRatio: 90 },
      "THPT": { mc: 12, es: 1, mcRatio: 90 },
    },
    description: "Đánh giá nhanh kiến thức trọng tâm của 1 - 2 bài học, kiểm tra mức độ ghi nhớ và hiểu bài.",
    moetStandard: "Thông tư 22/2021 & TT 27/2020 - Hệ số 1",
    suggestedTitlePattern: "Kiểm tra 15 phút - {subject} {grade}",
  },
  {
    id: "preset_45m",
    category: "Kiểm tra định kỳ 1 tiết (45 phút)",
    name: "Kiểm tra Định Kỳ 1 Tiết (Chương / Chủ Đề)",
    shortBadge: "1 Tiết (45p)",
    semester: "Học kỳ 1",
    applicableLevels: ["Tiểu học", "THCS", "THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 35,
      "THCS": 45,
      "THPT": 45,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 10, es: 2, mcRatio: 70 },
      "THCS": { mc: 14, es: 2, mcRatio: 70 },
      "THPT": { mc: 16, es: 2, mcRatio: 70 },
    },
    description: "Đánh giá tổng kết sau khi kết thúc 1 chương hoặc 1 chủ đề kiến thức lớn theo chuẩn SGK mới.",
    moetStandard: "Thông tư 22/2021 & TT 27/2020 - Hệ số 1 hoặc 2",
    suggestedTitlePattern: "Kiểm tra định kỳ 1 tiết - {subject} {grade}",
  },
  {
    id: "preset_midterm_1",
    category: "Kiểm tra đánh giá Giữa Học Kỳ 1",
    name: "Kiểm tra Đánh Giá Giữa Học Kỳ 1 (GHK1)",
    shortBadge: "Giữa Kỳ 1",
    semester: "Học kỳ 1",
    applicableLevels: ["Tiểu học", "THCS", "THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 40,
      "THCS": 60,
      "THPT": 60,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 10, es: 2, mcRatio: 70 },
      "THCS": { mc: 18, es: 3, mcRatio: 70 },
      "THPT": { mc: 20, es: 3, mcRatio: 70 },
    },
    description: "Bài kiểm tra định kỳ chính thức giữa kỳ 1 theo ma trận 4 mức độ: 40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao.",
    moetStandard: "Quy định Bộ GD&ĐT - Hệ số 2 (ĐGNĐK)",
    suggestedTitlePattern: "Đề kiểm tra đánh giá Giữa Học Kỳ 1 - Môn {subject} {grade}",
  },
  {
    id: "preset_final_1",
    category: "Kiểm tra đánh giá Cuối Học Kỳ 1",
    name: "Kiểm tra Đánh Giá Cuối Học Kỳ 1 (CHK1)",
    shortBadge: "Cuối Kỳ 1",
    semester: "Học kỳ 1",
    applicableLevels: ["Tiểu học", "THCS", "THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 40,
      "THCS": 60,
      "THPT": 90,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 12, es: 2, mcRatio: 70 },
      "THCS": { mc: 20, es: 3, mcRatio: 70 },
      "THPT": { mc: 25, es: 3, mcRatio: 70 },
    },
    description: "Đánh giá toàn diện kiến thức học kỳ 1, bao quát toàn bộ nội dung SGK nửa đầu năm học.",
    moetStandard: "Quy định Bộ GD&ĐT - Hệ số 3 (ĐGCK)",
    suggestedTitlePattern: "Đề kiểm tra đánh giá Cuối Học Kỳ 1 - Môn {subject} {grade}",
  },
  {
    id: "preset_midterm_2",
    category: "Kiểm tra đánh giá Giữa Học Kỳ 2",
    name: "Kiểm tra Đánh Giá Giữa Học Kỳ 2 (GHK2)",
    shortBadge: "Giữa Kỳ 2",
    semester: "Học kỳ 2",
    applicableLevels: ["Tiểu học", "THCS", "THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 40,
      "THCS": 60,
      "THPT": 60,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 10, es: 2, mcRatio: 70 },
      "THCS": { mc: 18, es: 3, mcRatio: 70 },
      "THPT": { mc: 20, es: 3, mcRatio: 70 },
    },
    description: "Bài kiểm tra trọng tâm nửa đầu học kỳ 2 bám sát chuẩn kiến thức kỹ năng GDPT mới.",
    moetStandard: "Quy định Bộ GD&ĐT - Hệ số 2 (ĐGNĐK)",
    suggestedTitlePattern: "Đề kiểm tra đánh giá Giữa Học Kỳ 2 - Môn {subject} {grade}",
  },
  {
    id: "preset_final_2",
    category: "Kiểm tra đánh giá Cuối Học Kỳ 2 (Cuối năm)",
    name: "Kiểm tra Đánh Giá Cuối Học Kỳ 2 & Tổng Kết Năm",
    shortBadge: "Cuối Năm (HK2)",
    semester: "Học kỳ 2",
    applicableLevels: ["Tiểu học", "THCS", "THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 40,
      "THCS": 60,
      "THPT": 90,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 12, es: 2, mcRatio: 70 },
      "THCS": { mc: 22, es: 3, mcRatio: 70 },
      "THPT": { mc: 25, es: 3, mcRatio: 70 },
    },
    description: "Bài kiểm tra then chốt tổng kết toàn bộ năm học, xét phân loại học sinh cuối năm.",
    moetStandard: "Quy định Bộ GD&ĐT - Hệ số 3 (ĐGCK)",
    suggestedTitlePattern: "Đề kiểm tra đánh giá Cuối Học Kỳ 2 (Cuối năm) - {subject} {grade}",
  },
  {
    id: "preset_survey",
    category: "Khảo sát chất lượng đầu năm học",
    name: "Khảo Sát Chất Lượng Đầu Năm Học",
    shortBadge: "Khảo Sát Đầu Năm",
    semester: "Học kỳ 1",
    applicableLevels: ["Tiểu học", "THCS", "THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 35,
      "THCS": 45,
      "THPT": 45,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 10, es: 1, mcRatio: 80 },
      "THCS": { mc: 15, es: 2, mcRatio: 70 },
      "THPT": { mc: 20, es: 2, mcRatio: 80 },
    },
    description: "Đánh giá mặt bằng kiến thức ban đầu của học sinh để phân loại và xây dựng kế hoạch dạy học phù hợp.",
    moetStandard: "Khảo sát chuyên môn cấp trường",
    suggestedTitlePattern: "Đề khảo sát chất lượng đầu năm - {subject} {grade}",
  },
  {
    id: "preset_entrance_10",
    category: "Ôn thi Tuyển sinh vào Lớp 10",
    name: "Đề Ôn Thi & Khảo Sát Tuyển Sinh Vào Lớp 10",
    shortBadge: "Thi Vào 10",
    semester: "Cả năm",
    applicableLevels: ["THCS"],
    defaultDurationByLevel: {
      "Tiểu học": 45,
      "THCS": 90,
      "THPT": 90,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 15, es: 2, mcRatio: 70 },
      "THCS": { mc: 25, es: 4, mcRatio: 60 },
      "THPT": { mc: 30, es: 4, mcRatio: 60 },
    },
    description: "Cấu trúc đề thi thử vào Lớp 10 THPT công lập chuẩn theo định dạng Sở GD&ĐT (đặc biệt Lớp 9).",
    moetStandard: "Cấu trúc đề thi Sở GD&ĐT",
    suggestedTitlePattern: "Đề thi thử Tuyển sinh vào Lớp 10 THPT - Môn {subject}",
  },
  {
    id: "preset_graduation_thpt",
    category: "Ôn thi Tốt nghiệp THPT & ĐGNL",
    name: "Đề Thi Thử Tốt Nghiệp THPT & ĐGNL (Mẫu Mới Bộ GD&ĐT)",
    shortBadge: "Tốt Nghiệp THPT",
    semester: "Cả năm",
    applicableLevels: ["THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 45,
      "THCS": 60,
      "THPT": 50, // 50 phút với trắc nghiệm Toán, KHTN, KHXH hoặc 120p Văn
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 15, es: 2, mcRatio: 80 },
      "THCS": { mc: 25, es: 3, mcRatio: 70 },
      "THPT": { mc: 28, es: 3, mcRatio: 75 },
    },
    description: "Đề thi chuẩn cấu trúc mới của Bộ GD&ĐT từ 2025: Trắc nghiệm nhiều lựa chọn, Trắc nghiệm Đúng/Sai, Trả lời ngắn & Tự luận.",
    moetStandard: "Định dạng đề thi Tốt nghiệp THPT Quốc Gia",
    suggestedTitlePattern: "Đề thi thử Tốt nghiệp THPT Quốc Gia - Môn {subject}",
  },
  {
    id: "preset_olympiad",
    category: "Khảo sát năng lực / Học sinh giỏi cấp trường",
    name: "Khảo Sát Năng Lực / Bồi Dưỡng Học Sinh Giỏi",
    shortBadge: "Học Sinh Giỏi",
    semester: "Cả năm",
    applicableLevels: ["Tiểu học", "THCS", "THPT"],
    defaultDurationByLevel: {
      "Tiểu học": 45,
      "THCS": 90,
      "THPT": 90,
    },
    defaultQuestionsByLevel: {
      "Tiểu học": { mc: 12, es: 3, mcRatio: 50 },
      "THCS": { mc: 15, es: 4, mcRatio: 50 },
      "THPT": { mc: 18, es: 4, mcRatio: 50 },
    },
    description: "Tuyển chọn và bồi dưỡng học sinh có năng khiếu, tư duy phản biện và vận dụng sáng tạo chuyên sâu.",
    moetStandard: "Kỳ thi HSG cấp Trường / Cụm / Huyện",
    suggestedTitlePattern: "Đề thi chọn Học sinh giỏi / Năng khiếu - Môn {subject} {grade}",
  },
];

export type SubjectName = string;
