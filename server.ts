import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory data store with JSON persistence fallback
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, "db.json");

interface MultipleChoiceQ {
  question: string;
  options: string[];
  answer: string;
  translation?: string;
  explanation?: string;
  cognitiveLevel?: "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";
  topic?: string;
}

interface EssayQ {
  question: string;
  answer: string;
  translation?: string;
  maxScore?: number;
  rubric?: string;
  cognitiveLevel?: "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";
}

interface TestQuestions {
  mc: MultipleChoiceQ[];
  es: EssayQ[];
}

interface TeacherProfile {
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

interface TestRecord {
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

interface SubmissionRecord {
  id: string;
  test_id: string;
  student_name: string;
  student_class?: string;
  student_id_num?: string;
  answers: Record<string, string>;
  score: number;
  total_questions: number;
  submitted_at: string;
  grade?: string;
  subject?: string;
  test_title?: string;
  teacherId?: string;
  ai_graded?: boolean;
  ai_feedback?: string[];
  teacher_score?: number;
  teacher_comment?: string;
  status?: "pending" | "graded" | "reviewed";
}

interface FolderRecord {
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

interface DatabaseSchema {
  teachers: TeacherProfile[];
  tests: TestRecord[];
  submissions: SubmissionRecord[];
  folders: FolderRecord[];
}

// Initial Pre-configured Teachers across all levels and grades
const initialTeachers: TeacherProfile[] = [
  {
    id: "gv_toan10_thpt",
    username: "thayan_toan10",
    name: "Thầy Nguyễn Văn An",
    schoolName: "Trường THPT Chuyên Chuẩn Quốc Gia",
    level: "THPT",
    primaryGrade: "Lớp 10",
    assignedGrades: ["Lớp 10", "Lớp 11", "Lớp 12"],
    primarySubject: "Toán",
    assignedSubjects: ["Toán"],
    avatarColor: "from-blue-600 to-indigo-600",
    pinCode: "123456",
    role: "teacher",
    created_at: new Date().toISOString(),
  },
  {
    id: "gv_van9_thcs",
    username: "coha_van9",
    name: "Cô Trần Thu Hà",
    schoolName: "Trường THCS Chu Văn An",
    level: "THCS",
    primaryGrade: "Lớp 9",
    assignedGrades: ["Lớp 8", "Lớp 9"],
    primarySubject: "Ngữ văn",
    assignedSubjects: ["Ngữ văn"],
    avatarColor: "from-purple-600 to-pink-600",
    pinCode: "123456",
    role: "teacher",
    created_at: new Date().toISOString(),
  },
  {
    id: "gv_tienganh12_thpt",
    username: "comai_anh12",
    name: "Cô Lê Thanh Mai",
    schoolName: "Trường THPT Chuyên Chuẩn Quốc Gia",
    level: "THPT",
    primaryGrade: "Lớp 12",
    assignedGrades: ["Lớp 10", "Lớp 11", "Lớp 12"],
    primarySubject: "Tiếng Anh",
    assignedSubjects: ["Tiếng Anh"],
    avatarColor: "from-emerald-600 to-teal-600",
    pinCode: "123456",
    role: "teacher",
    created_at: new Date().toISOString(),
  },
  {
    id: "gv_khtn7_thcs",
    username: "thayduc_khtn7",
    name: "Thầy Phạm Minh Đức",
    schoolName: "Trường THCS Lê Quý Đôn",
    level: "THCS",
    primaryGrade: "Lớp 7",
    assignedGrades: ["Lớp 6", "Lớp 7", "Lớp 8"],
    primarySubject: "Khoa học tự nhiên",
    assignedSubjects: ["Khoa học tự nhiên", "Tin học"],
    avatarColor: "from-teal-600 to-cyan-600",
    pinCode: "123456",
    role: "teacher",
    created_at: new Date().toISOString(),
  },
  {
    id: "gv_lop3_tieuhoc",
    username: "congoc_lop3",
    name: "Cô Nguyễn Bích Ngọc",
    schoolName: "Trường Tiểu Học Nguyễn Huệ",
    level: "Tiểu học",
    primaryGrade: "Lớp 3",
    assignedGrades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"],
    primarySubject: "Toán",
    assignedSubjects: ["Toán", "Tiếng Việt", "Tự nhiên và Xã hội"],
    avatarColor: "from-rose-500 to-amber-500",
    pinCode: "123456",
    role: "teacher",
    created_at: new Date().toISOString(),
  },
  {
    id: "gv_vatli11_thpt",
    username: "thaybao_ly11",
    name: "Thầy Hoàng Quốc Bảo",
    schoolName: "Trường THPT Nguyễn Thị Minh Khai",
    level: "THPT",
    primaryGrade: "Lớp 11",
    assignedGrades: ["Lớp 10", "Lớp 11", "Lớp 12"],
    primarySubject: "Vật lí",
    assignedSubjects: ["Vật lí"],
    avatarColor: "from-indigo-600 to-violet-600",
    pinCode: "123456",
    role: "teacher",
    created_at: new Date().toISOString(),
  },
];

// Initial Standard Repositories for 2026-2027
const initialFolders: FolderRecord[] = [
  {
    id: 1,
    name: "SGK Kết nối tri thức - Toán 10 (Năm học 2026 - 2027)",
    note: "Ngân hàng chuẩn SGK: Mệnh đề, Tập hợp, Bất phương trình bậc nhất hai ẩn, Hàm số bậc hai",
    academicYear: "Năm học 2026 - 2027",
    textbook: "Bộ sách Kết nối tri thức với cuộc sống",
    subject: "Toán",
    grade: "Lớp 10",
    period: "Kiểm tra định kỳ Giữa Học Kỳ 1",
    level: "THPT",
    isSystemShared: true,
    teacherId: "gv_toan10_thpt",
    created_at: new Date().toISOString(),
    questions: {
      "Multiple Choice": [
        {
          question: "Trong các câu sau, câu nào là mệnh đề toán học?",
          options: [
            "Hôm nay thời tiết đẹp quá!",
            "Số 17 là một số nguyên tố.",
            "Bạn đã ôn tập xong bài chưa?",
            "Hãy làm bài thật cẩn thận nhé!"
          ],
          answer: "Số 17 là một số nguyên tố.",
          explanation: "Mệnh đề là câu khẳng định có tính đúng hoặc sai rõ ràng. 'Số 17 là số nguyên tố' là mệnh đề đúng.",
          cognitiveLevel: "Nhận biết",
          topic: "Mệnh đề & Tập hợp"
        },
        {
          question: "Cho tập hợp A = {x ∈ ℝ | x² - 9 = 0}. Tập hợp A viết dưới dạng liệt kê phần tử là:",
          options: ["{3}", "{-3}", "{-3; 3}", "{9}"],
          answer: "{-3; 3}",
          explanation: "Phương trình x² - 9 = 0 có hai nghiệm phân biệt là x = 3 và x = -3.",
          cognitiveLevel: "Thông hiểu",
          topic: "Mệnh đề & Tập hợp"
        },
        {
          question: "Cặp số nào sau đây là một nghiệm của bất phương trình bậc nhất hai ẩn: 2x - 3y + 6 > 0?",
          options: ["(0; 3)", "(1; 1)", "(-4; 0)", "(0; 5)"],
          answer: "(1; 1)",
          explanation: "Thay x = 1, y = 1 vào biểu thức: 2(1) - 3(1) + 6 = 5 > 0 (Thỏa mãn).",
          cognitiveLevel: "Thông hiểu",
          topic: "Bất phương trình bậc nhất hai ẩn"
        },
        {
          question: "Cho tam giác ABC có a = 8, b = 6, góc C = 60°. Độ dài cạnh c tính theo định lí cosin là:",
          options: ["2√13", "2√37", "52", "10"],
          answer: "2√13",
          explanation: "c² = a² + b² - 2ab.cos(C) = 64 + 36 - 2(8)(6)(1/2) = 52 => c = √52 = 2√13.",
          cognitiveLevel: "Vận dụng",
          topic: "Hệ thức lượng trong tam giác"
        },
        {
          question: "Tập xác định của hàm số y = √(2x - 4) là:",
          options: ["[2; +∞)", "(2; +∞)", "(-∞; 2]", "ℝ \\ {2}"],
          answer: "[2; +∞)",
          explanation: "Điều kiện xác định: 2x - 4 ≥ 0 <=> x ≥ 2.",
          cognitiveLevel: "Nhận biết",
          topic: "Hàm số"
        }
      ],
      Essay: [
        {
          question: "Cho hai tập hợp A = [-3; 2) và B = [0; 5]. Hãy xác định các tập hợp sau: A ∩ B, A ∪ B, và A \\ B.",
          answer: "1. A ∩ B = [0; 2)\n2. A ∪ B = [-3; 5]\n3. A \\ B = [-3; 0)",
          cognitiveLevel: "Thông hiểu"
        },
        {
          question: "Một công ty sản xuất hai loại sản phẩm A và B. Để sản xuất 1 tấn sản phẩm A cần 2 giờ máy và 3 giờ nhân công. Để sản xuất 1 tấn sản phẩm B cần 4 giờ máy và 1 giờ nhân công. Biết tổng số giờ máy tối đa là 20 giờ và số giờ nhân công tối đa là 15 giờ. Lợi nhuận mỗi tấn loại A là 5 triệu đồng, loại B là 4 triệu đồng. Hãy lập hệ bất phương trình mô tả bài toán và tìm phương án sản xuất đạt lợi nhuận cao nhất.",
          answer: "Hệ BPT: 2x + 4y ≤ 20; 3x + y ≤ 15; x ≥ 0; y ≥ 0. Vẽ miền nghiệm đa giác xác định đỉnh (0;0), (5;0), (4;3), (0;5). Tính F(x,y) = 5x + 4y => Max F(4,3) = 32 triệu đồng khi sản xuất 4 tấn loại A và 3 tấn loại B.",
          cognitiveLevel: "Vận dụng cao"
        }
      ]
    }
  },
  {
    id: 2,
    name: "SGK Cánh Diều - Ngữ văn 9 (Năm học 2026 - 2027)",
    note: "Ngân hàng chuẩn SGK Cánh Diều: Thơ lục bát, Truyện Kiều, Nghị luận xã hội & Biện pháp tu từ",
    academicYear: "Năm học 2026 - 2027",
    textbook: "Bộ sách Cánh Diều",
    subject: "Ngữ văn",
    grade: "Lớp 9",
    period: "Kiểm tra đánh giá Giữa Học Kỳ 1",
    level: "THCS",
    isSystemShared: true,
    teacherId: "gv_van9_thcs",
    created_at: new Date().toISOString(),
    questions: {
      "Multiple Choice": [
        {
          question: "Trong đoạn trích 'Chị em Thúy Kiều' (Truyện Kiều - Nguyễn Du), vẻ đẹp của Thúy Vân được miêu tả mang đặc điểm gì?",
          options: [
            "Đoan trang, phúc hậu, vẻ đẹp hòa hợp với tự nhiên",
            "Sắc sảo, lộng lẫy, vượt trội thiên nhiên",
            "Trầm tư, u uất, dự báo nhiều sóng gió",
            "Hồn nhiên, mộc mạc, bình dị thôn quê"
          ],
          answer: "Đoan trang, phúc hậu, vẻ đẹp hòa hợp với tự nhiên",
          explanation: "'Khuôn trăng đầy đặn nét ngài nở nang / Hoa cười ngọc thốt đoan trang / Mây thua nước tóc tuyết nhường màu da'.",
          cognitiveLevel: "Nhận biết"
        },
        {
          question: "Nghệ thuật ước lệ tượng trưng trong văn học trung đại thường lấy hình ảnh nào làm chuẩn mực miêu tả vẻ đẹp con người?",
          options: [
            "Vẻ đẹp hoàn mĩ của thiên nhiên (thu thủy, xuân sơn, hoa, liễu...)",
            "Đời sống sinh hoạt của người lao động bình dị",
            "Các công trình kiến trúc cung đình đồ sộ",
            "Thế giới tâm linh và thần thoại kì bí"
          ],
          answer: "Vẻ đẹp hoàn mĩ của thiên nhiên (thu thủy, xuân sơn, hoa, liễu...)",
          explanation: "Bút pháp ước lệ trung đại thường lấy thiên nhiên làm thước đo cho vẻ đẹp con người.",
          cognitiveLevel: "Thông hiểu"
        },
        {
          question: "Phép liên kết nào được sử dụng chủ yếu trong việc nối tiếp các câu văn bằng các từ 'tuy nhiên', 'ngược lại', 'nhưng'?",
          options: ["Phép nối", "Phép lặp", "Phép thế", "Phép đồng nghĩa"],
          answer: "Phép nối",
          explanation: "Các quan hệ từ nối các vế câu và đoạn văn.",
          cognitiveLevel: "Nhận biết"
        }
      ],
      Essay: [
        {
          question: "Viết đoạn văn nghị luận (khoảng 200 chữ) trình bày suy nghĩ của em về lòng biết ơn trong cuộc sống của thế hệ trẻ hiện nay.",
          answer: "Yêu cầu: Nêu đúng vấn đề (Lòng biết ơn), giải thích ngắn gọn, phân tích ý nghĩa (nuôi dưỡng tâm hồn, gắn kết con người), dẫn chứng thực tế, phản biện thói vô ơn và rút ra bài học hành động thiết thực.",
          cognitiveLevel: "Vận dụng"
        }
      ]
    }
  },
  {
    id: 3,
    name: "SGK Chân trời sáng tạo - Toán 5 (Năm học 2026 - 2027)",
    note: "Ngân hàng chuẩn SGK Tiểu học: Số thập phân, Bốn phép tính với số thập phân, Hình học & Đo lường",
    academicYear: "Năm học 2026 - 2027",
    textbook: "Bộ sách Chân trời sáng tạo",
    subject: "Toán",
    grade: "Lớp 5",
    period: "Kiểm tra đánh giá Cuối Học Kỳ 1",
    level: "Tiểu học",
    isSystemShared: true,
    teacherId: "gv_lop3_tieuhoc",
    created_at: new Date().toISOString(),
    questions: {
      "Multiple Choice": [
        {
          question: "Chữ số 7 trong số thập phân 85,76 có giá trị là:",
          options: ["7/10 (bảy phần mười)", "7 đơn vị", "7/100 (bảy phần trăm)", "70"],
          answer: "7/10 (bảy phần mười)",
          explanation: "Chữ số đầu tiên sau dấu phẩy thuộc hàng phần mười.",
          cognitiveLevel: "Nhận biết"
        },
        {
          question: "Kết quả của phép tính: 24,5 × 0,1 là:",
          options: ["2,45", "245", "0,245", "24,50"],
          answer: "2,45",
          explanation: "Nhân một số với 0,1 tương đương dịch dấu phẩy sang trái 1 chữ số.",
          cognitiveLevel: "Thông hiểu"
        },
        {
          question: "Một mảnh đất hình chữ nhật có chiều dài 25m, chiều rộng 12m. Diện tích mảnh đất là:",
          options: ["300 m²", "74 m²", "150 m²", "3000 m²"],
          answer: "300 m²",
          explanation: "S = dài x rộng = 25 x 12 = 300 m².",
          cognitiveLevel: "Vận dụng"
        }
      ],
      Essay: [
        {
          question: "Một người đi xe máy khởi hành từ A lúc 7 giờ 30 phút và đến B lúc 9 giờ 15 phút. Trên đường người đó nghỉ giải lao 15 phút. Biết quãng đường AB dài 60 km. Tính vận tốc trung bình của người đi xe máy.",
          answer: "Thời gian đi thực tế = 9h15 - 7h30 - 15ph = 1h30ph = 1,5 giờ. Vận tốc = 60 : 1,5 = 40 km/giờ. Đáp số: 40 km/h.",
          cognitiveLevel: "Vận dụng"
        }
      ]
    }
  }
];

let db: DatabaseSchema = {
  teachers: initialTeachers,
  tests: [],
  submissions: [],
  folders: initialFolders,
};

// Load saved DB
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const loaded = JSON.parse(raw);
    db.teachers = loaded.teachers && loaded.teachers.length > 0 ? loaded.teachers : initialTeachers;
    db.tests = loaded.tests || [];
    db.submissions = loaded.submissions || [];
    db.folders = loaded.folders && loaded.folders.length > 0 ? loaded.folders : initialFolders;
  } catch (e) {
    console.warn("Could not read db.json, starting fresh", e);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save db", e);
  }
}

// Lazy Gemini API Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Teacher User Management APIs
app.get("/api/teachers", (_req, res) => {
  // Return list of teachers without exposing raw pinCode in public list
  const safeTeachers = db.teachers.map(({ pinCode, ...rest }) => ({
    ...rest,
    hasPin: !!pinCode,
  }));
  res.json(safeTeachers);
});

app.post("/api/teachers/login", (req, res) => {
  const { username, pinCode } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Vui lòng nhập tên đăng nhập hoặc mã giáo viên" });
  }

  const teacher = db.teachers.find(
    (t) => t.username.toLowerCase() === username.trim().toLowerCase() || t.id.toLowerCase() === username.trim().toLowerCase()
  );

  if (!teacher) {
    return res.status(404).json({ error: "Không tìm thấy tài khoản giáo viên này" });
  }

  if (teacher.pinCode && pinCode && teacher.pinCode !== pinCode.trim()) {
    return res.status(401).json({ error: "Mã bảo mật PIN không chính xác" });
  }

  res.json({
    success: true,
    teacher,
    message: `Đăng nhập thành công! Chào mừng ${teacher.name} (${teacher.level} - ${teacher.primarySubject})`,
  });
});

