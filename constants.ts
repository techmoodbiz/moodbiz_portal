
import {
  Zap, Handshake, Target, Shield, LayoutDashboard, PenTool,
  Activity, FileText, BarChart2, Settings, Users, Building2,
  BookOpen, Package, ShieldAlert, FileSearch, Target as TargetIcon,
  Languages, BrainCircuit, Award, ShoppingBag, FileCode, UserCircle
} from 'lucide-react';

export const THEME = {
  navy: '#102d62',
  cyan: '#01ccff',
  white: '#ffffff',
  bg: '#f8f9fa',
  border: '#e2e8f0',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'Vietnamese', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'English', label: 'Tiếng Anh', flag: '🇺🇸' },
  { code: 'Japanese', label: 'Tiếng Nhật', flag: '🇯🇵' }
];

export const AUDIT_CATEGORIES = {
  language: { label: "Ngôn ngữ", icon: Languages, color: "text-blue-500", bg: "bg-blue-50", description: "Ngữ pháp, chính tả & dấu câu." },
  ai_logic: { label: "AI & Logic", icon: BrainCircuit, color: "text-purple-500", bg: "bg-purple-50", description: "Độ xác thực và logic nội dung." },
  brand: { label: "Thương hiệu", icon: Award, color: "text-[#102d62]", bg: "bg-slate-100", description: "Brand Voice, Tone & Positioning." },
  product: { label: "Sản phẩm", icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-50", description: "Tên, Công dụng & USP." }
};

export const PLATFORM_CONFIGS: Record<string, { desc: string, audit_rules: string }> = {
  'Facebook Post': {
    desc: 'Hook mạnh, đoạn văn ngắn, emoji phù hợp, CTA tương tác.',
    audit_rules: '- Kiểm tra Hook 3 dòng đầu.\n- Kiểm tra mật độ Emoji (không quá dày).\n- Kiểm tra tính tương tác của CTA.'
  },
  'Website / SEO Blog': {
    desc: 'Cấu trúc H1-H3 rõ ràng, mật độ từ khóa, phong cách chuyên gia.',
    audit_rules: '- Kiểm tra cấu trúc Heading (H1, H2, H3).\n- Kiểm tra tính học thuật/chuyên gia.\n- Kiểm tra CTA điều hướng.'
  },
  'Email Marketing': {
    desc: 'Tiêu đề gây tò mò, nội dung trực diện, cá nhân hóa, CTA rõ ràng.',
    audit_rules: '- Kiểm tra Subject Line (có hấp dẫn không).\n- Kiểm tra tính cá nhân hóa.\n- Kiểm tra vị trí và thông điệp CTA.'
  },
  'LinkedIn Article': {
    desc: 'Văn phong chuyên nghiệp B2B, chia sẻ insight, xây dựng uy tín.',
    audit_rules: '- Kiểm tra tính chuyên nghiệp (B2B Tone).\n- Kiểm tra giá trị cốt lõi/insight chia sẻ.\n- Kiểm tra định dạng (Bullet points, đoạn ngắn).'
  }
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'brand_owner', 'content_creator', 'viewer'] },
  
  { type: 'header', label: 'Creator Tools', roles: ['admin', 'brand_owner', 'content_creator'] },
  { id: 'generator', label: 'Content Generator', icon: PenTool, roles: ['admin', 'brand_owner', 'content_creator'] },
  { id: 'auditor', label: 'Content Auditor', icon: Activity, roles: ['admin', 'brand_owner', 'content_creator'] },
  
  { type: 'header', label: 'Archives', roles: ['admin', 'brand_owner', 'content_creator', 'viewer'] },
  { id: 'generations', label: 'Generator History', icon: BookOpen, roles: ['admin', 'brand_owner', 'content_creator', 'viewer'] },
  { id: 'audits', label: 'Auditor History', icon: ShieldAlert, roles: ['admin', 'brand_owner', 'content_creator', 'viewer'] },
  
  { type: 'header', label: 'Organization', roles: ['admin', 'brand_owner', 'content_creator'] },
  { id: 'analytics', label: 'Auditor Analytics', icon: BarChart2, roles: ['admin', 'brand_owner', 'content_creator'] },
  { id: 'products', label: 'Products & Services', icon: Package, roles: ['admin', 'brand_owner'] },
  { id: 'personas', label: 'Audience Personas', icon: UserCircle, roles: ['admin', 'brand_owner', 'content_creator'] },
  { id: 'guidelines', label: 'Brand Guidelines', icon: FileSearch, roles: ['admin', 'brand_owner', 'content_creator'] },
  
  { type: 'header', label: 'Administration', roles: ['admin', 'brand_owner'] },
  { id: 'brands', label: 'Brands Management', icon: Building2, roles: ['admin', 'brand_owner'] },
  { id: 'users', label: 'Users Management', icon: Users, roles: ['admin', 'brand_owner'] },
  
  { type: 'header', label: 'System', roles: ['admin'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export const GEN_PROMPTS_DEFAULTS: Record<string, string> = {
  'Facebook Post': `[VAI TRÒ]
Bạn là chuyên gia Social Media Manager (Facebook) cho thương hiệu {brand_name}.
Phong cách: {brand_voice}.
Cá tính: {brand_personality}.

[NHIỆM VỤ]
Viết bài đăng Facebook về chủ đề: "{topic}".
Ngôn ngữ: {language}.

[DỮ LIỆU SẢN PHẨM]
{product_context}

[YÊU CẦU KỸ THUẬT]
1. Hook (3 giây đầu): Bắt đầu bằng một câu hỏi, sự thật gây sốc hoặc insight đánh trúng tâm lý.
2. Thân bài: Ngắn gọn, chia đoạn rõ ràng, tập trung vào lợi ích (Benefits) thay vì chỉ tính năng (Features).
3. CTA (Call-to-Action): Rõ ràng, thôi thúc hành động (Comment/Inbox/Click).
4. Định dạng: Sử dụng icon/emoji hợp lý (không lạm dụng), dùng list nếu cần.
5. Tuân thủ: Dùng từ "{do_words}", TRÁNH TUYỆT ĐỐI từ "{dont_words}".
6. Lưu ý các lỗi thường gặp: {common_mistakes}

[OUTPUT]
Trả về nội dung bài viết hoàn chỉnh kèm gợi ý hình ảnh minh họa.`,

  'LinkedIn Article': `[VAI TRÒ]
Bạn là chuyên gia Thought Leader và Content Strategist B2B cho {brand_name}.
Phong cách: Chuyên nghiệp, sâu sắc, {brand_voice}.

[NHIỆM VỤ]
Viết bài đăng/article LinkedIn về chủ đề: "{topic}".
Ngôn ngữ: {language}.

[DỮ LIỆU SẢN PHẨM/DỊCH VỤ]
{product_context}

[YÊU CẦU KỸ THUẬT]
1. Headline: Chuyên nghiệp, gợi mở vấn đề doanh nghiệp hoặc xu hướng ngành.
2. Cấu trúc: Hook -> Vấn đề (Pain point) -> Giải pháp/Góc nhìn (Solution/Insight) -> Kết luận (Takeaway).
3. Tone & Voice: {brand_personality}. Tránh văn phong bán hàng sỗ sàng (Hard sell). Tập trung vào chia sẻ giá trị (Value-first).
4. Định dạng: Sử dụng bullet points để dễ đọc.
5. Tuân thủ: Dùng từ "{do_words}", TRÁNH TUYỆT ĐỐI từ "{dont_words}".
6. Lưu ý các lỗi thường gặp: {common_mistakes}

[OUTPUT]
Trả về nội dung bài viết hoàn chỉnh.`,

  'Website / SEO Blog': `[VAI TRÒ]
Bạn là chuyên gia SEO Content Writer và Copywriter cho {brand_name}.
Phong cách: Chuyên gia, tin cậy, {brand_voice}.

[NHIỆM VỤ]
Viết bài Blog chuẩn SEO về chủ đề: "{topic}".
Ngôn ngữ: {language}.

[DỮ LIỆU SẢN PHẨM]
{product_context}

[YÊU CẦU KỸ THUẬT]
1. Tiêu đề (H1): Chứa từ khóa chính, hấp dẫn click.
2. Cấu trúc: Có sapo (mở bài), các thẻ H2, H3 phân chia nội dung logic.
3. Nội dung: Đi sâu vào chi tiết, cung cấp thông tin hữu ích, giải quyết vấn đề của người đọc.
4. SEO: Tối ưu mật độ từ khóa tự nhiên.
5. Tuân thủ: Dùng từ "{do_words}", TRÁNH TUYỆT ĐỐI từ "{dont_words}".
6. Lưu ý các lỗi thường gặp: {common_mistakes}

[OUTPUT]
Trả về nội dung bài viết định dạng Markdown (H1, H2, H3, Bold, Italic).`,

  'Email Marketing': `[VAI TRÒ]
Bạn là chuyên gia Email Marketing và Conversion Copywriter cho {brand_name}.
Phong cách: Cá nhân hóa, trực diện, {brand_voice}.

[NHIỆM VỤ]
Viết Email Marketing về chủ đề: "{topic}".
Ngôn ngữ: {language}.

[DỮ LIỆU SẢN PHẨM]
{product_context}

[YÊU CẦU KỸ THUẬT]
1. Subject Line (Tiêu đề email): Tối ưu tỷ lệ mở (Open rate), gây tò mò hoặc đánh trúng nhu cầu.
2. Preheader: Bổ sung ý nghĩa cho tiêu đề.
3. Body: Cá nhân hóa, tập trung vào "You" (khách hàng), nêu rõ lợi ích.
4. CTA: Một mục tiêu duy nhất, nút bấm hoặc link rõ ràng.
5. Tuân thủ: Dùng từ "{do_words}", TRÁNH TUYỆT ĐỐI từ "{dont_words}".
6. Lưu ý các lỗi thường gặp: {common_mistakes}

[OUTPUT]
Trả về:
- Subject Line: ...
- Preheader: ...
- Body Content: ...`
};

export const DEFAULT_GEN_PROMPT = GEN_PROMPTS_DEFAULTS;

export const AUDIT_PROMPTS_DEFAULTS: Record<string, string> = {
  'Facebook Post': `Bạn là hệ thống QC MOODBIZ Ultra v3 (Chuyên Facebook).
Nhiệm vụ: Phân tích nội dung dựa trên 4 nguồn dữ liệu.

[DATA SOURCE 1: SOP RULES - FACEBOOK]
{sop_rules}
- Hook phải thu hút trong 3 giây đầu.
- Hình ảnh/Emoji phải phù hợp, không spam.
- CTA phải rõ ràng.

[DATA SOURCE 2: BRAND PROFILE]
Thương hiệu: {brand_name} | Giọng văn: {brand_voice} | Personality: {brand_personality} | Từ CẤM: {dont_words} | Từ NÊN DÙNG: {do_words}

[DATA SOURCE 3: PRODUCT PROFILE]
{product_context}

[DATA SOURCE 4: GUIDELINE]
{guideline}

[VĂN BẢN CẦN AUDIT]
"{text}"

[HƯỚNG DẪN VIẾT "REASON"]
Sử dụng cấu trúc "The Because Framework" (Nguyên nhân - Hệ quả).
Ví dụ: "Lỗi [A] do vi phạm [B] khiến [C]. Nên sửa thành [D]."

[YÊU CẦU ĐẦU RA JSON]
{
  "summary": "Tóm tắt rủi ro và đánh giá tổng quan.",
  "overall_score": 0-100,
  "identified_issues": [
    {
      "category": "language | ai_logic | brand | product",
      "problematic_text": "TRÍCH DẪN NGUYÊN VĂN",
      "reason": "Giải thích chi tiết theo cấu trúc Because Framework",
      "severity": "High | Medium | Low",
      "suggestion": "Cách sửa tối ưu cho Facebook"
    }
  ],
  "rewritten_text": "Bản tối ưu lại cho Facebook (giữ nguyên ý nghĩa nhưng sửa lỗi)"
}`,

  'LinkedIn Article': `Bạn là hệ thống QC MOODBIZ Ultra v3 (Chuyên LinkedIn).
Nhiệm vụ: Audit bài viết LinkedIn B2B.

[DATA SOURCE 1: SOP RULES - LINKEDIN]
{sop_rules}
- Tone phải chuyên nghiệp (Professional), không quá suồng sã.
- Cấu trúc bài viết phải logic, chia sẻ Insight hoặc Giá trị thực tế.
- Định dạng (Formatting) phải thoáng, dễ đọc trên mobile.

[DATA SOURCE 2: BRAND PROFILE]
Thương hiệu: {brand_name} | Giọng văn: {brand_voice} | Personality: {brand_personality} | Từ CẤM: {dont_words} | Từ NÊN DÙNG: {do_words}

[DATA SOURCE 3: PRODUCT PROFILE]
{product_context}

[DATA SOURCE 4: GUIDELINE]
{guideline}

[VĂN BẢN CẦN AUDIT]
"{text}"

[HƯỚNG DẪN VIẾT "REASON"]
Sử dụng cấu trúc "The Because Framework" (Nguyên nhân - Hệ quả).

[YÊU CẦU ĐẦU RA JSON]
{
  "summary": "Tóm tắt rủi ro.",
  "overall_score": 0-100,
  "identified_issues": [
    {
      "category": "language | ai_logic | brand | product",
      "problematic_text": "TRÍCH DẪN NGUYÊN VĂN",
      "reason": "Giải thích chi tiết theo cấu trúc Because Framework",
      "severity": "High | Medium | Low",
      "suggestion": "Cách sửa tối ưu cho LinkedIn"
    }
  ],
  "rewritten_text": "Bản tối ưu lại cho LinkedIn"
}`,

  'Website / SEO Blog': `Bạn là hệ thống QC MOODBIZ Ultra v3 (Chuyên SEO/Website).
Nhiệm vụ: Audit bài viết Blog/Website.

[DATA SOURCE 1: SOP RULES - SEO]
{sop_rules}
- Kiểm tra cấu trúc Heading (H1, H2, H3).
- Kiểm tra độ dài câu/đoạn văn (Readability).
- Kiểm tra tính nhất quán thông tin.

[DATA SOURCE 2: BRAND PROFILE]
Thương hiệu: {brand_name} | Giọng văn: {brand_voice} | Personality: {brand_personality} | Từ CẤM: {dont_words} | Từ NÊN DÙNG: {do_words}

[DATA SOURCE 3: PRODUCT PROFILE]
{product_context}

[DATA SOURCE 4: GUIDELINE]
{guideline}

[VĂN BẢN CẦN AUDIT]
"{text}"

[HƯỚNG DẪN VIẾT "REASON"]
Sử dụng cấu trúc "The Because Framework" (Nguyên nhân - Hệ quả).

[YÊU CẦU ĐẦU RA JSON]
{
  "summary": "Tóm tắt rủi ro SEO và Content.",
  "overall_score": 0-100,
  "identified_issues": [
    {
      "category": "language | ai_logic | brand | product",
      "problematic_text": "TRÍCH DẪN NGUYÊN VĂN",
      "reason": "Giải thích chi tiết theo cấu trúc Because Framework",
      "severity": "High | Medium | Low",
      "suggestion": "Cách sửa tối ưu cho Website"
    }
  ],
  "rewritten_text": "Bản tối ưu lại (định dạng Markdown)"
}`,

  'Email Marketing': `Bạn là hệ thống QC MOODBIZ Ultra v3 (Chuyên Email Marketing).
Nhiệm vụ: Audit Email gửi khách hàng.

[DATA SOURCE 1: SOP RULES - EMAIL]
{sop_rules}
- Tiêu đề (Subject Line) có bị spam trigger không? Có hấp dẫn không?
- Lời chào và mở đầu có cá nhân hóa không?
- CTA có rõ ràng và thôi thúc không?

[DATA SOURCE 2: BRAND PROFILE]
Thương hiệu: {brand_name} | Giọng văn: {brand_voice} | Personality: {brand_personality} | Từ CẤM: {dont_words} | Từ NÊN DÙNG: {do_words}

[DATA SOURCE 3: PRODUCT PROFILE]
{product_context}

[DATA SOURCE 4: GUIDELINE]
{guideline}

[VĂN BẢN CẦN AUDIT]
"{text}"

[HƯỚNG DẪN VIẾT "REASON"]
Sử dụng cấu trúc "The Because Framework" (Nguyên nhân - Hệ quả).

[YÊU CẦU ĐẦU RA JSON]
{
  "summary": "Tóm tắt rủi ro Email.",
  "overall_score": 0-100,
  "identified_issues": [
    {
      "category": "language | ai_logic | brand | product",
      "problematic_text": "TRÍCH DẪN NGUYÊN VĂN",
      "reason": "Giải thích chi tiết theo cấu trúc Because Framework",
      "severity": "High | Medium | Low",
      "suggestion": "Cách sửa tối ưu cho Email"
    }
  ],
  "rewritten_text": "Bản tối ưu lại cho Email"
}`
};

export const SOCIAL_AUDIT_PROMPT = AUDIT_PROMPTS_DEFAULTS['Facebook Post'];
export const WEBSITE_AUDIT_PROMPT = AUDIT_PROMPTS_DEFAULTS['Website / SEO Blog'];

export const COMPANY_STATS = [
  { label: 'Brands', value: '' },
  { label: 'Generations', value: '' },
  { label: 'Audits', value: '' },
  { label: 'Users', value: '' },
];

export const CORE_VALUES = [
  { title: 'Chất lượng', desc: 'Đảm bảo nội dung luôn đạt chuẩn cao nhất.', icon: Shield },
  { title: 'Sáng tạo', desc: 'Ứng dụng AI để bứt phá giới hạn sáng tạo.', icon: Zap },
  { title: 'Chính xác', desc: 'Mọi thông tin đều được kiểm chứng kỹ lưỡng.', icon: Target },
  { title: 'Đồng hành', desc: 'Luôn lắng nghe và thấu hiểu khách hàng.', icon: Handshake },
];
