import { jsPDF } from "jspdf";
import { MultipleChoiceQ, EssayQ } from "../types";

export interface PDFExportOptions {
  title: string;
  subject: string;
  grade: string;
  semester: string;
  duration: number;
  questions: {
    mc: MultipleChoiceQ[];
    es: EssayQ[];
  };
  schoolName?: string;
  teacherName?: string;
  includeAnswerKey?: boolean;
}

export function generateExamPDF(options: PDFExportOptions): void {
  const {
    title,
    subject,
    grade,
    semester,
    duration,
    questions,
    schoolName = "SỞ GIÁO DỤC & ĐÀO TẠO - TRƯỜNG CHUẨN QUỐC GIA",
    teacherName,
    includeAnswerKey = true,
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let y = 20;

  // Helper to check page overflow
  const checkAddPage = (neededSpace: number = 20) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Header Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(schoolName.toUpperCase(), margin, y);
  if (teacherName) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`GV ra đề: ${teacherName}`, margin, y + 5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BÀI KIỂM TRA ĐÁNH GIÁ CHUẨN BỘ GD&ĐT", pageWidth - margin, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Kỳ học: ${semester} - Năm học 2024-2025`, pageWidth - margin, y + 5, { align: "right" });

  y += 12;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Exam Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`MÔN THI: ${subject.toUpperCase()} - ${grade.toUpperCase()}`, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(`Thời gian làm bài: ${duration} phút (Không kể thời gian phát đề)`, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Student Info Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.rect(margin, y, contentWidth, 14);
  doc.text("Họ và tên thí sinh: ....................................................................................", margin + 4, y + 5);
  doc.text("Lớp: ........................   SBD: ........................", margin + 4, y + 10);
  doc.text("Điểm số: ..................", margin + contentWidth - 45, y + 5);
  doc.text("Lời phê: ..................", margin + contentWidth - 45, y + 10);

  y += 20;

  // Section I: Multiple Choice
  if (questions.mc && questions.mc.length > 0) {
    checkAddPage(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PHẦN I. TRẮC NGHIỆM KHÁCH QUAN (Chọn 01 đáp án đúng nhất)", margin, y);
    y += 7;

    questions.mc.forEach((q, idx) => {
      checkAddPage(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const qText = `Câu ${idx + 1}: ${q.question}`;
      const splitQ = doc.splitTextToSize(qText, contentWidth);
      doc.text(splitQ, margin, y);
      y += splitQ.length * 5;

      doc.setFont("helvetica", "normal");
      const optLabels = ["A", "B", "C", "D"];
      const colWidth = contentWidth / 2;

      q.options.forEach((opt, oIdx) => {
        const label = optLabels[oIdx] || String.fromCharCode(65 + oIdx);
        const col = oIdx % 2;
        const posX = margin + col * colWidth;
        const optText = `[   ]  ${label}. ${opt}`;
        const splitOpt = doc.splitTextToSize(optText, colWidth - 5);

        doc.text(splitOpt, posX + 2, y);

        if (col === 1 || oIdx === q.options.length - 1) {
          y += Math.max(splitOpt.length * 4.5, 5);
        }
      });

      y += 2;
    });
  }

  // Section II: Essay
  if (questions.es && questions.es.length > 0) {
    checkAddPage(20);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PHẦN II. TỰ LUẬN & VẬN DỤNG", margin, y);
    y += 7;

    questions.es.forEach((q, idx) => {
      checkAddPage(35);
      const qNum = (questions.mc?.length || 0) + idx + 1;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const qText = `Câu ${qNum}: ${q.question}`;
      const splitQ = doc.splitTextToSize(qText, contentWidth);
      doc.text(splitQ, margin, y);
      y += splitQ.length * 5 + 2;

      // Blank writing lines
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      for (let i = 0; i < 4; i++) {
        checkAddPage(8);
        doc.line(margin + 5, y + 4, pageWidth - margin, y + 4);
        y += 6;
      }
      y += 3;
    });
  }

  // End of test marker
  checkAddPage(15);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text("-------------------- HẾT --------------------", pageWidth / 2, y + 4, { align: "center" });
  doc.text("Cán bộ coi thi không giải thích gì thêm.", pageWidth / 2, y + 9, { align: "center" });

  // Answer Key Page
  if (includeAnswerKey) {
    doc.addPage();
    y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT", pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Đề thi: ${subject} - ${grade} (${semester})`, pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    if (questions.mc && questions.mc.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("1. ĐÁP ÁN PHẦN TRẮC NGHIỆM:", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);

      // Table grid for MC answers
      const itemsPerRow = 5;
      const cellW = contentWidth / itemsPerRow;
      const cellH = 7;

      for (let i = 0; i < questions.mc.length; i += itemsPerRow) {
        checkAddPage(15);
        const rowItems = questions.mc.slice(i, i + itemsPerRow);

        // Header row
        rowItems.forEach((_, colIdx) => {
          const x = margin + colIdx * cellW;
          doc.rect(x, y, cellW, cellH);
          doc.setFont("helvetica", "bold");
          doc.text(`Câu ${i + colIdx + 1}`, x + cellW / 2, y + 5, { align: "center" });
        });
        y += cellH;

        // Key row
        rowItems.forEach((q, colIdx) => {
          const x = margin + colIdx * cellW;
          doc.rect(x, y, cellW, cellH);
          doc.setFont("helvetica", "normal");
          doc.text(String(q.answer).substring(0, 15), x + cellW / 2, y + 5, { align: "center" });
        });
        y += cellH + 2;
      }
      y += 6;
    }

    if (questions.es && questions.es.length > 0) {
      checkAddPage(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("2. HƯỚNG DẪN CHẤM PHẦN TỰ LUẬN & BIỂU ĐIỂM:", margin, y);
      y += 7;

      questions.es.forEach((q, idx) => {
        checkAddPage(25);
        const qNum = (questions.mc?.length || 0) + idx + 1;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Câu ${qNum}: ${q.question}`, margin, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        const ansText = `Gợi ý đáp án / Biểu điểm: ${q.answer}`;
        const splitAns = doc.splitTextToSize(ansText, contentWidth - 5);
        doc.text(splitAns, margin + 4, y);
        y += splitAns.length * 5 + 4;
      });
    }
  }

  // Save / Download
  const filename = `De_Thi_${subject}_${grade}_${new Date().toISOString().slice(0, 10)}.pdf`.replace(/\s+/g, "_");
  doc.save(filename);
}

// Printable HTML trigger for immediate native browser print preview
export function printExamLayout(options: PDFExportOptions): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Vui lòng cho phép popup để mở bản in đề thi!");
    return;
  }

  const {
    title,
    subject,
    grade,
    semester,
    duration,
    questions,
    schoolName = "TRƯỜNG THCS / THPT CHUẨN QUỐC GIA",
    teacherName = "Ban Khảo Thí & Chuyên Môn",
  } = options;

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${title || `Đề thi ${subject} ${grade}`}</title>
      <style>
        body {
          font-family: 'Roboto', 'Times New Roman', serif;
          margin: 20mm;
          color: #111;
          line-height: 1.4;
        }
        .header-table {
          width: 100%;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .title-section {
          text-align: center;
          margin: 15px 0;
        }
        .title-section h1 {
          font-size: 18pt;
          margin: 0;
          text-transform: uppercase;
        }
        .title-section p {
          font-style: italic;
          margin: 4px 0 0 0;
        }
        .info-box {
          border: 1px solid #333;
          padding: 8px;
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 11pt;
        }
        .section-title {
          font-weight: bold;
          font-size: 12pt;
          margin-top: 15px;
          margin-bottom: 8px;
        }
        .question-item {
          margin-bottom: 12px;
          page-break-inside: avoid;
        }
        .q-title {
          font-weight: bold;
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-top: 4px;
          padding-left: 10px;
        }
        .essay-lines {
          margin-top: 10px;
          border-bottom: 1px dashed #999;
          height: 25px;
        }
        .page-break {
          page-break-before: always;
        }
        @media print {
          body { margin: 15mm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">🖨️ In Đề Thi Ngay</button>
      </div>

      <table class="header-table">
        <tr>
          <td style="width: 50%;">
            <b>${schoolName}</b><br>
            <i>GV ra đề: ${teacherName}</i>
          </td>
          <td style="width: 50%; text-align: right;">
            <b>BÀI KIỂM TRA ĐỊNH KỲ</b><br>
            <i>${semester} - Năm học 2024-2025</i>
          </td>
        </tr>
      </table>

      <div class="title-section">
        <h1>MÔN: ${subject} - ${grade}</h1>
        <p>Thời gian làm bài: ${duration} phút (Không kể thời gian phát đề)</p>
      </div>

      <div class="info-box">
        <div>
          Họ và tên thí sinh: ...................................................................<br>
          Lớp: ......................... SBD: ...........................................
        </div>
        <div style="text-align: right;">
          Điểm số: .......................<br>
          Lời phê: .......................
        </div>
      </div>

      ${
        questions.mc?.length
          ? `
        <div class="section-title">I. TRẮC NGHIỆM KHÁCH QUAN (${questions.mc.length} câu)</div>
        ${questions.mc
          .map(
            (q, idx) => `
          <div class="question-item">
            <div class="q-title">Câu ${idx + 1}: ${q.question}</div>
            <div class="options-grid">
              ${q.options
                .map((opt, oIdx) => `<div>[   ] ${String.fromCharCode(65 + oIdx)}. ${opt}</div>`)
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
      `
          : ""
      }

      ${
        questions.es?.length
          ? `
        <div class="section-title">II. TỰ LUẬN & VẬN DỤNG (${questions.es.length} câu)</div>
        ${questions.es
          .map(
            (q, idx) => `
          <div class="question-item">
            <div class="q-title">Câu ${(questions.mc?.length || 0) + idx + 1}: ${q.question}</div>
            <div class="essay-lines"></div>
            <div class="essay-lines"></div>
            <div class="essay-lines"></div>
          </div>
        `
          )
          .join("")}
      `
          : ""
      }

      <div style="text-align: center; margin-top: 30px; font-style: italic;">
        -------------------- HẾT --------------------<br>
        Cán bộ coi thi không giải thích gì thêm.
      </div>

      <div class="page-break"></div>

      <div class="title-section">
        <h1>ĐÁP ÁN & HƯỚNG DẪN CHẤM CHI TIẾT</h1>
        <p>${subject} - ${grade} (${semester})</p>
      </div>

      ${
        questions.mc?.length
          ? `
        <div class="section-title">1. ĐÁP ÁN TRẮC NGHIỆM</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" border="1">
          <tr style="background: #f0f0f0;">
            ${questions.mc.map((_, i) => `<th style="padding: 4px;">Câu ${i + 1}</th>`).join("")}
          </tr>
          <tr>
            ${questions.mc.map((q) => `<td style="padding: 6px; text-align: center; font-weight: bold;">${q.answer}</td>`).join("")}
          </tr>
        </table>
      `
          : ""
      }

      ${
        questions.es?.length
          ? `
        <div class="section-title">2. ĐÁP ÁN TỰ LUẬN & BIỂU ĐIỂM</div>
        ${questions.es
          .map(
            (q, idx) => `
          <div style="margin-bottom: 12px;">
            <b>Câu ${(questions.mc?.length || 0) + idx + 1}:</b> ${q.question}<br>
            <i style="color: #2563eb;">Hướng dẫn chấm: ${q.answer}</i>
          </div>
        `
          )
          .join("")}
      `
          : ""
      }
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