app.post("/api/teachers/register", (req, res) => {
  const {
    username,
    name,
    schoolName,
    level = "THPT",
    primaryGrade = "Lớp 10",
    primarySubject = "Toán",
    assignedGrades,
    assignedSubjects,
    pinCode = "123456",
    email,
    phone,
  } = req.body;

  if (!username || !name) {
    return res.status(400).json({ error: "Vui lòng nhập Tên đăng nhập và Họ tên Giáo viên" });
  }

  const exists = db.teachers.some((t) => t.username.toLowerCase() === username.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác" });
  }

  const newId = `gv_${Date.now().toString(36)}`;
  const newTeacher: TeacherProfile = {
    id: newId,
    username: username.trim().toLowerCase(),
    name: name.trim(),
    email: email ? email.trim() : undefined,
    phone: phone ? phone.trim() : undefined,
    schoolName: schoolName?.trim() || "TRƯỜNG CHUẨN QUỐC GIA",
    level,
    primaryGrade,
    assignedGrades: assignedGrades && assignedGrades.length > 0 ? assignedGrades : [primaryGrade],
    primarySubject,
    assignedSubjects: assignedSubjects && assignedSubjects.length > 0 ? assignedSubjects : [primarySubject],
    avatarColor: "from-blue-600 to-indigo-600",
    pinCode: pinCode.trim(),
    role: "teacher",
    created_at: new Date().toISOString(),
  };

  db.teachers.push(newTeacher);
  saveDb();
  res.status(201).json({ success: true, teacher: newTeacher });
});

