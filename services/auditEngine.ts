
import { Brand, Product, AuditRule, NlpResponse } from '../types';
import { PLATFORM_CONFIGS } from '../constants';

/**
 * MODULE 1: LANGUAGE & TECHNICAL STYLE
 */
export const LanguageModule = {
  getInstructions: (rules: AuditRule[], language: string, platform: string, nlp?: NlpResponse) => {
    const langRules = rules
      .filter(r => r.type === 'language')
      .map(r => `- [SOP ${r.label}]: ${r.content}`)
      .join('\n');

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 1: LANGUAGE & STYLE (NGÔN NGỮ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tiêu chuẩn Kênh (${platform}): ${PLATFORM_CONFIGS[platform]?.audit_rules || "Đảm bảo đúng định dạng platform."}
- Quy chuẩn SOP:
${langRules || "- Đúng chính tả, không thừa dấu cách, không viết hoa vô tội vạ."}
${nlp ? `- Dữ liệu NLP: ${nlp.stats.word_count} từ, ${nlp.stats.sentence_count} câu.` : ""}

NHIỆM VỤ: Soi lỗi trình bày, định dạng, khoảng trắng thừa, và kỹ thuật viết của kênh đăng tải.
`;
  }
};

/**
 * MODULE 2: AI LOGIC & FACTUAL ACCURACY
 */
export const LogicModule = {
  getInstructions: (rules: AuditRule[]) => {
    const logicRules = rules
      .filter(r => r.type === 'ai_logic')
      .map(r => `- [SOP ${r.label}]: ${r.content}`)
      .join('\n');

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 2: AI LOGIC & ACCURACY (LOGIC AI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Quy chuẩn Logic:
${logicRules || "- Thông tin phải nhất quán.\n- Không có sự mâu thuẫn về số liệu hoặc mốc thời gian."}

NHIỆM VỤ: Phát hiện thông tin sai lệch, ảo giác AI (hallucinations), mâu thuẫn logic trong lập luận.
`;
  }
};

/**
 * MODULE 3: BRAND IDENTITY & VOICE (PHẢI CHECK ĐỦ 5 YẾU TỐ)
 */
export const BrandModule = {
  getInstructions: (brand: Brand, rules: AuditRule[]) => {
    const brandRules = rules
      .filter(r => r.type === 'brand')
      .map(r => `- [SOP ${r.label}]: ${r.content}`)
      .join('\n');

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 3: BRAND IDENTITY (THƯƠNG HIỆU - 5 CHECKPOINTS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dữ liệu gốc từ Brand Profile của ${brand.name}:
1. [BRAND VOICE]: ${brand.voice || brand.tone_of_voice || 'Chưa xác định'}
2. [PERSONALITY]: ${brand.brand_personality?.join(', ') || brand.personality || 'Chưa xác định'}
3. [CORE VALUES]: ${brand.core_values?.join(', ') || 'Chưa xác định'}
4. [DO WORDS - BẮT BUỘC DÙNG]: ${brand.do_words?.join(', ') || 'Không có'}
5. [DON'T WORDS - CẤM DÙNG]: ${brand.dont_words?.join(', ') || 'Không có'}

Quy chuẩn SOP bổ sung:
${brandRules || "- Tuyệt đối trung thành với bản sắc thương hiệu."}

NHIỆM VỤ AUDIT KHỐI BRAND:
- Soi lỗi Voice/Tone: Văn bản có quá trang trọng hay quá suồng sã so với Voice quy định không?
- Soi lỗi Personality: Có thể hiện đúng tính cách đã định nghĩa không?
- Soi lỗi Core Values: Nội dung có đi ngược lại hoặc làm sai lệch giá trị cốt lõi không?
- Soi lỗi Từ Ngữ: Kiểm tra triệt để danh sách "Don't Words" và "Do Words".
`;
  }
};

/**
 * MODULE 4: PRODUCT & SERVICE ALIGNMENT
 */
export const ProductModule = {
  getInstructions: (rules: AuditRule[], product?: Product) => {
    const productRules = rules
      .filter(r => r.type === 'product')
      .map(r => `- [SOP ${r.label}]: ${r.content}`)
      .join('\n');

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 4: PRODUCT PROFILE (SẢN PHẨM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${product ? `
- Tên SP/DV: ${product.name}
- Tệp khách hàng: ${product.target_audience}
- Công dụng: ${product.benefits}
- USP: ${product.usp}
` : "- Phải nêu đúng lợi ích cốt lõi của giải pháp."}
- SOP Sản phẩm:
${productRules || "- Không nói sai công dụng hoặc bỏ qua USP quan trọng."}

NHIỆM VỤ: Kiểm tra xem bài viết có đang mô tả sai tính năng, sai USP hoặc nhắm sai đối tượng khách hàng không.
`;
  }
};

/**
 * MAIN ORCHESTRATOR
 */
export const assembleAuditPrompt = (payload: {
  text: string,
  brand: Brand,
  product?: Product,
  rules: AuditRule[],
  language: string,
  platform: string,
  nlp?: NlpResponse
}) => {
  const { text, brand, product, rules, language, platform, nlp } = payload;

  return `
Bạn là Hệ thống MOODBIZ AI Auditor v6.0 (Hạng Enterprise).
Nhiệm vụ của bạn là thực hiện đối soát văn bản dựa trên 4 LỚP QUY CHUẨN ĐỘC LẬP. 

PHƯƠNG CHÂM: "Khắt khe - Chính xác - Không khoan nhượng". 
Nếu văn bản vi phạm bất kỳ tiêu chí nào trong 4 lớp dưới đây, hãy báo lỗi ngay lập tức.

${LanguageModule.getInstructions(rules, language, platform, nlp)}
${LogicModule.getInstructions(rules)}
${BrandModule.getInstructions(brand, rules)}
${ProductModule.getInstructions(rules, product)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VĂN BẢN CẦN KIỂM DUYỆT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${text}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YÊU CẦU ĐẦU RA (JSON ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gán lỗi vào đúng 1 trong 4 category: "language", "ai_logic", "brand", "product".
Lưu ý: Lỗi về Voice, Personality, Core Values, Do/Don't Words PHẢI được xếp vào "brand".

{
  "summary": "Tóm tắt ngắn gọn về các rủi ro phát hiện được.",
  "overall_score": 0-100,
  "identified_issues": [
    {
      "category": "language | ai_logic | brand | product",
      "problematic_text": "TRÍCH DẪN NGUYÊN VĂN CÂU/TỪ LỖI",
      "reason": "Giải thích chi tiết lỗi dựa trên SOP hoặc Profile cụ thể",
      "severity": "High | Medium | Low",
      "suggestion": "Cách sửa cụ thể để đạt chuẩn"
    }
  ],
  "rewritten_text": "Bản nội dung đã được tối ưu hoàn toàn, tuân thủ 100% 4 lớp quy chuẩn."
}
`;
};
