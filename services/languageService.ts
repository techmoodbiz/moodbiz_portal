
import { LanguageCode, NlpIssue, NlpResponse } from '../types';

/**
 * KHỐI NGÔN NGỮ - GIAI ĐOẠN 1: TECHNICAL SCANNING
 * Xử lý các đặc tính vật lý của văn bản trước khi AI can thiệp.
 */
export const LanguageService = {
  analyzeText: async (
    text: string, 
    language: LanguageCode,
    tasks: ("preprocess" | "annotate" | "quality")[] = ["preprocess", "quality"]
  ): Promise<NlpResponse> => {
    // 1. Preprocess: Chuẩn hóa
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    const issues: NlpIssue[] = [];

    // 2. Quality: Kiểm tra lỗi "cứng" (Heuristics)
    if (tasks.includes("quality")) {
      // Check khoảng trắng thừa (Double spaces)
      if (/\s\s+/.test(text)) {
        issues.push({
          dimension: "language",
          severity: "low",
          message: "Phát hiện khoảng trắng kép (Double spaces).",
          problematic_text: "  "
        });
      }

      // Check dấu cách trước dấu câu (Lỗi phổ biến trong tiếng Việt)
      const punctuationSpacing = [
        { regex: /\s([.,!?:;])/, label: "dấu câu" },
      ];

      punctuationSpacing.forEach(p => {
        const match = text.match(p.regex);
        if (match) {
          issues.push({
            dimension: "language",
            severity: "low",
            message: `Quy chuẩn: Không được đặt dấu cách trước ${p.label}.`,
            problematic_text: match[0]
          });
        }
      });

      sentences.forEach((s, idx) => {
        const wordCount = s.split(/\s+/).length;
        
        // Cảnh báo câu quá dài
        if (wordCount > 35) {
          issues.push({
            dimension: "language",
            severity: "medium",
            message: `Câu quá dài (${wordCount} từ). Có thể gây khó hiểu cho người đọc.`,
            problematic_text: s.length > 60 ? s.substring(0, 60) + "..." : s,
            sentence_idx: idx
          });
        }

        // Cảnh báo lặp từ lủng củng
        const redundancyPatterns = [/rất rất/i, /cực kỳ là/i, /thì là mà/i];
        redundancyPatterns.forEach(pattern => {
          const match = s.match(pattern);
          if (match) {
            issues.push({
              dimension: "language",
              severity: "low",
              message: `Văn phong lủng củng, lặp từ không cần thiết: "${match[0]}"`,
              problematic_text: match[0],
              sentence_idx: idx
            });
          }
        });
      });
    }

    return {
      language,
      stats: {
        word_count: words.length,
        sentence_count: sentences.length,
        paragraph_count: paragraphs.length
      },
      potential_issues: issues,
      processed_text: text
    };
  }
};