app.put("/api/teachers/:id", (req, res) => {
  const teacher = db.teachers.find((t) => t.id === req.params.id);
  if (!teacher) return res.status(404).json({ error: "Không tìm thấy giáo viên" });

  const {
    name,
    schoolName,
    level,
    primaryGrade,
    assignedGrades,
    primarySubject,
    assignedSubjects,
    pinCode,
    email,
    phone,
  } = req.body;

  if (name) teacher.name = name.trim();
  if (schoolName) teacher.schoolName = schoolName.trim();
  if (level) teacher.level = level;
  if (primaryGrade) teacher.primaryGrade = primaryGrade;
  if (assignedGrades) teacher.assignedGrades = assignedGrades;
  if (primarySubject) teacher.primarySubject = primarySubject;
  if (assignedSubjects) teacher.assignedSubjects = assignedSubjects;
  if (pinCode) teacher.pinCode = pinCode.trim();
  if (email !== undefined) teacher.email = email;
  if (phone !== undefined) teacher.phone = phone;

  saveDb();
  res.json({ success: true, teacher });
});

// 3. Tests API (with teacher isolation, search & category filters)
app.get("/api/tests", (req, res) => {
  const { teacher_id, grade, subject, period, academicYear, semester, only_mine } = req.query;

  let list = db.tests;

  if (only_mine === "true" && teacher_id) {
    list = list.filter((t) => t.teacherId === teacher_id);
  }
  if (grade && grade !== "all") {
    list = list.filter((t) => !t.grade || t.grade === grade);
  }
  if (subject && subject !== "all") {
    list = list.filter((t) => !t.subject || t.subject.toLowerCase() === (subject as string).toLowerCase());
  }
  if (period && period !== "all") {
    list = list.filter((t) => !t.period || t.period.toLowerCase().includes((period as string).toLowerCase()));
  }
  if (academicYear && academicYear !== "all") {
    list = list.filter((t) => !t.academicYear || t.academicYear === academicYear);
  }

  res.json(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

app.get("/api/tests/:id", (req, res) => {
  const test = db.tests.find((t) => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: "Không tìm thấy đề thi này" });
  res.json(test);
});

app.post("/api/tests", (req, res) => {
  const {
    title,
    subject,
    grade,
    semester,
    academicYear,
    textbook,
    period,
    sourceType,
    duration,
    questions,
    schoolName,
    teacherName,
    teacherId,
    isSecret = false,
  } = req.body;

  const newId = Math.random().toString(36).substring(2, 10).toUpperCase();

  const newTest: TestRecord = {
    id: newId,
    title: title || `Đề thi ${subject} - ${grade}`,
    subject: subject || "Toán",
    grade: grade || "Lớp 10",
    semester: semester || "Học kỳ 1",
    academicYear: academicYear || "Năm học 2026 - 2027",
    textbook: textbook || "Bộ sách Kết nối tri thức với cuộc sống",
    period: period || "Kiểm tra định kỳ Giữa Học Kỳ 1",
    sourceType: sourceType || "ai_custom",
    duration: Number(duration) || 45,
    questions: questions || { mc: [], es: [] },
    created_at: new Date().toISOString(),
    schoolName: schoolName || "TRƯỜNG THCS / THPT CHUẨN QUỐC GIA",
    teacherName: teacherName || "Ban Khảo Thí & Chuyên Môn",
    teacherId: teacherId || "system",
    isSecret: Boolean(isSecret),
  };

  db.tests.unshift(newTest);
  saveDb();
  res.status(201).json(newTest);
});

// Batch Exam Generator Endpoint (Multiple Variants, Multiple Periods, Multiple Grades)
app.post("/api/tests/generate-batch", async (req, res) => {
  try {
    const {
      mode = "periods", // "periods" | "variants" | "grades"
      periods = [], // Array of period names
      variants = ["101", "102", "103", "104"], // Array of variant codes
      baseTestId,
      baseQuestions,
      grades = [],
      subject = "Toán",
      grade = "Lớp 10",
      academicYear = "Năm học 2026 - 2027",
      textbook = "Bộ sách Kết nối tri thức với cuộc sống",
      schoolName = "TRƯỜNG CHUẨN QUỐC GIA",
      teacherName = "Giáo viên Chuyên môn",
      teacherId = "system",
      isSecret = false,
      teacherProfile,
    } = req.body;

    const createdTests: TestRecord[] = [];
    const ai = getGeminiClient();

    // MODE 1: Generate Multiple Exam Variants (Mã đề 101, 102, 103, 104) with Question & Option Shuffling
    if (mode === "variants") {
      let sourceQuestions: TestQuestions = baseQuestions;
      let sourceTitle = `Đề thi ${subject} ${grade}`;
      let sourceDuration = 45;
      let sourcePeriod = "Kiểm tra định kỳ";

      if (!sourceQuestions && baseTestId) {
        const found = db.tests.find((t) => t.id === baseTestId);
        if (found) {
          sourceQuestions = found.questions;
          sourceTitle = found.title;
          sourceDuration = found.duration;
          sourcePeriod = found.period || sourcePeriod;
        }
      }

      if (!sourceQuestions || (sourceQuestions.mc.length === 0 && sourceQuestions.es.length === 0)) {
        return res.status(400).json({ error: "Không tìm thấy bộ câu hỏi nguồn để tạo mã đề hoán vị" });
      }

      for (const variantCode of variants) {
        // Deep copy MC questions
        const shuffledMC: MultipleChoiceQ[] = sourceQuestions.mc.map((q) => {
          // Shuffle options
          const optionsWithCorrect = q.options.map((opt) => ({
            text: opt,
            isCorrect: opt === q.answer,
          }));
          
          const shuffledOpts = [...optionsWithCorrect].sort(() => 0.5 - Math.random());
          const newCorrect = shuffledOpts.find((o) => o.isCorrect)?.text || q.answer;

          return {
            ...q,
            options: shuffledOpts.map((o) => o.text),
            answer: newCorrect,
          };
        });

        // Shuffle order of questions
        const finalMC = [...shuffledMC].sort(() => 0.5 - Math.random());
        const finalES = [...(sourceQuestions.es || [])];

        const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const cleanBaseTitle = sourceTitle.replace(/\[Mã đề \w+\]\s*/i, "");

        const newVariantTest: TestRecord = {
          id: newId,
          title: `[Mã đề ${variantCode}] ${cleanBaseTitle}`,
          subject,
          grade,
          semester: sourcePeriod.includes("Học kỳ 2") ? "Học kỳ 2" : "Học kỳ 1",
          academicYear,
          textbook,
          period: sourcePeriod,
          sourceType: "ai_custom",
          duration: sourceDuration,
          questions: {
            mc: finalMC,
            es: finalES,
          },
          created_at: new Date().toISOString(),
          schoolName,
          teacherName,
          teacherId,
          isSecret: Boolean(isSecret),
        };

        db.tests.unshift(newVariantTest);
        createdTests.push(newVariantTest);
      }
    } 
    // MODE 2: Generate Batch by Exam Periods (e.g., GHK1, CHK1, GHK2, CHK2, 15m, 1 Tiết)
    else if (mode === "periods") {
      const targetPeriods: string[] = periods.length > 0 ? periods : [
        "Kiểm tra thường xuyên / 15 phút",
        "Kiểm tra định kỳ 1 tiết (45 phút)",
        "Kiểm tra đánh giá Giữa Học Kỳ 1",
        "Kiểm tra đánh giá Cuối Học Kỳ 1",
        "Kiểm tra đánh giá Giữa Học Kỳ 2",
        "Kiểm tra đánh giá Cuối Học Kỳ 2 (Cuối năm)",
      ];

      for (const p of targetPeriods) {
        let periodDuration = 45;
        let numMC = 12;
        let numES = 2;
        let sem = "Học kỳ 1";

        if (p.includes("15 phút") || p.includes("thường xuyên")) {
          periodDuration = 15;
          numMC = 8;
          numES = 1;
        } else if (p.includes("1 tiết") || p.includes("45 phút")) {
          periodDuration = 45;
          numMC = 12;
          numES = 2;
        } else if (p.includes("Giữa Học Kỳ 1")) {
          periodDuration = 60;
          numMC = 16;
          numES = 2;
          sem = "Học kỳ 1";
        } else if (p.includes("Cuối Học Kỳ 1")) {
          periodDuration = 60;
          numMC = 18;
          numES = 3;
          sem = "Học kỳ 1";
        } else if (p.includes("Giữa Học Kỳ 2")) {
          periodDuration = 60;
          numMC = 16;
          numES = 2;
          sem = "Học kỳ 2";
        } else if (p.includes("Cuối Học Kỳ 2") || p.includes("Cuối năm")) {
          periodDuration = 60;
          numMC = 18;
          numES = 3;
          sem = "Học kỳ 2";
        } else if (p.includes("Tốt nghiệp") || p.includes("Tuyển sinh") || p.includes("ĐGNL")) {
          periodDuration = 90;
          numMC = 22;
          numES = 3;
          sem = "Cả năm";
        }

        // Try extracting from existing folders first or AI generate
        const matchingFolder = db.folders.find(
          (f) =>
            f.grade === grade &&
            f.subject?.toLowerCase() === subject.toLowerCase() &&
            (f.academicYear === academicYear || !f.academicYear)
        );

        let mcList: MultipleChoiceQ[] = [];
        let esList: EssayQ[] = [];

        if (matchingFolder && matchingFolder.questions?.["Multiple Choice"]?.length >= numMC) {
          mcList = [...matchingFolder.questions["Multiple Choice"]].sort(() => 0.5 - Math.random()).slice(0, numMC);
          esList = [...(matchingFolder.questions.Essay || [])].sort(() => 0.5 - Math.random()).slice(0, numES);
        } else if (ai) {
          try {
            const prompt = `Tạo đề thi chuẩn Bộ GD&ĐT cho môn ${subject}, ${grade} (${academicYear} - ${p}). Gồm ${numMC} câu trắc nghiệm 4 đáp án có lời giải chi tiết và ${numES} câu tự luận có thang điểm.`;
            const resp = await ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: prompt,
              config: {
                systemInstruction: `Bạn là Chuyên gia Khảo thí Quốc gia. Tạo đề thi chuẩn theo SGK ${textbook || "Bộ GD&ĐT"} cho ${subject} ${grade} - ${p}.`,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    mc: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          question: { type: Type.STRING },
                          options: { type: Type.ARRAY, items: { type: Type.STRING } },
                          answer: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                          cognitiveLevel: { type: Type.STRING },
                        },
                        required: ["question", "options", "answer"],
                      },
                    },
                    es: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          question: { type: Type.STRING },
                          answer: { type: Type.STRING },
                          cognitiveLevel: { type: Type.STRING },
                        },
                        required: ["question", "answer"],
                      },
                    },
                  },
                  required: ["mc", "es"],
                },
              },
            });
            const data = JSON.parse(resp.text || "{}");
            mcList = data.mc || [];
            esList = data.es || [];
          } catch (e) {
            console.error("AI batch item error:", e);
          }
        }

        // Fallback if empty
        if (mcList.length === 0) {
          mcList = [
            {
              question: `Khái niệm trọng tâm của môn ${subject} ${grade} trong kỳ "${p}" (${academicYear})?`,
              options: [
                "Vận dụng kiến thức cốt lõi và kỹ năng thực tiễn",
                "Học vẹt thụ động",
                "Chỉ ghi nhớ máy móc",
                "Không liên quan đến thực tế đời sống",
              ],
              answer: "Vận dụng kiến thức cốt lõi và kỹ năng thực tiễn",
              explanation: "Chuẩn kiến thức kỹ năng theo định hướng phát triển năng lực của Bộ GD&ĐT.",
              cognitiveLevel: "Thông hiểu",
            },
            {
              question: `Phương pháp học tập và giải quyết vấn đề hiệu quả môn ${subject} ${grade} là gì?`,
              options: [
                "Phân tích dữ liệu, suy luận logic và thực hành đều đặn",
                "Đoán mò không cần tư duy",
                "Học dồn trước ngày thi",
                "Bỏ qua các dạng bài vận dụng",
              ],
              answer: "Phân tích dữ liệu, suy luận logic và thực hành đều đặn",
              explanation: "Rèn luyện tư duy phản biện và năng lực tự học.",
              cognitiveLevel: "Vận dụng",
            }
          ];
          esList = [
            {
              question: `Trình bày tóm tắt nội dung trọng tâm môn ${subject} (${grade}) kỳ "${p}" và nêu 1 ví dụ thực tiễn.`,
              answer: "Nêu đúng định nghĩa, trình bày phương pháp giải và liên hệ thực tiễn.",
              cognitiveLevel: "Thông hiểu",
            }
          ];
        }

        const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const testTitle = `Đề ${p} - ${subject} ${grade} (${academicYear})`;

        const newBatchTest: TestRecord = {
          id: newId,
          title: testTitle,
          subject,
          grade,
          semester: sem,
          academicYear,
          textbook,
          period: p,
          sourceType: "ai_custom",
          duration: periodDuration,
          questions: {
            mc: mcList,
            es: esList,
          },
          created_at: new Date().toISOString(),
          schoolName,
          teacherName,
          teacherId,
          isSecret: Boolean(isSecret),
        };

        db.tests.unshift(newBatchTest);
        createdTests.push(newBatchTest);
      }
    }
    // MODE 3: Generate Batch by Multiple Assigned Grades (e.g. Lớp 10, Lớp 11, Lớp 12)
    else if (mode === "grades") {
      const targetGrades = grades.length > 0 ? grades : [grade];

      for (const grd of targetGrades) {
        const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const testTitle = `Đề kiểm tra đánh giá - ${subject} ${grd} (${academicYear})`;

        const newGradeTest: TestRecord = {
          id: newId,
          title: testTitle,
          subject,
          grade: grd,
          semester: "Học kỳ 1",
          academicYear,
          textbook,
          period: "Kiểm tra đánh giá Giữa Học Kỳ 1",
          sourceType: "ai_custom",
          duration: 45,
          questions: {
            mc: [
              {
                question: `Nội dung cốt lõi của chương trình ${subject} ${grd} (${academicYear}) là gì?`,
                options: [
                  "Làm chủ kiến thức cơ bản và phát triển phẩm chất, năng lực",
                  "Học thuộc máy móc",
                  "Chỉ học lý thuyết không làm bài tập",
                  "Học đối phó thi cử",
                ],
                answer: "Làm chủ kiến thức cơ bản và phát triển phẩm chất, năng lực",
                explanation: "Chuẩn theo chương trình GDPT 2018 của Bộ GD&ĐT.",
                cognitiveLevel: "Nhận biết",
              }
            ],
            es: [
              {
                question: `Trình bày phương pháp giải quyết một bài toán điển hình trong môn ${subject} ${grd}.`,
                answer: "Nêu các bước phân tích, lập luận logic và kết luận chính xác.",
                cognitiveLevel: "Thông hiểu",
              }
            ],
          },
          created_at: new Date().toISOString(),
          schoolName,
          teacherName,
          teacherId,
          isSecret: Boolean(isSecret),
        };

        db.tests.unshift(newGradeTest);
        createdTests.push(newGradeTest);
      }
    }

    saveDb();
    res.status(201).json({
      success: true,
      count: createdTests.length,
      tests: createdTests,
      message: `Đã tạo thành công ${createdTests.length} đề thi và lưu trữ an toàn vào Kho Đề Thi của Giáo viên!`,
    });
  } catch (err: any) {
    console.error("Batch exam generation error:", err);
    res.status(500).json({ error: err.message || "Lỗi khi tạo đề thi hàng loạt" });
  }
});

