import { MultipleChoiceQ, EssayQ, GRADES, SUBJECTS, SubjectName } from "../types";

export interface SubjectQuestions {
  "Multiple Choice": MultipleChoiceQ[];
  Essay: EssayQ[];
}

export function getRealQuestions(subject: SubjectName, gradeIdx: number): SubjectQuestions {
  const level = gradeIdx + 1; // 1 to 12

  if (subject === "Tiếng Anh") {
    const isElementary = level <= 5;
    const isMiddle = level >= 6 && level <= 9;

    if (isElementary) {
      return {
        "Multiple Choice": [
          {
            question: "What color is the sun?",
            options: ["Yellow", "Blue", "Black", "Pink"],
            answer: "Yellow",
            translation: "Mặt trời màu gì?",
            explanation: "Mặt trời có màu vàng (Yellow)."
          },
          {
            question: "How many days are there in a week?",
            options: ["5", "6", "7", "8"],
            answer: "7",
            translation: "Một tuần có bao nhiêu ngày?",
            explanation: "Một tuần có 7 ngày (7 days)."
          },
          {
            question: "This is ______ apple. It is red.",
            options: ["a", "an", "the", "two"],
            answer: "an",
            translation: "Đây là một quả táo. Nó màu đỏ.",
            explanation: "Dùng 'an' trước danh từ bắt đầu bằng nguyên âm 'a'."
          },
          {
            question: "I ______ my teeth every morning.",
            options: ["brush", "brushes", "brushing", "brushed"],
            answer: "brush",
            translation: "Tôi đánh răng mỗi sáng.",
            explanation: "Thì hiện tại đơn với chủ ngữ 'I' đi với động từ nguyên mẫu 'brush'."
          },
          {
            question: "Where is the cat? - It is ______ the chair.",
            options: ["under", "between", "of", "to"],
            answer: "under",
            translation: "Con mèo ở đâu? - Nó ở dưới ghế.",
            explanation: "Giới từ chỉ vị trí 'under' nghĩa là ở dưới."
          },
          {
            question: "What is your name? - ______ name is Nam.",
            options: ["My", "Your", "His", "Her"],
            answer: "My",
            translation: "Tên bạn là gì? - Tên tôi là Nam.",
            explanation: "Tính từ sở hữu 'My' (của tôi)."
          },
          {
            question: "Can you swim? - Yes, I ______.",
            options: ["can", "do", "am", "have"],
            answer: "can",
            translation: "Bạn có biết bơi không? - Có, tôi biết.",
            explanation: "Câu hỏi bắt đầu bằng 'Can' thì trả lời với 'can'."
          },
          {
            question: "How old are you? - I am eight ______ old.",
            options: ["years", "year", "day", "days"],
            answer: "years",
            translation: "Bạn bao nhiêu tuổi? - Tôi tám tuổi.",
            explanation: "Số lượng từ 2 trở lên dùng danh từ số nhiều 'years'."
          }
        ],
        Essay: [
          {
            question: "Introduce your best friend in 3-4 sentences (name, age, hobbies).",
            answer: "My best friend is Nam. He is 8 years old. He likes reading books and playing football. We often study together."
          },
          {
            question: "Write about your favorite animal.",
            answer: "My favorite animal is a dog. Its name is Milo. It has soft white fur and likes running in the garden."
          }
        ]
      };
    }

    return {
      "Multiple Choice": [
        {
          question: "How ______ oranges are there in the fridge?",
          options: ["many", "much", "long", "far"],
          answer: "many",
          translation: "Có bao nhiêu quả cam trong tủ lạnh?",
          explanation: "'Oranges' là danh từ đếm được số nhiều nên dùng 'How many'."
        },
        {
          question: "She ______ to music every evening.",
          options: ["listen", "listens", "listening", "listened"],
          answer: "listens",
          translation: "Cô ấy nghe nhạc mỗi tối.",
          explanation: "Thì hiện tại đơn diễn tả thói quen, chủ ngữ ngôi thứ 3 số ít 'She' chia động từ thêm 's/es'."
        },
        {
          question: "What is the capital of Vietnam?",
          options: ["Hue", "Da Nang", "Hanoi", "Ho Chi Minh City"],
          answer: "Hanoi",
          translation: "Thủ đô của Việt Nam là gì?",
          explanation: "Hà Nội là thủ đô của nước CHXHCN Việt Nam."
        },
        {
          question: "I ______ my homework at the moment.",
          options: ["do", "does", "am doing", "did"],
          answer: "am doing",
          translation: "Tôi đang làm bài tập về nhà ngay lúc này.",
          explanation: "Dấu hiệu 'at the moment' dùng thì hiện tại tiếp diễn (am/is/are + V-ing)."
        },
        {
          question: "The book is ______ the table.",
          options: ["in", "on", "at", "under"],
          answer: "on",
          translation: "Cuốn sách ở trên bàn.",
          explanation: "Giới từ 'on' chỉ bề mặt tiếp xúc."
        },
        {
          question: "Choose the word with different stress pattern: 'Teacher', 'Doctor', 'Advice', 'Student'",
          options: ["Teacher", "Doctor", "Advice", "Student"],
          answer: "Advice",
          translation: "Chọn từ có trọng âm khác.",
          explanation: "'Advice' nhấn trọng âm 2, các từ còn lại nhấn trọng âm 1."
        },
        {
          question: "They ______ to the zoo last Sunday.",
          options: ["go", "goes", "went", "going"],
          answer: "went",
          translation: "Họ đã đi sở thú vào chủ nhật tuần trước.",
          explanation: "Dấu hiệu 'last Sunday' dùng thì quá khứ đơn (V2/ed -> went)."
        },
        {
          question: "If it rains tomorrow, I ______ an umbrella.",
          options: ["take", "takes", "will take", "took"],
          answer: "will take",
          translation: "Nếu ngày mai trời mưa, tôi sẽ mang theo ô.",
          explanation: "Câu điều kiện loại 1: Mệnh đề If dùng hiện tại đơn, mệnh đề chính dùng 'will + V'."
        },
        {
          question: "My father is a ______. He works in a central hospital.",
          options: ["teacher", "farmer", "doctor", "driver"],
          answer: "doctor",
          translation: "Bố tôi là bác sĩ. Ông ấy làm việc ở bệnh viện.",
          explanation: "Bác sĩ (doctor) làm việc ở bệnh viện (hospital)."
        },
        {
          question: "How ______ is a bowl of beef noodles in this restaurant?",
          options: ["many", "much", "often", "long"],
          answer: "much",
          translation: "Một bát phở bò ở nhà hàng này giá bao nhiêu?",
          explanation: "Hỏi giá tiền dùng cấu trúc 'How much is/are...'."
        },
        {
          question: "Although he was tired, ______ he finished his project on time.",
          options: ["he", "but he", "so he", "and he"],
          answer: "he",
          translation: "Mặc dù anh ấy mệt, anh ấy vẫn hoàn thành dự án đúng hạn.",
          explanation: "Trong tiếng Anh, đã có 'Although' ở mệnh đề phụ thì mệnh đề chính không dùng 'but'."
        },
        {
          question: "She is the ______ student in our class.",
          options: ["smart", "smarter", "smartest", "most smart"],
          answer: "smartest",
          translation: "Cô ấy là học sinh thông minh nhất trong lớp chúng tôi.",
          explanation: "So sánh nhất với tính từ ngắn: the + adj-est."
        }
      ],
      Essay: [
        {
          question: "Write a short paragraph (60-80 words) about the importance of protecting the environment.",
          answer: "Protecting the environment is essential for our survival. Firstly, clean air and water ensure good health for humans and animals. Secondly, preserving forests and oceans prevents climate change and extreme weather. We can contribute by planting trees, saving energy, and reducing plastic waste. Together, we make the Earth a better place."
        },
        {
          question: "Describe your dream job and explain why you want to do it.",
          answer: "In the future, I want to become a software engineer. This job allows me to create useful applications that solve real-life problems. Moreover, technology is constantly developing, offering endless opportunities to learn and connect with global experts."
        }
      ]
    };
  }

  if (subject === "Toán") {
    if (level <= 5) {
      // Tiểu học (Lớp 1 - 5)
      return {
        "Multiple Choice": [
          {
            question: `Kết quả của phép tính ${15 * level} + ${25 * level} là:`,
            options: [`${40 * level - 5}`, `${40 * level}`, `${40 * level + 5}`, `${40 * level + 10}`],
            answer: `${40 * level}`,
            explanation: `Tính toán trực tiếp: ${15 * level} + ${25 * level} = ${40 * level}.`
          },
          {
            question: `Tìm x, biết x - ${10 * level} = ${50 * level}:`,
            options: [`${40 * level}`, `${60 * level}`, `${70 * level}`, `${50 * level}`],
            answer: `${60 * level}`,
            explanation: `Muốn tìm số bị trừ, ta lấy hiệu cộng với số trừ: x = ${50 * level} + ${10 * level} = ${60 * level}.`
          },
          {
            question: "Số lớn nhất có 3 chữ số khác nhau là:",
            options: ["999", "987", "900", "978"],
            answer: "987",
            explanation: "Chữ số hàng trăm là 9, hàng chục là 8, hàng đơn vị là 7 -> 987."
          },
          {
            question: "1 giờ 15 phút bằng bao nhiêu phút?",
            options: ["65 phút", "75 phút", "85 phút", "95 phút"],
            answer: "75 phút",
            explanation: "1 giờ = 60 phút. 60 + 15 = 75 phút."
          },
          {
            question: "Diện tích hình chữ nhật có chiều dài 12cm, chiều rộng 5cm là:",
            options: ["17 cm²", "60 cm²", "34 cm²", "50 cm²"],
            answer: "60 cm²",
            explanation: "Diện tích hình chữ nhật S = a x b = 12 x 5 = 60 cm²."
          },
          {
            question: "Phân số nào sau đây lớn hơn 1?",
            options: ["3/4", "5/5", "7/6", "1/2"],
            answer: "7/6",
            explanation: "Phân số có tử số lớn hơn mẫu số (7 > 6) thì phân số đó lớn hơn 1."
          },
          {
            question: "Hình nào sau đây có 4 cạnh bằng nhau và 4 góc vuông?",
            options: ["Hình chữ nhật", "Hình thoi", "Hình vuông", "Hình bình hành"],
            answer: "Hình vuông",
            explanation: "Hình vuông có 4 cạnh bằng nhau và 4 góc vuông."
          },
          {
            question: `Giá trị của biểu thức ${level * 8} : 2 + 10 là:`,
            options: [`${level * 4 + 10}`, `${level * 4 + 5}`, `${level * 8}`, `${level * 2 + 10}`],
            answer: `${level * 4 + 10}`,
            explanation: `Thực hiện phép chia trước, phép cộng sau: ${level * 8} : 2 = ${level * 4}, sau đó cộng 10.`
          }
        ],
        Essay: [
          {
            question: "Một cửa hàng có 240kg gạo. Buổi sáng bán được 1/3 số gạo đó, buổi chiều bán được 1/4 số gạo còn lại. Hỏi cửa hàng còn lại bao nhiêu kg gạo?",
            answer: "Số gạo bán buổi sáng: 240 x 1/3 = 80 (kg). Số gạo còn lại sau buổi sáng: 240 - 80 = 160 (kg). Số gạo bán buổi chiều: 160 x 1/4 = 40 (kg). Cửa hàng còn lại: 160 - 40 = 120 (kg)."
          },
          {
            question: "Tính chu vi và diện tích mảnh đất hình chữ nhật có chiều rộng 15m, chiều dài gấp 3 lần chiều rộng.",
            answer: "Chiều dài mảnh đất: 15 x 3 = 45 (m). Chu vi: (45 + 15) x 2 = 120 (m). Diện tích: 45 x 15 = 675 (m²)."
          }
        ]
      };
    }

    if (level >= 6 && level <= 9) {
      // THCS (Lớp 6 - 9)
      return {
        "Multiple Choice": [
          {
            question: "Số nào sau đây là số nguyên tố?",
            options: ["9", "15", "17", "21"],
            answer: "17",
            explanation: "17 chỉ có 2 ước dương là 1 và chính nó."
          },
          {
            question: "Nghiệm của phương trình 2x - 6 = 0 là:",
            options: ["x = 2", "x = 3", "x = -3", "x = 6"],
            answer: "x = 3",
            explanation: "2x = 6 <=> x = 3."
          },
          {
            question: "Căn bậc hai số học của 144 là:",
            options: ["10", "11", "12", "±12"],
            answer: "12",
            explanation: "Căn bậc hai số học của một số không âm là số không âm bình phương bằng số đó: √144 = 12."
          },
          {
            question: "Hệ số góc của đường thẳng y = 3x - 5 là:",
            options: ["3", "-5", "5", "-3"],
            answer: "3",
            explanation: "Đường thẳng dạng y = ax + b có hệ số góc là a, ở đây a = 3."
          },
          {
            question: "Định lý Pytago áp dụng cho loại tam giác nào?",
            options: ["Tam giác đều", "Tam giác cân", "Tam giác vuông", "Tam giác tù"],
            answer: "Tam giác vuông",
            explanation: "Định lý Pytago áp dụng cho tam giác vuông: a² + b² = c²."
          },
          {
            question: "Hằng đẳng thức (a - b)² bằng biểu thức nào sau đây?",
            options: ["a² - b²", "a² - 2ab + b²", "a² + 2ab + b²", "a² - ab + b²"],
            answer: "a² - 2ab + b²",
            explanation: "Bình phương của một hiệu: (a - b)² = a² - 2ab + b²."
          },
          {
            question: "Cho tam giác ABC vuông tại A có AB = 6cm, AC = 8cm. Độ dài cạnh BC là:",
            options: ["10 cm", "14 cm", "12 cm", "9 cm"],
            answer: "10 cm",
            explanation: "Theo định lý Pytago: BC² = AB² + AC² = 6² + 8² = 36 + 64 = 100 => BC = 10 cm."
          },
          {
            question: "Biểu thức √(-5)² có giá trị bằng:",
            options: ["-5", "5", "25", "±5"],
            answer: "5",
            explanation: "√((-5)²) = |-5| = 5."
          }
        ],
        Essay: [
          {
            question: "Giải hệ phương trình sau:\n  2x + y = 7\n  x - y = 2",
            answer: "Cộng hai phương trình vế theo vế: 3x = 9 => x = 3. Thay x = 3 vào pt thứ hai: 3 - y = 2 => y = 1. Vậy hệ phương trình có nghiệm duy nhất (x, y) = (3, 1)."
          },
          {
            question: "Cho tam giác ABC nhọn nội tiếp đường tròn (O; R). Các đường cao AD, BE cắt nhau tại H. Chứng minh tứ giác CDHE nội tiếp.",
            answer: "Xét tứ giác CDHE: góc CDH = 90° (do AD ⊥ BC), góc CEH = 90° (do BE ⊥ AC). Tổng hai góc đối diện: góc CDH + góc CEH = 90° + 90° = 180°. Do đó tứ giác CDHE nội tiếp đường tròn đường kính CH."
          }
        ]
      };
    }

    // THPT (Lớp 10 - 12)
    return {
      "Multiple Choice": [
        {
          question: "Đạo hàm của hàm số y = x³ - 3x + 2 là:",
          options: ["y' = 3x² - 3", "y' = 3x² + 3", "y' = x² - 3", "y' = 3x²"],
          answer: "y' = 3x² - 3",
          explanation: "(x³)' = 3x², (-3x)' = -3, (2)' = 0 => y' = 3x² - 3."
        },
        {
          question: "Hàm số y = x⁴ - 2x² + 1 có bao nhiêu điểm cực trị?",
          options: ["1", "2", "3", "0"],
          answer: "3",
          explanation: "y' = 4x³ - 4x = 4x(x² - 1) = 0 có 3 nghiệm phân biệt x = 0, x = 1, x = -1 nên hàm số có 3 cực trị."
        },
        {
          question: "Nguyên hàm của hàm số f(x) = e^(2x) là:",
          options: ["e^(2x) + C", "(1/2)e^(2x) + C", "2e^(2x) + C", "(1/2)e^x + C"],
          answer: "(1/2)e^(2x) + C",
          explanation: "∫e^(ax)dx = (1/a)e^(ax) + C với a = 2."
        },
        {
          question: "Tập nghiệm của bất phương trình log₂(x - 1) < 3 là:",
          options: ["(1; 9)", "(-∞; 9)", "(1; 8)", "(1; +∞)"],
          answer: "(1; 9)",
          explanation: "Điều kiện x - 1 > 0 => x > 1. BPT: x - 1 < 2³ = 8 => x < 9. Kết hợp điều kiện ta được (1; 9)."
        },
        {
          question: "Trong không gian Oxyz, khoảng cách từ điểm M(1; 2; -2) đến mặt phẳng (P): 2x - 2y + z + 5 = 0 là:",
          options: ["1/3", "1", "3", "2/3"],
          answer: "1/3",
          explanation: "d(M, (P)) = |2(1) - 2(2) + (-2) + 5| / √(2² + (-2)² + 1²) = |2 - 4 - 2 + 5| / √9 = 1 / 3."
        },
        {
          question: "Số phức z = 3 - 4i có môđun bằng:",
          options: ["5", "7", "√7", "25"],
          answer: "5",
          explanation: "|z| = √(3² + (-4)²) = √(9 + 16) = √25 = 5."
        },
        {
          question: "Thể tích của khối chóp có diện tích đáy B = 6a² và chiều cao h = 3a là:",
          options: ["18a³", "6a³", "9a³", "2a³"],
          answer: "6a³",
          explanation: "V = (1/3)Bh = (1/3) * 6a² * 3a = 6a³."
        },
        {
          question: "Tiệm cận ngang của đồ thị hàm số y = (2x + 1)/(x - 1) là đường thẳng:",
          options: ["y = 2", "x = 1", "y = -1", "x = 2"],
          answer: "y = 2",
          explanation: "lim(x->±∞) (2x + 1)/(x - 1) = 2 => Tiệm cận ngang y = 2."
        }
      ],
      Essay: [
        {
          question: "Khảo sát sự biến thiên và vẽ đồ thị hàm số y = x³ - 3x² + 2.",
          answer: "1. TXĐ: D = R. 2. Đạo hàm y' = 3x² - 6x = 3x(x - 2). y' = 0 <=> x = 0 (y = 2) hoặc x = 2 (y = -2). 3. Hàm số đồng biến trên (-∞; 0) và (2; +∞), nghịch biến trên (0; 2). Điểm CĐ (0; 2), điểm CT (2; -2). 4. Vẽ đồ thị đi qua các điểm đặc biệt."
        },
        {
          question: "Tính tích phân I = ∫[0 đến 1] (2x + 1)e^x dx bằng phương pháp tích phân từng phần.",
          answer: "Đặt u = 2x + 1 => du = 2dx; dv = e^x dx => v = e^x. Ta có I = [(2x + 1)e^x] từ 0 đến 1 - ∫[0 đến 1] 2e^x dx = (3e - 1) - [2e^x] từ 0 đến 1 = 3e - 1 - (2e - 2) = e + 1."
        }
      ]
    };
  }

  if (subject === "Vật lý") {
    return {
      "Multiple Choice": [
        {
          question: "Đơn vị của vận tốc trong hệ SI là:",
          options: ["m/s", "km/h", "m/s²", "N"],
          answer: "m/s",
          explanation: "Trong hệ SI, đơn vị chiều dài là mét (m), thời gian là giây (s) nên vận tốc là m/s."
        },
        {
          question: "Lực là đại lượng vectơ đặc trưng cho:",
          options: ["Tác dụng của vật này lên vật khác", "Khối lượng của vật", "Vận tốc của vật", "Thể tích của vật"],
          answer: "Tác dụng của vật này lên vật khác",
          explanation: "Lực là đại lượng vật lý đặc trưng cho tác dụng của vật này lên vật khác, gây ra gia tốc hoặc biến dạng."
        },
        {
          question: "Định luật I Niu-tơn còn được gọi là:",
          options: ["Định luật quán tính", "Định luật tương tác", "Định luật vạn vật hấp dẫn", "Định luật bảo toàn cơ năng"],
          answer: "Định luật quán tính",
          explanation: "Định luật I Niu-tơn khẳng định tính chất bảo toàn vận tốc khi không có ngoại lực tác dụng (quán tính)."
        },
        {
          question: "Một con lắc lò xo có độ cứng k = 100 N/m, vật nặng khối lượng m = 0.1 kg. Tần số góc dao động riêng của con lắc là:",
          options: ["10 rad/s", "31.6 rad/s", "100 rad/s", "1 rad/s"],
          answer: "31.6 rad/s",
          explanation: "ω = √(k/m) = √(100/0.1) = √1000 ≈ 31.62 rad/s."
        },
        {
          question: "Hiện tượng giao thoa sóng ánh sáng chứng minh ánh sáng có tính chất:",
          options: ["Sóng", "Hạt", "Lượng tử", "Điện tích"],
          answer: "Sóng",
          explanation: "Giao thoa và nhiễu xạ là bằng chứng thực nghiệm khẳng định tính chất sóng của ánh sáng."
        },
        {
          question: "Công của lực F dịch chuyển một quãng đường s theo phương của lực được tính bằng công thức:",
          options: ["A = F.s", "A = F/s", "A = F.s²", "A = m.g.h"],
          answer: "A = F.s",
          explanation: "Khi lực cùng hướng với độ dịch chuyển (α = 0°), A = F.s.cos(0°) = F.s."
        }
      ],
      Essay: [
        {
          question: "Phát biểu và viết biểu thức của định luật bảo toàn cơ năng cho một vật chuyển động chỉ dưới tác dụng của trọng lực.",
          answer: "Phát biểu: Khi một vật chuyển động trong trọng trường chỉ chịu tác dụng của trọng lực thì cơ năng của vật là một đại lượng bảo toàn. Biểu thức: W = Wđ + Wt = (1/2)mv² + mgz = const."
        },
        {
          question: "Nêu nguyên tắc hoạt động của máy biến áp và giải thích tại sao máy biến áp chỉ hoạt động với dòng điện xoay chiều mà không hoạt động với dòng điện một chiều không đổi.",
          answer: "Máy biến áp hoạt động dựa trên hiện tượng cảm ứng điện từ. Dòng xoay chiều tạo ra từ thông biến thiên qua cuộn thứ cấp, sinh ra suất điện động cảm ứng. Dòng một chiều không đổi tạo ra từ trường không đổi, từ thông không biến thiên nên không sinh ra suất điện động."
        }
      ]
    };
  }

  if (subject === "Hóa học") {
    return {
      "Multiple Choice": [
        {
          question: "Công thức hóa học của nước là:",
          options: ["H2O", "CO2", "NaCl", "O2"],
          answer: "H2O",
          explanation: "Một phân tử nước gồm 2 nguyên tử H và 1 nguyên tử O liên kết với nhau."
        },
        {
          question: "Dung dịch nào sau đây làm quỳ tím chuyển sang màu đỏ?",
          options: ["HCl", "NaOH", "NaCl", "Ca(OH)2"],
          answer: "HCl",
          explanation: "Axit clohiđric (HCl) là axit mạnh làm quỳ tím chuyển sang màu đỏ."
        },
        {
          question: "Khí nào sau đây duy trì sự cháy và sự sống?",
          options: ["Oxy (O2)", "Nitơ (N2)", "Cacbonic (CO2)", "Hiđro (H2)"],
          answer: "Oxy (O2)",
          explanation: "Khí O2 có vai trò duy trì hô hấp của sinh vật và quá trình đốt cháy."
        },
        {
          question: "Kim loại nào dẫn điện tốt nhất trong các kim loại sau?",
          options: ["Bạc (Ag)", "Đồng (Cu)", "Nhôm (Al)", "Vàng (Au)"],
          answer: "Bạc (Ag)",
          explanation: "Thứ tự dẫn điện giảm dần: Ag > Cu > Au > Al > Fe."
        },
        {
          question: "Chất nào sau đây là este?",
          options: ["CH3COOC2H5", "CH3COOH", "C2H5OH", "CH3CHO"],
          answer: "CH3COOC2H5",
          explanation: "Etyl axetat (CH3COOC2H5) có nhóm chức este -COO-."
        },
        {
          question: "Số mol của 5.6 gam Fe (M = 56 g/mol) là:",
          options: ["0.1 mol", "0.2 mol", "0.05 mol", "1 mol"],
          answer: "0.1 mol",
          explanation: "n = m / M = 5.6 / 56 = 0.1 mol."
        }
      ],
      Essay: [
        {
          question: "Cho 6.5g kẽm (Zn) tác dụng hoàn toàn với dung dịch axit clohiđric (HCl) dư. Viết PTHH và tính thể tích khí H2 sinh ra ở điều kiện chuẩn (đkc: 1 mol = 24.79 lít). (Biết Zn = 65).",
          answer: "PTHH: Zn + 2HCl -> ZnCl2 + H2. Số mol Zn: n_Zn = 6.5 / 65 = 0.1 mol. Theo PTHH: n_H2 = n_Zn = 0.1 mol. Thể tích khí H2 ở đkc: V = 0.1 x 24.79 = 2.479 lít."
        },
        {
          question: "Nêu hiện tượng và viết phương trình hóa học khi sục khí CO2 từ từ đến dư vào dung dịch nước vôi trong Ca(OH)2.",
          answer: "Hiện tượng: Ban đầu xuất hiện kết tủa trắng làm đục dung dịch: CO2 + Ca(OH)2 -> CaCO3↓ + H2O. Khi sục CO2 đến dư, kết tủa tan dần tạo dung dịch trong suốt: CaCO3 + CO2 + H2O -> Ca(HCO3)2."
        }
      ]
    };
  }

  if (subject === "Ngữ văn") {
    return {
      "Multiple Choice": [
        {
          question: "Tác giả của bài thơ 'Đồng chí' là nhà thơ nào?",
          options: ["Chính Hữu", "Phạm Tiến Duật", "Huy Cận", "Bằng Việt"],
          answer: "Chính Hữu",
          explanation: "Bài thơ 'Đồng chí' sáng tác năm 1948 bởi nhà thơ Chính Hữu."
        },
        {
          question: "Biện pháp tu từ nào được sử dụng trong câu: 'Mặt trời của bắp thì nằm trên đồi / Mặt trời của mẹ, em nằm trên lưng'?",
          options: ["Ẩn dụ", "Hoán dụ", "So sánh", "Điệp ngữ"],
          answer: "Ẩn dụ",
          explanation: "'Mặt trời của mẹ' là hình ảnh ẩn dụ biểu thị đứa con là nguồn sống, niềm tin yêu của người mẹ."
        },
        {
          question: "Văn bản 'Tuyên ngôn Độc lập' của Chủ tịch Hồ Chí Minh được đọc tại Quảng trường Ba Đình vào ngày tháng năm nào?",
          options: ["02/09/1945", "19/08/1945", "30/04/1975", "07/05/1954"],
          answer: "02/09/1945",
          explanation: "Bản Tuyên ngôn Độc lập khai sinh nước VNDCCH được Bác đọc vào ngày 2/9/1945."
        },
        {
          question: "Trong 'Truyện Kiều' của Nguyễn Du, nàng Kiều đã phải bán mình chuộc ai?",
          options: ["Chuộc cha và em", "Chuộc người yêu", "Chuộc mẹ", "Chuộc chị gái"],
          answer: "Chuộc cha và em",
          explanation: "Kiều quyết định bán mình để chuộc cha (Vương ông) và em trai (Vương Quan) khỏi vòng oan khuất."
        },
        {
          question: "Nhân vật Lão Hạc trong truyện ngắn cùng tên của Nam Cao đã gửi gắm ai giữ vườn và tiền ma chay?",
          options: ["Ông giáo", "Binh Tư", "Thằng Cương", "Bà lão hàng xóm"],
          answer: "Ông giáo",
          explanation: "Lão Hạc gửi mảnh vườn và số tiền dành dụm cho ông giáo nhờ trông nom và lo hậu sự cho mình."
        }
      ],
      Essay: [
        {
          question: "Cảm nhận của em về vẻ đẹp tình đồng chí, đồng đội gắn bó keo sơn trong bài thơ 'Đồng chí' của nhà thơ Chính Hữu.",
          answer: "Học sinh cần làm nổi bật: 1. Cơ sở hình thành tình đồng chí (cùng cảnh ngộ nghèo khó, chung lý tưởng cứu nước). 2. Những biểu hiện cảm động (chia sẻ gian lao, thấu hiểu tâm tư, cùng chịu rét buốt). 3. Biểu tượng bất tử 'Đầu súng trăng treo' thể hiện vẻ đẹp tâm hồn người lính vừa hiện thực vừa lãng mạn."
        },
        {
          question: "Viết đoạn văn nghị luận xã hội (khoảng 150 chữ) bàn về ý nghĩa của lòng biết ơn trong cuộc sống hiện đại.",
          answer: "Lòng biết ơn là nền tảng đạo đức cốt lõi giúp con người trân trọng những gì mình nhận được từ gia đình, thầy cô và xã hội. Người có lòng biết ơn luôn sống khiêm tốn, biết sẻ chia và tạo dựng các mối quan hệ nhân văn bền vững."
        }
      ]
    };
  }

  // Default rich template for other subjects (Lịch sử, Địa lý, GDCD, Tin học, KHTN...)
  return {
    "Multiple Choice": [
      {
        question: `Khái niệm cơ bản và phương pháp nghiên cứu đặc trưng của môn ${subject} (${GRADES[gradeIdx]}) là gì?`,
        options: [
          `Nắm vững quy luật cốt lõi, quan sát thực tế và phân tích khoa học`,
          `Học thuộc lòng thụ động không cần liên hệ thực tế`,
          `Bỏ qua các nguyên lý nền tảng để ghi nhớ ngẫu nhiên`,
          `Chỉ thực hành mà không cần hệ thống lý thuyết`
        ],
        answer: `Nắm vững quy luật cốt lõi, quan sát thực tế và phân tích khoa học`,
        explanation: `Phương pháp học tập hiện đại yêu cầu tư duy logic, kết hợp lý thuyết và liên hệ thực tiễn môn ${subject}.`
      },
      {
        question: `Ứng dụng quan trọng nhất của kiến thức ${subject} trong đời sống và khoa học kỹ thuật hiện nay là:`,
        options: [
          `Nâng cao hiểu biết, giải quyết vấn đề thực tế và phát triển tư duy sáng tạo`,
          `Không có ứng dụng nào trong thế giới số`,
          `Chỉ dùng để làm bài kiểm tra trên lớp`,
          `Thay thế hoàn toàn mọi ngành khoa học khác`
        ],
        answer: `Nâng cao hiểu biết, giải quyết vấn đề thực tế và phát triển tư duy sáng tạo`,
        explanation: `Kiến thức môn ${subject} trang bị nền tảng năng lực toàn diện cho học sinh.`
      },
      {
        question: `Để học tốt môn ${subject} ở cấp độ ${GRADES[gradeIdx]}, phương pháp nào sau đây mang lại hiệu quả cao nhất?`,
        options: [
          `Lập sơ đồ tư duy, làm bài tập vận dụng và liên hệ thực tế`,
          `Học dồn vào đêm trước ngày thi`,
          `Sao chép bài giải sẵn có mà không tự suy nghĩ`,
          `Chỉ học các câu dễ bỏ qua các câu vận dụng`
        ],
        answer: `Lập sơ đồ tư duy, làm bài tập vận dụng và liên hệ thực tế`,
        explanation: `Sơ đồ tư duy và bài tập thực hành giúp kiến thức được khắc sâu và ứng dụng linh hoạt.`
      },
      {
        question: `Đặc điểm nổi bật của chương trình môn ${subject} theo chuẩn giáo dục phổ thông hiện hành là:`,
        options: [
          `Phát triển phẩm chất và năng lực thực tiễn của người học`,
          `Tăng nặng tính hàn lâm và bài tập máy móc`,
          `Giảm tính tương tác và thực hành thực tế`,
          `Không tích hợp liên môn`
        ],
        answer: `Phát triển phẩm chất và năng lực thực tiễn của người học`,
        explanation: `Chương trình chú trọng phát triển năng lực tự học, tư duy phản biện và vận dụng vào đời sống.`
      }
    ],
    Essay: [
      {
        question: `Em hãy trình bày hiểu biết của mình về một chủ đề trọng tâm trong môn ${subject} (${GRADES[gradeIdx]}) và nêu ví dụ thực tế liên hệ.`,
        answer: `Học sinh cần: 1. Nêu chính xác định nghĩa/quy luật trọng tâm. 2. Phân tích các yếu tố cấu thành. 3. Đưa ra ít nhất 1 ví dụ cụ thể minh họa trong thực tế đời sống.`
      },
      {
        question: `Tại sao việc rèn luyện kỹ năng tự học và tư duy phản biện lại đóng vai trò quyết định khi nghiên cứu môn ${subject}?`,
        answer: `Tự học giúp chủ động mở rộng tri thức, thích ứng với sự thay đổi của công nghệ. Tư duy phản biện giúp phân biệt thông tin đúng sai, đánh giá vấn đề đa chiều và đưa ra giải pháp tối ưu.`
      }
    ]
  };
}