app.delete("/api/tests/:id", (req, res) => {
  db.tests = db.tests.filter((t) => t.id !== req.params.id);
  saveDb();
  res.json({ success: true });
});

// 4. Submissions API
app.get("/api/submissions", (req, res) => {
  const { test_id, teacher_id, grade, subject } = req.query;
  let list = db.submissions;

  if (test_id) {
    list = list.filter((s) => s.test_id === test_id);
  }

  const enriched = list.map((s) => {
    const matchedTest = db.tests.find((t) => t.id === s.test_id);
    return {
      ...s,
      test_title: matchedTest?.title || s.test_title || "Đề thi đã lưu",
      grade: matchedTest?.grade || s.grade || "Khối chung",
      subject: matchedTest?.subject || "Tổng hợp",
      teacherId: matchedTest?.teacherId || s.teacherId,
    };
  });

  let filtered = enriched;
  if (teacher_id) {
    filtered = filtered.filter((s) => !s.teacherId || s.teacherId === teacher_id || s.teacherId === "system");
  }
  if (grade) {
    filtered = filtered.filter((s) => s.grade === grade);
  }
  if (subject) {
    filtered = filtered.filter((s) => s.subject?.toLowerCase() === (subject as string).toLowerCase());
  }

  res.json(filtered.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()));
});

app.post("/api/submissions", (req, res) => {
  const { test_id, student_name, student_class, student_id_num, answers } = req.body;
  if (!test_id || !student_name) {
    return res.status(400).json({ error: "Thiếu thông tin nộp bài" });
  }

  const matchedTest = db.tests.find((t) => t.id === test_id);
  if (!matchedTest) {
    return res.status(404).json({ error: "Không tìm thấy đề thi" });
  }

  const mcList = matchedTest.questions?.mc || [];
  const esList = matchedTest.questions?.es || [];
  const totalQuestions = mcList.length + esList.length;

  let correctCount = 0;
  mcList.forEach((q, idx) => {
    if (answers && answers[`mc_${idx}`] === q.answer) {
      correctCount++;
    }
  });

  const mcWeight = totalQuestions > 0 ? (mcList.length / totalQuestions) * 10 : 10;
  const initialScore = mcList.length > 0 ? (correctCount / mcList.length) * mcWeight : 0;
  const roundedScore = Math.round(initialScore * 100) / 100;

  const newSub: SubmissionRecord = {
    id: Math.random().toString(36).substring(2, 10),
    test_id,
    student_name: student_name.trim(),
    student_class: student_class || "",
    student_id_num: student_id_num || "",
    answers: answers || {},
    score: roundedScore,
    total_questions: totalQuestions,
    submitted_at: new Date().toISOString(),
    grade: matchedTest.grade,
    subject: matchedTest.subject,
    test_title: matchedTest.title,
    teacherId: matchedTest.teacherId,
    status: esList.length > 0 ? "pending" : "graded",
  };

  db.submissions.unshift(newSub);
  saveDb();
  res.status(201).json(newSub);
});

app.patch("/api/submissions/:id/score", (req, res) => {
  const { score, teacher_score, teacher_comment } = req.body;
  const sub = db.submissions.find((s) => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: "Không tìm thấy bài làm" });

  if (score !== undefined) sub.score = Number(score);
  if (teacher_score !== undefined) sub.teacher_score = Number(teacher_score);
  if (teacher_comment !== undefined) sub.teacher_comment = teacher_comment;
  sub.status = "graded";
  saveDb();
  res.json(sub);
});

app.delete("/api/submissions/:id", (req, res) => {
  db.submissions = db.submissions.filter((s) => s.id !== req.params.id);
  saveDb();
  res.json({ success: true });
});

// 5. Folders API
app.get("/api/folders", (req, res) => {
  const { teacher_id, level, grade, subject } = req.query;
  let list = db.folders;

  if (level) {
    list = list.filter((f) => !f.level || f.level === level);
  }
  if (grade) {
    list = list.filter((f) => !f.grade || f.grade === grade);
  }
  if (subject) {
    list = list.filter((f) => !f.subject || f.subject.toLowerCase() === (subject as string).toLowerCase());
  }

  res.json(list);
});

app.post("/api/folders", (req, res) => {
  const { name, note, textbook, subject, grade, academicYear, period, level, teacherId } = req.body;
  if (!name) return res.status(400).json({ error: "Tên thư mục không được để trống" });

  const newFolder: FolderRecord = {
    id: Date.now(),
    name,
    note: note || "",
    academicYear: academicYear || "Năm học 2026 - 2027",
    textbook: textbook || "",
    subject: subject || "",
    grade: grade || "",
    period: period || "",
    level: level || "THPT",
    teacherId: teacherId || "system",
    created_at: new Date().toISOString(),
    questions: {
      "Multiple Choice": [],
      Essay: [],
    },
  };

  db.folders.unshift(newFolder);
  saveDb();
  res.status(201).json(newFolder);
});

app.delete("/api/folders/:id", (req, res) => {
  const fId = Number(req.params.id);
  db.folders = db.folders.filter((f) => f.id !== fId);
  saveDb();
  res.json({ success: true });
});

app.get("/api/folders/:id/questions", (req, res) => {
  const fId = Number(req.params.id);
  const folder = db.folders.find((f) => f.id === fId);
  if (!folder) return res.status(404).json({ error: "Không tìm thấy thư mục" });
  res.json(folder.questions);
});

app.post("/api/folders/:id/questions", (req, res) => {
  const fId = Number(req.params.id);
  const folder = db.folders.find((f) => f.id === fId);
  if (!folder) return res.status(404).json({ error: "Không tìm thấy thư mục" });

  const { questions } = req.body;
  if (questions) {
    const mc = questions["Multiple Choice"] || questions.mc || [];
    const es = questions.Essay || questions.es || [];
    folder.questions["Multiple Choice"].push(...mc);
    folder.questions.Essay.push(...es);
    saveDb();
  }
  res.json({ success: true, count: folder.questions });
});