export function generateTestQuestions(
  subject: SubjectName,
  grade: string,
  testType: "Trắc nghiệm" | "Tự luận" | "Kết hợp",
  mcRatio: number,
  totalQ: number,
  customQuestions?: { "Multiple Choice"?: MultipleChoiceQ[]; Essay?: EssayQ[]; mc?: MultipleChoiceQ[]; es?: EssayQ[] }
): { mc: MultipleChoiceQ[]; es: EssayQ[] } {
  const gradeIdx = Math.max(0, GRADES.indexOf(grade));
  const source = customQuestions || getRealQuestions(subject, gradeIdx);

  const rawMc: MultipleChoiceQ[] =
    source["Multiple Choice"] || ("mc" in source && source.mc ? source.mc : []);
  const rawEs: EssayQ[] =
    source.Essay || ("es" in source && source.es ? source.es : []);

  let numMc = 0;
  let numEs = 0;

  if (testType === "Trắc nghiệm") {
    numMc = totalQ;
    numEs = 0;
  } else if (testType === "Tự luận") {
    numMc = 0;
    numEs = totalQ;
  } else {
    numMc = Math.round(totalQ * (mcRatio / 100));
    numEs = totalQ - numMc;
  }

  // Shuffle sample helper
  const pickRandom = <T>(arr: T[], count: number): T[] => {
    if (!arr || arr.length === 0) return [];
    const copy = [...arr];
    const result: T[] = [];
    while (result.length < count) {
      if (copy.length === 0) {
        // Recycle if needed
        copy.push(...arr);
      }
      const randIdx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(randIdx, 1)[0]);
    }
    return result;
  };

  const selectedMc: MultipleChoiceQ[] = pickRandom<MultipleChoiceQ>(rawMc, numMc);
  const selectedEs: EssayQ[] = pickRandom<EssayQ>(rawEs, numEs);

  return { mc: selectedMc, es: selectedEs };
}