// 6. AI Question Generation & Extraction (Gemini)
app.post("/api/ai/generate-questions", async (req, res) => {
  try {
    const {
      text,
      imageBase64,
      mimeType,
      numQuestions = 10,
      subject = "Tổng hợp",
      grade = "Khối chung",
      academicYear = "Năm học 2026 - 2027",
      textbook,
      period,
      teacherProfile,
    } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        "Multiple Choice": [
          {
            question: `[SGK ${textbook || "Chuẩn Bộ GD&ĐT"}] Khái niệm cốt lõi trong môn ${subject} (${grade} - ${academicYear}) là gì?`,
            options: [
              "Nắm vững nguyên lý khoa học và vận dụng vào thực tiễn",
              "Học vẹt không cần hiểu bản chất",
              "Ghi nhớ ngẫu nhiên các sự kiện",
              "Không liên quan đến đời sống hàng ngày"
            ],
            answer: "Nắm vững nguyên lý khoa học và vận dụng vào thực tiễn",
            explanation: "Chương trình GDPT mới chú trọng phát triển phẩm chất và năng lực giải quyết vấn đề.",
            cognitiveLevel: "Nhận biết"
          }
        ],
        Essay: [
          {
            question: `Trình bày ý nghĩa thực tiễn của một bài học trọng tâm trong chương trình ${subject} (${grade}).`,
            answer: "Nêu các ứng dụng trong đời sống và phân tích ví dụ minh họa cụ thể.",
            cognitiveLevel: "Thông hiểu"
          }
        ]
      });
    }

    const teacherContext = teacherProfile
      ? `Giáo viên phụ trách: ${teacherProfile.name} (${teacherProfile.schoolName}), chuyên môn: ${teacherProfile.primarySubject} - ${teacherProfile.primaryGrade}.`
      : "";

    const systemPrompt = `Bạn là Trợ lý AI Khảo thí Quốc gia của Bộ Giáo Dục & Đào Tạo Việt Nam.
${teacherContext}
Nhiệm vụ: Tạo bộ câu hỏi khảo thí CHUẨN XÁC TUYỆT ĐỐI theo SGK mới cho môn ${subject}, ${grade} (${academicYear} - ${period || "Kiểm tra định kỳ"}).
Yêu cầu:
1. Tạo đúng số lượng câu hỏi trắc nghiệm (Multiple Choice) và 2-3 câu tự luận (Essay).
2. Từng câu hỏi trắc nghiệm phải có 4 lựa chọn (A, B, C, D), đáp án chính xác, lời giải thích sư phạm chi tiết và phân loại mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
3. Câu tự luận phải có hướng dẫn chấm và thang điểm biểu điểm thành phần.`;

    const contents: any[] = [];
    if (text) contents.push(text);
    if (imageBase64) {
      const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          data: pureBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents.length > 0 ? contents : `Tạo bộ câu hỏi ${subject} ${grade} theo ${textbook || "SGK Bộ GD&ĐT"}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            "Multiple Choice": {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  cognitiveLevel: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ["question", "options", "answer"],
              },
            },
            Essay: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  cognitiveLevel: { type: Type.STRING },
                },
                required: ["question", "answer"],
              },
            },
          },
          required: ["Multiple Choice", "Essay"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("AI Generation error:", err);
    res.status(500).json({ error: err.message || "Lỗi khi AI tạo câu hỏi" });
  }
});

// 7. Download Curriculum Bank & Sync Matrix
app.get("/api/curriculum/matrix", (req, res) => {
  const academicYear = (req.query.academicYear as string) || "Năm học 2026 - 2027";
  const levelFilter = req.query.level as string; // Tiểu học | THCS | THPT

  const allGrades = [
    { grade: "Lớp 1", level: "Tiểu học" as const, subjects: ["Toán", "Tiếng Việt", "Tiếng Anh", "Tự nhiên và Xã hội", "Đạo đức", "Âm nhạc", "Mĩ thuật", "Hoạt động trải nghiệm"] },
    { grade: "Lớp 2", level: "Tiểu học" as const, subjects: ["Toán", "Tiếng Việt", "Tiếng Anh", "Tự nhiên và Xã hội", "Đạo đức", "Âm nhạc", "Mĩ thuật", "Hoạt động trải nghiệm"] },
    { grade: "Lớp 3", level: "Tiểu học" as const, subjects: ["Toán", "Tiếng Việt", "Tiếng Anh", "Tự nhiên và Xã hội", "Tin học và Công nghệ", "Đạo đức", "Âm nhạc", "Mĩ thuật"] },
    { grade: "Lớp 4", level: "Tiểu học" as const, subjects: ["Toán", "Tiếng Việt", "Tiếng Anh", "Khoa học", "Lịch sử và Địa lí", "Tin học và Công nghệ", "Đạo đức"] },
    { grade: "Lớp 5", level: "Tiểu học" as const, subjects: ["Toán", "Tiếng Việt", "Tiếng Anh", "Khoa học", "Lịch sử và Địa lí", "Tin học và Công nghệ", "Đạo đức"] },
    { grade: "Lớp 6", level: "THCS" as const, subjects: ["Toán", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lí", "Giáo dục công dân", "Tin học", "Công nghệ"] },
    { grade: "Lớp 7", level: "THCS" as const, subjects: ["Toán", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lí", "Giáo dục công dân", "Tin học", "Công nghệ"] },
    { grade: "Lớp 8", level: "THCS" as const, subjects: ["Toán", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lí", "Giáo dục công dân", "Tin học", "Công nghệ"] },
    { grade: "Lớp 9", level: "THCS" as const, subjects: ["Toán", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lí", "Giáo dục công dân", "Tin học", "Công nghệ"] },
    { grade: "Lớp 10", level: "THPT" as const, subjects: ["Toán", "Ngữ văn", "Tiếng Anh", "Vật lí", "Hóa học", "Sinh học", "Lịch sử", "Địa lí", "Giáo dục kinh tế và pháp luật", "Tin học", "Công nghệ"] },
    { grade: "Lớp 11", level: "THPT" as const, subjects: ["Toán", "Ngữ văn", "Tiếng Anh", "Vật lí", "Hóa học", "Sinh học", "Lịch sử", "Địa lí", "Giáo dục kinh tế và pháp luật", "Tin học", "Công nghệ"] },
    { grade: "Lớp 12", level: "THPT" as const, subjects: ["Toán", "Ngữ văn", "Tiếng Anh", "Vật lí", "Hóa học", "Sinh học", "Lịch sử", "Địa lí", "Giáo dục kinh tế và pháp luật", "Tin học", "Công nghệ"] },
  ];

  const filteredGrades = levelFilter ? allGrades.filter((g) => g.level === levelFilter) : allGrades;

  const matrix = filteredGrades.map((g) => {
    const subjectsData = g.subjects.map((sub) => {
      // Find matching folder in database for this year, grade, and subject
      const matchingFolder = db.folders.find(
        (f) =>
          f.grade === g.grade &&
          f.subject?.toLowerCase() === sub.toLowerCase() &&
          (!f.academicYear || f.academicYear === academicYear)
      );

      const isDownloaded = !!matchingFolder;
      const mcCount = matchingFolder?.questions?.["Multiple Choice"]?.length || 0;
      const esCount = matchingFolder?.questions?.Essay?.length || 0;

      // Determine default approved textbook series
      let defaultTextbook = "Bộ sách Kết nối tri thức với cuộc sống";
      if (g.grade === "Lớp 9" || g.grade === "Lớp 4") {
        defaultTextbook = "Bộ sách Cánh Diều";
      } else if (g.grade === "Lớp 5" || g.grade === "Lớp 12") {
        defaultTextbook = "Bộ sách Chân trời sáng tạo";
      }

      return {
        subject: sub,
        grade: g.grade,
        level: g.level,
        academicYear,
        isDownloaded,
        folderId: matchingFolder?.id || null,
        folderName: matchingFolder?.name || null,
        textbook: matchingFolder?.textbook || defaultTextbook,
        questionCount: { mc: mcCount, es: esCount, total: mcCount + esCount },
        approvedTextbooks: [
          "Bộ sách Kết nối tri thức với cuộc sống",
          "Bộ sách Cánh Diều",
          "Bộ sách Chân trời sáng tạo"
        ],
        officialApproved: true,
        moetStandard: "Chương trình GDPT 2018 Bộ GD&ĐT",
      };
    });

    const totalSubjects = subjectsData.length;
    const downloadedSubjects = subjectsData.filter((s) => s.isDownloaded).length;

    return {
      grade: g.grade,
      level: g.level,
      totalSubjects,
      downloadedSubjects,
      isFullySynced: downloadedSubjects === totalSubjects,
      subjects: subjectsData,
    };
  });

  const totalAll = matrix.reduce((acc, g) => acc + g.totalSubjects, 0);
  const downloadedAll = matrix.reduce((acc, g) => acc + g.downloadedSubjects, 0);

  res.json({
    academicYear,
    summary: {
      totalSubjects: totalAll,
      downloadedSubjects: downloadedAll,
      syncPercentage: totalAll > 0 ? Math.round((downloadedAll / totalAll) * 100) : 0,
      totalGrades: matrix.length,
    },
    grades: matrix,
  });
});

// Bulk Sync Curriculum Matrix with Gemini AI
app.post("/api/curriculum/sync-batch", async (req, res) => {
  try {
    const { items, academicYear = "Năm học 2026 - 2027", teacherId } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Vui lòng chọn ít nhất một môn học để tải SGK" });
    }

    const ai = getGeminiClient();
    const createdFolders: FolderRecord[] = [];

    for (const item of items) {
      const {
        grade,
        subject,
        textbook = "Bộ sách Kết nối tri thức với cuộc sống",
        period = "Kiểm tra định kỳ Giữa Học Kỳ 1",
        numQuestions = 15,
      } = item;

      const folderName = `SGK ${textbook.replace("Bộ sách ", "")} - ${subject} ${grade} (${academicYear})`;
      
      // Check if folder already exists
      let existingFolder = db.folders.find(
        (f) =>
          f.grade === grade &&
          f.subject?.toLowerCase() === subject.toLowerCase() &&
          f.academicYear === academicYear
      );

      let mcQuestions: MultipleChoiceQ[] = [];
      let esQuestions: EssayQ[] = [];

      if (ai) {
        try {
          const systemPrompt = `Bạn là Chuyên gia Khảo thí Quốc gia của Bộ Giáo Dục & Đào Tạo Việt Nam.
Nhiệm vụ: Trích xuất và xây dựng ngân hàng câu hỏi THỰC TẾ, CHUẨN XÁC TUYỆT ĐỐI theo chương trình SGK mới nhất:
- Năm học: ${academicYear}
- Bộ sách giáo khoa: ${textbook}
- Môn học: ${subject}
- Khối lớp: ${grade}
- Giai đoạn: ${period}

Yêu cầu:
1. Tạo ${numQuestions} câu hỏi trắc nghiệm (Multiple Choice) 4 đáp án (A, B, C, D) có lời giải sư phạm chi tiết từng bước, phân loại rõ mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) và tên bài học/chủ đề trong SGK.
2. Tạo 3 câu hỏi tự luận (Essay) bám sát các dạng bài tập trọng tâm trong SGK cùng hướng dẫn chấm thang điểm chi tiết.
3. Toàn bộ nội dung bắt buộc bám sát khung chương trình GDPT 2018 của Bộ GD&ĐT lưu hành trong năm học ${academicYear}.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: `Trích xuất dữ liệu ngân hàng SGK chuẩn Bộ GD&ĐT cho môn ${subject} ${grade} theo ${textbook} (${academicYear}).`,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  "Multiple Choice": {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        cognitiveLevel: { type: Type.STRING },
                        topic: { type: Type.STRING },
                      },
                      required: ["question", "options", "answer"],
                    },
                  },
                  Essay: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        answer: { type: Type.STRING },
                        cognitiveLevel: { type: Type.STRING },
                      },
                      required: ["question", "answer"],
                    },
                  },
                },
                required: ["Multiple Choice", "Essay"],
              },
            },
          });

          const parsed = JSON.parse(response.text || "{}");
          mcQuestions = parsed["Multiple Choice"] || [];
          esQuestions = parsed.Essay || [];
        } catch (aiErr) {
          console.error(`AI sync error for ${subject} ${grade}:`, aiErr);
        }
      }

      // Fallback if AI didn't return or was unavailable
      if (mcQuestions.length === 0) {
        mcQuestions = [
          {
            question: `[SGK ${textbook.replace("Bộ sách ", "")}] Khái niệm và nguyên lý cốt lõi trong chương trình ${subject} ${grade} (${academicYear}) là gì?`,
            options: [
              "Nắm vững kiến thức trọng tâm và vận dụng giải quyết vấn đề thực tiễn",
              "Học thuộc lòng thụ động",
              "Bỏ qua các bài thực hành và ứng dụng",
              "Chỉ ôn tập lý thuyết không làm bài tập",
            ],
            answer: "Nắm vững kiến thức trọng tâm và vận dụng giải quyết vấn đề thực tiễn",
            explanation: "Chương trình GDPT mới chú trọng phát triển phẩm chất và năng lực học sinh theo chuẩn Bộ GD&ĐT.",
            cognitiveLevel: "Nhận biết",
            topic: `Chương 1 - Trọng tâm ${subject} ${grade}`,
          },
          {
            question: `[SGK ${textbook.replace("Bộ sách ", "")}] Dạng bài tập tiêu biểu của môn ${subject} ${grade} trong kỳ ${period} là:`,
            options: [
              "Phân tích dữ kiện, áp dụng công thức/quy luật và suy luận logic",
              "Đoán mò đáp án",
              "Không cần lập luận",
              "Chỉ viết kết quả cuối cùng mà không có lời giải",
            ],
            answer: "Phân tích dữ kiện, áp dụng công thức/quy luật và suy luận logic",
            explanation: "Theo định hướng đánh giá năng lực của Bộ Giáo Dục & Đào Tạo.",
            cognitiveLevel: "Thông hiểu",
            topic: `Chương 2 - Kỹ năng giải bài tập ${subject}`,
          },
          {
            question: `[SGK ${textbook.replace("Bộ sách ", "")}] Một ứng dụng thực tế của môn ${subject} ${grade} trong đời sống hàng ngày là:`,
            options: [
              "Giải quyết các bài toán kinh tế, đời sống và khoa học kỹ thuật",
              "Không có ứng dụng nào",
              "Chỉ dùng trong phòng thí nghiệm kín",
              "Không liên quan đến thực tiễn",
            ],
            answer: "Giải quyết các bài toán kinh tế, đời sống và khoa học kỹ thuật",
            explanation: "Ứng dụng liên môn và gắn liền với bối cảnh đời sống thực tế.",
            cognitiveLevel: "Vận dụng",
            topic: `Chương 3 - Thực hành và Vận dụng ${subject}`,
          }
        ];
        esQuestions = [
          {
            question: `Trình bày tóm tắt nội dung bài học trọng tâm môn ${subject} (${grade}) theo ${textbook} và nêu một ví dụ thực tế liên quan.`,
            answer: "Yêu cầu: Nêu đúng định nghĩa, phát biểu quy luật/định lý, phân tích bài toán thực tiễn và rút ra kết luận sư phạm rõ ràng.",
            cognitiveLevel: "Thông hiểu",
          }
        ];
      }

      if (existingFolder) {
        existingFolder.questions["Multiple Choice"] = mcQuestions;
        existingFolder.questions.Essay = esQuestions;
        existingFolder.note = `Đã cập nhật tự động bởi AI từ ${textbook} (${academicYear})`;
        existingFolder.textbook = textbook;
        createdFolders.push(existingFolder);
      } else {
        const newFolder: FolderRecord = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: folderName,
          note: `Ngân hàng SGK chuẩn ${textbook} - Môn ${subject} ${grade} (${academicYear})`,
          academicYear,
          textbook,
          subject,
          grade,
          period,
          level: (grade.includes("10") || grade.includes("11") || grade.includes("12"))
            ? "THPT"
            : (grade.includes("6") || grade.includes("7") || grade.includes("8") || grade.includes("9"))
            ? "THCS"
            : "Tiểu học",
          teacherId: teacherId || "system",
          isSystemShared: true,
          created_at: new Date().toISOString(),
          questions: {
            "Multiple Choice": mcQuestions,
            Essay: esQuestions,
          },
        };
        db.folders.unshift(newFolder);
        createdFolders.push(newFolder);
      }
    }

    saveDb();
    res.json({
      success: true,
      syncedCount: createdFolders.length,
      academicYear,
      folders: createdFolders,
      message: `Đã đồng bộ và lưu thành công ${createdFolders.length} bộ SGK vào kho dữ liệu theo chuẩn Bộ GD&ĐT (${academicYear})!`,
    });
  } catch (err: any) {
    console.error("Batch sync curriculum error:", err);
    res.status(500).json({ error: err.message || "Lỗi khi đồng bộ hàng loạt SGK" });
  }
});

// 7. Download Curriculum Bank
app.post("/api/ai/download-curriculum-bank", async (req, res) => {
  try {
    const {
      subject,
      grade,
      academicYear = "Năm học 2026 - 2027",
      textbook = "Bộ sách Kết nối tri thức với cuộc sống",
      period = "Kiểm tra định kỳ Giữa Học Kỳ 1",
      numQuestions = 15,
      teacherId,
    } = req.body;

    const folderName = `SGK ${textbook.replace("Bộ sách ", "")} - ${subject} ${grade} (${academicYear})`;
    const ai = getGeminiClient();

    if (!ai) {
      const newFolder: FolderRecord = {
        id: Date.now(),
        name: folderName,
        note: `Ngân hàng câu hỏi chuẩn ${textbook} môn ${subject} ${grade} (${academicYear} - ${period})`,
        academicYear,
        textbook,
        subject,
        grade,
        period,
        teacherId: teacherId || "system",
        created_at: new Date().toISOString(),
        questions: {
          "Multiple Choice": [
            {
              question: `Khái niệm trọng tâm của chương trình ${subject} ${grade} (${textbook} - ${academicYear}) là:`,
              options: [
                "Nắm vững các định lý, công thức và ứng dụng thực tiễn",
                "Học thuộc không cần suy nghĩ",
                "Chỉ làm bài dễ",
                "Bỏ qua phần vận dụng"
              ],
              answer: "Nắm vững các định lý, công thức và ứng dụng thực tiễn",
              explanation: "Chuẩn kiến thức kỹ năng Bộ GD&ĐT.",
              cognitiveLevel: "Nhận biết"
            }
          ],
          Essay: [
            {
              question: `Trình bày tóm tắt nội dung trọng tâm môn ${subject} (${grade}) theo bộ sách ${textbook}.`,
              answer: "Nêu các quy luật cơ bản và phân tích một bài toán vận dụng thực tiễn.",
              cognitiveLevel: "Thông hiểu"
            }
          ]
        }
      };

      db.folders.unshift(newFolder);
      saveDb();
      return res.json({ success: true, folder: newFolder });
    }

    const systemPrompt = `Bạn là Trợ lý AI Khảo thí Quốc gia của Bộ Giáo Dục & Đào Tạo Việt Nam.
Nhiệm vụ: Hãy trích xuất và tải về một ngân hàng câu hỏi đầy đủ, chuẩn xác và bám sát từng bài học của:
- Năm học: ${academicYear}
- Bộ Sách Giáo Khoa: ${textbook}
- Môn học: ${subject}
- Khối lớp: ${grade}
- Giai đoạn học tập: ${period}

Yêu cầu chi tiết:
1. Tạo ${numQuestions} câu hỏi trắc nghiệm khách quan 4 phương án, có đáp án đúng, lời giải sư phạm từng bước và phân loại mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
2. Tạo 3-4 câu hỏi tự luận với hướng dẫn chấm, các bước giải chi tiết và biểu điểm thành phần.
3. Nội dung phải hoàn toàn chính xác theo chương trình SGK mới nhất đang được Bộ GD&ĐT cấp phép lưu hành trong ${academicYear}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Hãy tạo ngân hàng câu hỏi chuẩn cho ${subject} - ${grade} theo ${textbook} (${academicYear} - ${period}).`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            "Multiple Choice": {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  cognitiveLevel: { type: Type.STRING }
                },
                required: ["question", "options", "answer"]
              }
            },
            Essay: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  cognitiveLevel: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["Multiple Choice", "Essay"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    const newFolder: FolderRecord = {
      id: Date.now(),
      name: folderName,
      note: `Tải về bởi AI từ bộ sách ${textbook} - Khối ${grade} (${academicYear} - ${period})`,
      academicYear,
      textbook,
      subject,
      grade,
      period,
      teacherId: teacherId || "system",
      created_at: new Date().toISOString(),
      questions: {
        "Multiple Choice": parsed["Multiple Choice"] || [],
        Essay: parsed.Essay || [],
      }
    };

    db.folders.unshift(newFolder);
    saveDb();

    res.json({ success: true, folder: newFolder });
  } catch (err: any) {
    console.error("Download bank error:", err);
    res.status(500).json({ error: err.message || "Lỗi khi tải ngân hàng SGK bằng AI" });
  }
});

// 8. AI Generate Exam Directly from Stored SGK Repository with Teacher Focus
app.post("/api/ai/generate-from-stored-bank", async (req, res) => {
  try {
    const {
      subject,
      grade,
      academicYear = "Năm học 2026 - 2027",
      period = "Kiểm tra thường xuyên / 15 phút",
      textbook,
      numQuestions = 10,
      customRequirement = "",
      teacherProfile,
    } = req.body;

    // Filter relevant folders in database
    const matchingFolders = db.folders.filter((f) => {
      const matchSub = !subject || !f.subject || f.subject.toLowerCase() === subject.toLowerCase();
      const matchGrd = !grade || !f.grade || f.grade.toLowerCase() === grade.toLowerCase();
      return matchSub && matchGrd;
    });

    // Gather all candidate questions from matched folders
    let candidateMC: MultipleChoiceQ[] = [];
    let candidateES: EssayQ[] = [];

    matchingFolders.forEach((f) => {
      if (f.questions?.["Multiple Choice"]) candidateMC.push(...f.questions["Multiple Choice"]);
      if (f.questions?.Essay) candidateES.push(...f.questions.Essay);
    });

    const ai = getGeminiClient();

    let targetDuration = 45;
    let targetMC = numQuestions || 10;
    let targetES = 2;

    if (period.includes("15 phút") || period.includes("thường xuyên")) {
      targetDuration = 15;
      targetMC = numQuestions || 10;
      targetES = 0;
    } else if (period.includes("1 tiết") || period.includes("45 phút")) {
      targetDuration = 45;
      targetMC = 12;
      targetES = 2;
    } else if (period.includes("Giữa")) {
      targetDuration = 60;
      targetMC = 16;
      targetES = 2;
    } else if (period.includes("Cuối") || period.includes("Tốt nghiệp") || period.includes("ĐGNL")) {
      targetDuration = 90;
      targetMC = 20;
      targetES = 3;
    }

    if (!ai) {
      const shuffledMC = [...candidateMC].sort(() => 0.5 - Math.random()).slice(0, targetMC);
      const shuffledES = [...candidateES].sort(() => 0.5 - Math.random()).slice(0, targetES);

      return res.json({
        title: `Đề thi ${subject} ${grade} - ${period} (${academicYear})`,
        duration: targetDuration,
        academicYear,
        period,
        subject,
        grade,
        questions: {
          mc: shuffledMC.length > 0 ? shuffledMC : [
            {
              question: `Khái niệm cơ bản môn ${subject} ${grade} (${period})?`,
              options: ["Đáp án A đúng", "Đáp án B sai", "Đáp án C sai", "Đáp án D sai"],
              answer: "Đáp án A đúng",
              explanation: "Lời giải chuẩn SGK.",
              cognitiveLevel: "Nhận biết"
            }
          ],
          es: shuffledES
        },
        sourceInfo: `Trích xuất từ ${matchingFolders.length} thư mục SGK đã lưu trữ trong kho dữ liệu.`
      });
    }

    const teacherContext = teacherProfile
      ? `Giáo viên chủ trì: ${teacherProfile.name}, Trường: ${teacherProfile.schoolName}. Khối lớp chuyên trách: ${teacherProfile.primaryGrade}.`
      : "";

    const systemPrompt = `Bạn là Giám đốc Hội đồng Ra Đề Thi Quốc Gia của Bộ Giáo Dục & Đào Tạo Việt Nam.
${teacherContext}
Nhiệm vụ: Tạo một đề thi HOÀN CHỈNH, CHÍNH XÁC TUYỆT ĐỐI và BÁM SÁT MA TRẬN KHẢO THÍ cho:
- Năm học: ${academicYear}
- Môn học: ${subject}
- Khối lớp: ${grade}
- Giai đoạn học / Loại đề: ${period}
- Bộ SGK: ${textbook || "Bộ SGK Chuẩn Bộ GD&ĐT"}
- Yêu cầu bổ sung của giáo viên: ${customRequirement || "Tuân thủ chặt chẽ khung chương trình GDPT 2018"}

Dưới đây là tập hợp các câu hỏi đã được lưu trữ trong Kho Dữ Liệu Ngân Hàng SGK của hệ thống:
${JSON.stringify({ mcSample: candidateMC.slice(0, 30), esSample: candidateES.slice(0, 10) })}

Yêu cầu thực hiện:
1. Hãy ƯU TIÊN chọn lọc, tinh chỉnh và kết hợp các câu hỏi từ Kho Dữ Liệu Ngân Hàng SGK trên để tạo nên đề thi chuẩn xác cho giai đoạn ${period}.
2. Nếu kho dữ liệu cần thêm câu hỏi để đủ ma trận (${targetMC} câu trắc nghiệm và ${targetES} câu tự luận), hãy tự động sinh thêm các câu hỏi chất lượng cao đúng chuẩn bài học của giai đoạn ${period} trong ${academicYear}.
3. Phân bổ tỉ lệ nhận thức chuẩn Bộ GD&ĐT: 40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Hãy tạo đề thi ${subject} ${grade} chuẩn giai đoạn ${period} (${academicYear}) từ ngân hàng dữ liệu lưu trữ.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            questions: {
              type: Type.OBJECT,
              properties: {
                mc: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      answer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      cognitiveLevel: { type: Type.STRING }
                    },
                    required: ["question", "options", "answer"]
                  }
                },
                es: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING },
                      cognitiveLevel: { type: Type.STRING }
                    },
                    required: ["question", "answer"]
                  }
                }
              },
              required: ["mc", "es"]
            }
          },
          required: ["title", "duration", "questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      ...parsed,
      academicYear,
      period,
      subject,
      grade,
      sourceInfo: `Đã khai thác và tối ưu từ ${candidateMC.length + candidateES.length} câu hỏi trong Ngân hàng SGK đã lưu trữ.`
    });
  } catch (err: any) {
    console.error("Generate from stored bank error:", err);
    res.status(500).json({ error: err.message || "Lỗi khi trích xuất và tạo đề từ ngân hàng lưu trữ" });
  }
});

// 9. AI Assistant Command Center with Teacher Profile Awareness
app.post("/api/ai/assistant-command", async (req, res) => {
  try {
    const { prompt, teacherProfile } = req.body;
    if (!prompt) return res.status(400).json({ error: "Thiếu câu lệnh cho AI" });

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reply: `Chào Thầy/Cô ${teacherProfile?.name || ""}! Tôi đã ghi nhận lệnh: "${prompt}". Hãy thiết lập API Key trong Settings để kích hoạt toàn diện Trợ lý AI Khảo thí.`,
        actionType: "info",
      });
    }

    const teacherContext = teacherProfile
      ? `Thông tin Giáo viên đang ra lệnh:
- Họ tên: ${teacherProfile.name}
- Trường: ${teacherProfile.schoolName}
- Cấp học: ${teacherProfile.level} (Khối phụ trách chính: ${teacherProfile.primaryGrade}, Các khối được phân công: ${teacherProfile.assignedGrades?.join(", ")})
- Môn học chuyên môn: ${teacherProfile.primarySubject} (Các môn phụ trách: ${teacherProfile.assignedSubjects?.join(", ")})`
      : "";

    const systemPrompt = `Bạn là Trợ lý AI Giáo Viên 4.0 thông minh hàng đầu của Bộ Giáo Dục & Đào Tạo Việt Nam.
${teacherContext}
Nhiệm vụ: Phân tích câu lệnh của giáo viên và phản hồi chính xác, ƯU TIÊN lấy môn học và khối lớp mà giáo viên đó đang phụ trách nếu trong câu lệnh không chỉ định rõ môn/lớp khác.

Hãy phân tích ý định của giáo viên và phản hồi:
1. 'actionType': 'create_exam_from_bank' (tạo đề từ ngân hàng lưu trữ), 'create_exam_custom' (tự sinh đề theo yêu cầu), 'download_bank' (tải ngân hàng SGK), 'chat_advice' (hỏi đáp/tư vấn).
2. 'subject': Tên môn học phù hợp (mặc định là môn của giáo viên: ${teacherProfile?.primarySubject || "Toán"}).
3. 'grade': Khối lớp (mặc định là khối của giáo viên: ${teacherProfile?.primaryGrade || "Lớp 10"}).
4. 'academicYear': Năm học (ví dụ "Năm học 2026 - 2027", "Năm học 2025 - 2026").
5. 'textbook': Bộ sách (Bộ sách Kết nối tri thức với cuộc sống, Bộ sách Cánh Diều, Bộ sách Chân trời sáng tạo, v.v.).
6. 'period': Giai đoạn học (Kiểm tra thường xuyên / 15 phút, Kiểm tra định kỳ 1 tiết, Giữa Học Kỳ 1, Cuối Học Kỳ 1, Giữa Học Kỳ 2, Cuối Học Kỳ 2, Khảo sát chất lượng đầu năm, Ôn thi vào 10, Ôn thi Tốt nghiệp THPT).
7. 'numQuestions': Số lượng câu hỏi trắc nghiệm mong muốn (mặc định 10-15).
8. 'reply': Lời phản hồi sư phạm ân cần, xưng hô tôn trọng đúng chức danh thầy/cô và tóm tắt rõ hành động AI chuẩn bị thực hiện.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionType: { type: Type.STRING },
            subject: { type: Type.STRING },
            grade: { type: Type.STRING },
            academicYear: { type: Type.STRING },
            textbook: { type: Type.STRING },
            period: { type: Type.STRING },
            numQuestions: { type: Type.NUMBER },
            reply: { type: Type.STRING }
          },
          required: ["actionType", "reply"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("AI assistant command error:", err);
    res.status(500).json({ error: err.message || "Lỗi xử lý câu lệnh AI" });
  }
});

// 10. AI Essay Auto-grading
app.post("/api/ai/grade-essay", async (req, res) => {
  try {
    const { question, student_answer, reference_answer } = req.body;

    if (!student_answer || student_answer.trim() === "") {
      return res.json({
        score: 0,
        comment: "Học sinh chưa trả lời câu hỏi này.",
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const wordCount = student_answer.trim().split(/\s+/).length;
      let mockScore = Math.min(10, Math.max(2, Math.round((wordCount / 20) * 10) / 10));
      return res.json({
        score: mockScore,
        comment: `Bài làm đạt ${wordCount} từ. Trình bày tương đối rõ ràng. Hãy kết nối API Key để nhận nhận xét chuyên sâu từng luận điểm.`,
      });
    }

    const prompt = `Bạn là giám khảo chấm thi giáo dục tại Việt Nam.
Câu hỏi tự luận: ${question}
Đáp án tham khảo / Biểu điểm: ${reference_answer || "Nêu đúng ý chính và liên hệ thực tế"}
Bài làm của học sinh: ${student_answer}

Yêu cầu:
1. Đánh giá mức độ chính xác của học sinh so với đáp án.
2. Cho điểm trên thang điểm 10 (từ 0 đến 10, chính xác đến 0.25 hoặc 0.5 điểm).
3. Đưa ra lời nhận xét ngắn gọn, mang tính khích lệ và chỉ rõ điểm đúng/chưa đủ.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là giám khảo công tâm, chuẩn mực sư phạm.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Điểm từ 0 đến 10" },
            comment: { type: Type.STRING, description: "Lời nhận xét sư phạm" },
          },
          required: ["score", "comment"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err: any) {
    console.error("AI grade essay error:", err);
    res.status(500).json({ error: err.message || "Lỗi khi AI chấm điểm tự luận" });
  }
});

// 11. AI Batch Grade All Submissions
app.post("/api/ai/batch-grade", async (req, res) => {
  try {
    const ai = getGeminiClient();
    let gradedCount = 0;

    for (const sub of db.submissions) {
      const test = db.tests.find((t) => t.id === sub.test_id);
      if (!test || !test.questions.es || test.questions.es.length === 0) continue;

      let additionalScore = 0;
      const feedbackList: string[] = [];

      for (let i = 0; i < test.questions.es.length; i++) {
        const q = test.questions.es[i];
        const studentAns = sub.answers[`es_${i}`] || "";
        if (!studentAns) continue;

        if (ai) {
          try {
            const gradeRes = await ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: `Chấm điểm câu tự luận:
Câu hỏi: ${q.question}
Đáp án mẫu: ${q.answer}
Bài làm học sinh: ${studentAns}`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    comment: { type: Type.STRING }
                  },
                  required: ["score", "comment"]
                }
              }
            });
            const parsed = JSON.parse(gradeRes.text || "{}");
            const sc = Number(parsed.score) || 0;
            additionalScore += (sc / 10) * (10 / (sub.total_questions || 1));
            feedbackList.push(`Câu TL ${i + 1} (${sc}/10đ): ${parsed.comment}`);
          } catch (e) {
            console.error("Batch grade single item error", e);
          }
        }
      }

      if (additionalScore > 0 || feedbackList.length > 0) {
        sub.score = Math.min(10, Math.round((sub.score + additionalScore) * 100) / 100);
        sub.ai_graded = true;
        sub.ai_feedback = feedbackList;
        sub.status = "graded";
        gradedCount++;
      }
    }

    saveDb();
    res.json({ success: true, gradedCount });
  } catch (err: any) {
    console.error("Batch grading error:", err);
    res.status(500).json({ error: err.message || "Lỗi khi chấm hàng loạt" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
