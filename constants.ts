
import { Zap, Handshake, Target, Shield, LayoutDashboard, PenTool, Activity, FileText, BarChart2, Settings, Users, Building2, BookOpen } from 'lucide-react';

export const THEME = {
  navy: '#102d62',
  cyan: '#01ccff',
  white: '#ffffff',
  bg: '#f8f9fa',
  border: '#e2e8f0',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'Vietnamese', label: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳' },
  { code: 'English', label: 'Tiếng Anh (English)', flag: '🇺🇸' },
  { code: 'Japanese', label: 'Tiếng Nhật (Japanese)', flag: '🇯🇵' }
];

export const COMPANY_STATS = [
  { value: "3+", label: "Năm Hình Thành & Phát Triển" },
  { value: "18+", label: "Giải Pháp Digital Chuyên Biệt" },
  { value: "100%", label: "Đội Ngũ In-house Chuyên Sâu" },
  { value: "80+", label: "Dự Án B2B/Brand/SME" }
];

export const CORE_VALUES = [
  { icon: Zap, title: "Đổi Mới", desc: "Không ngừng sáng tạo giải pháp mới." },
  { icon: Handshake, title: "Đồng Hành", desc: "Cam kết dài hạn cùng đối tác." },
  { icon: Target, title: "Quyết Liệt", desc: "Tập trung vào kết quả cuối cùng." },
  { icon: Shield, title: "Trách Nhiệm", desc: "Minh bạch trong mọi hoạt động." }
];

export const NAV_ITEMS = [
  { type: 'header', label: 'Tổng Quan' },
  { type: 'link', id: 'dashboard', icon: LayoutDashboard, label: 'Company Profile' },
  { type: 'header', label: 'AI Lab Tools' },
  { type: 'link', id: 'generator', icon: PenTool, label: 'Content Generator' },
  { type: 'link', id: 'auditor', icon: Activity, label: 'Voice Auditor' },
  { type: 'header', label: 'AI History', role: ['admin', 'brand_owner'] },
  { type: 'link', id: 'generations', icon: FileText, label: 'Generator History', role: ['admin', 'brand_owner'] },
  { type: 'link', id: 'audits', icon: FileText, label: 'Auditor History', role: ['admin', 'brand_owner'] },
  { id: 'analytics', label: 'Auditor Analytics', icon: BarChart2, type: 'item', role: ['admin', 'brand_owner'] },
  { type: 'header', label: 'Cấu Hình', role: ['admin', 'brand_owner'] },
  { type: 'link', id: 'settings', icon: Settings, label: 'Cấu hình hệ thống', role: ['admin'] },
  { type: 'link', id: 'users', icon: Users, label: 'Quản lý tài khoản', role: ['admin', 'brand_owner'] },
  { type: 'link', id: 'brands', icon: Building2, label: 'Quản lý thương hiệu', role: ['admin', 'brand_owner'] },
  { type: 'header', label: 'Tài Nguyên' },
  { type: 'link', id: 'guidelines', icon: BookOpen, label: 'Brand Guidelines' }
];

// --- PLATFORM SPECIFIC RULES ---
export const PLATFORM_CONFIGS: Record<string, string> = {
  'Website / SEO Blog': `
    - ĐỘ DÀI: 800 - 2000 từ (Bắt buộc).
    - CẤU TRÚC: 
      + Tiêu đề H1: Hấp dẫn, chứa từ khóa chính.
      + Sapo (Mở bài): 100-150 từ, nêu vấn đề và giải pháp, chứa từ khóa.
      + Thân bài: Chia thành các thẻ H2, H3 rõ ràng. Mỗi đoạn không quá dài.
      + Kết bài: Tóm tắt và CTA.
    - SEO: Tối ưu từ khóa tự nhiên, mật độ 1-2%. Sử dụng Markdown (Bold, Bullet points) để tăng trải nghiệm đọc.
    - PHONG CÁCH: Chuyên sâu, cung cấp giá trị thực tế, dẫn chứng số liệu (nếu có).
  `,
  'Facebook Post': `
    - ĐỘ DÀI: Ngắn gọn (dưới 300 từ) hoặc Long-form storytelling (tùy ngữ cảnh, nhưng ưu tiên ngắn).
    - CẤU TRÚC:
      + Headline: Cực kỳ thu hút (Hook) trong 3 giây đầu.
      + Thân: Ngắt dòng thoáng, dùng Emoji phù hợp 🌟.
      + CTA: Rõ ràng, khuyến khích comment/share.
    - PHONG CÁCH: Gần gũi, đời thường, "bắt trend" hoặc cảm xúc.
  `,
  'LinkedIn Article': `
    - ĐỘ DÀI: 500 - 1000 từ.
    - CẤU TRÚC: Chuyên nghiệp, chia đoạn rõ ràng. Tập trung vào Insight ngành, bài học kinh doanh hoặc xu hướng.
    - PHONG CÁCH: Chuyên gia (Thought Leadership), trang trọng nhưng không cứng nhắc.
  `,
  'Email Marketing': `
    - ĐỘ DÀI: Ngắn gọn, súc tích (dưới 400 từ).
    - CẤU TRÚC:
      + Subject Line: Gây tò mò hoặc đánh trúng nỗi đau (Pain point).
      + Opening: Cá nhân hóa.
      + Body: Tập trung vào Lợi ích (Benefit) thay vì Tính năng (Feature).
      + CTA: Đơn giản, một mục tiêu duy nhất.
  `
};

export const DEFAULT_GEN_PROMPT = `Bạn là Trợ lý AI của {brand_name}.
Nhiệm vụ: Viết bài đăng cho kênh {platform} về chủ đề: "{topic}".

QUAN TRỌNG: NGÔN NGỮ ĐẦU RA LÀ {language}.
(Hãy viết toàn bộ nội dung bài viết bằng {language}, trừ khi có yêu cầu đặc biệt khác).

[QUY TẮC CẤU TRÚC KÊNH - {platform}]
(Bắt buộc tuân thủ nghiêm ngặt các yêu cầu sau về độ dài và định dạng)
{platform_rules}

THÔNG TIN THƯƠNG HIỆU (Cần tuân thủ tuyệt đối):
[TÍNH CÁCH THƯƠNG HIỆU]
{brand_personality}

[GIỌNG VĂN & PHONG CÁCH]
{brand_voice}

[CẦN TRÁNH - CÁC LỖI THƯỜNG GẶP CỦA BRAND]
Dựa trên lịch sử audit, hãy tránh những lỗi sau:
{common_mistakes}

[YÊU CẦU QUAN TRỌNG: RAG & TRÍCH DẪN (CITATION)]
Bạn sẽ được cung cấp các đoạn Context từ tài liệu Brand Guidelines.
1. HÃY ĐỌC KỸ và ƯU TIÊN sử dụng thông tin từ Context này để đảm bảo độ chính xác.
2. NẾU SỬ DỤNG thông tin từ Context, BẮT BUỘC phải trích dẫn nguồn ở cuối bài viết.
3. Định dạng trích dẫn (Chính xác từng ký tự để hệ thống tự động nhận diện):
   > [Source: {Tên_File} - Trang {Số_Trang}]
   (Ví dụ: > [Source: Brand_Guideline_2025.pdf - Trang 15])
   
Lưu ý: Nếu trong Context có thông tin về số trang (Page), hãy ghi rõ số trang. Nếu không có, ghi tên file.

YÊU CẦU BÀI VIẾT:
1. Tuân thủ cấu trúc của {platform} đã nêu ở trên.
2. Bắt đầu bằng một Headline (Tiêu đề) thu hút.
3. Thân bài triển khai logic.
4. Kết thúc bằng Call to Action (CTA) mạnh mẽ.
5. Sử dụng chuẩn ngữ pháp của {language}.
6. QUAN TRỌNG: Tránh mắc phải những lỗi được liệt kê ở phần "CẦN TRÁNH" ở trên.`;

export const GLOBAL_AUDIT_STANDARDS = `
[TIÊU CHUẨN AUDIT TOÀN CẦU]
1. GRAMMAR & SPELLING (Ngữ pháp & Chính tả)
2. STRUCTURE & CLARITY (Cấu trúc & Tính rõ ràng)
3. CTA FORMAT (Định dạng Call-to-Action)
4. PLATFORM APPROPRIATENESS (Phù hợp nền tảng)
5. TONE CONSISTENCY (Nhất quán giọng văn)
6. RELEVANCE & ACCURACY (Liên quan & Chính xác)
7. NO FILLER WORDS (Không dùng từ lấp liếm)
`;

export const SOCIAL_AUDIT_PROMPT = `Bạn là Chuyên gia Kiểm duyệt Thương hiệu {brand_name}.
NHIỆM VỤ: Phân tích nội dung dựa trên Global Standards và Brand Specific Criteria.

ĐẦU VÀO CẦN KIỂM TRA: "{text}"
NGÔN NGỮ CỦA BÀI VIẾT: {language}.

[HƯỚNG DẪN QUAN TRỌNG VỀ NGÔN NGỮ BÁO CÁO]
- Hãy kiểm tra lỗi ngữ pháp, chính tả, và giọng văn dựa trên chuẩn của ngôn ngữ {language} (Ví dụ: Nếu là tiếng Nhật, kiểm tra Kính ngữ; Nếu là tiếng Anh, kiểm tra Grammar).
- TUY NHIÊN: TOÀN BỘ KẾT QUẢ TRẢ VỀ (Lý do, Đề xuất, Nhận xét, Tips) PHẢI VIẾT BẰNG TIẾNG VIỆT để người quản lý dễ dàng theo dõi.
- Chỉ giữ nguyên văn phần "problematic_text" (văn bản lỗi) và "rewritten_text" (văn bản viết lại) bằng ngôn ngữ gốc ({language}).

[GLOBAL STANDARDS]
{global_standards}

[BRAND PERSONALITY]
{brand_personality}

[BRAND VOICE]
{brand_voice}

[AUDIT CRITERIA RIÊNG]
{audit_criteria}

⭐ [LỖI THƯỜNG GẶP CỦA BRAND - QUAN TRỌNG]
(Đây là các lỗi hệ thống ghi nhận được từ lịch sử Audit của Brand. Khi đề xuất "rewritten_text", bạn TUYỆT ĐỐI PHẢI KHẮC PHỤC và TRÁNH các lỗi này)
{commonmistakes}

QUAN TRỌNG VỀ ĐIỂM SỐ (SCORE):
- Chấm điểm bắt buộc trên thang 0 đến 100 (100 là hoàn hảo).
- TUYỆT ĐỐI KHÔNG dùng thang điểm 1-5 hay 1-10.
- Nếu bài viết Tốt, điểm phải > 80. Nếu bài viết Rất Tốt, điểm phải > 90.
- Nếu bài viết Tệ, điểm phải < 50.

Trả về kết quả dưới dạng JSON thuần:
{
  "overall_score": number (Mặc định thang 100. Ví dụ: 85, 92, 60. KHÔNG ĐƯỢC để 5, 4.5, 9),
  "summary": string (Tổng quan bằng TIẾNG VIỆT),
  "global_standards_assessment": { ... },
  "brand_personality_assessment": { "is_compliant": boolean, "traits_matched": [], "traits_missing": [], "detailed_comment": string (Giải thích bằng TIẾNG VIỆT) },
  "brand_voice_assessment": { "is_compliant": boolean, "tone_quality": string (TIẾNG VIỆT), "conciseness": string (TIẾNG VIỆT), "detailed_comment": string (Giải thích bằng TIẾNG VIỆT) },
  "identified_issues": [ { "issue_type": string (Loại lỗi bằng TIẾNG VIỆT, ngắn gọn), "problematic_text": string (Giữ nguyên gốc), "reason": string (Giải thích lý do sai bằng TIẾNG VIỆT), "severity": string, "suggestion": string (Gợi ý sửa bằng TIẾNG VIỆT) } ],
  "rewritten_text": string (Viết lại bài viết bằng ngôn ngữ gốc {language} đã sửa lỗi),
  "improvement_tips": [] (Mảng các lời khuyên bằng TIẾNG VIỆT)
}`;

export const WEBSITE_AUDIT_PROMPT = `Bạn là Chuyên gia SEO Audit & UX Copywriting (chuẩn Google E-E-A-T).
NHIỆM VỤ: Đánh giá bài viết Website/Blog để tối ưu hóa thứ hạng tìm kiếm và trải nghiệm người dùng.

NỘI DUNG CẦN KIỂM TRA LÀ NGÔN NGỮ: {language}.

[HƯỚNG DẪN QUAN TRỌNG VỀ NGÔN NGỮ BÁO CÁO]
- Phân tích dựa trên chuẩn SEO/UX của ngôn ngữ {language}.
- TOÀN BỘ KẾT QUẢ TRẢ VỀ (Feedback, Suggestions, Weaknesses) PHẢI VIẾT BẰNG TIẾNG VIỆT.
- Giữ nguyên các thuật ngữ chuyên ngành (SEO, Meta, H1, H2, Keyword) bằng tiếng Anh nếu cần thiết.

[THÔNG TIN THƯƠNG HIỆU]
Brand Name: {brand_name}
Brand Voice: {brand_voice}
Brand Guidelines: {guideline}

[CONTENT ĐẦU VÀO]
{text}

[YÊU CẦU PHÂN TÍCH QUAN TRỌNG]
Nếu văn bản đầu vào là raw text (do copy paste hoặc scraping):
- Hãy tự suy luận cấu trúc dựa trên dòng chảy nội dung (dòng đầu tiên có thể là H1).
- Nếu thiếu định dạng HTML (H2, H3, Bold), hãy coi đó là một vấn đề UX tiềm năng.
- **BẮT BUỘC:** Tìm ra ít nhất 3-5 vấn đề (Issues) cụ thể cần cải thiện (về SEO, readability, hoặc tone).
- **CHÚ Ý:** Nếu bài viết đã tốt, hãy đề xuất các "Cơ hội tối ưu hóa" (Optimization Opportunities) và liệt kê chúng vào danh sách issues với severity là 'Low'. KHÔNG ĐƯỢC ĐỂ DANH SÁCH ISSUES TRỐNG.

[TIÊU CHÍ AUDIT CHUYÊN SÂU]
1. SEO STRUCTURAL CHECK:
   - Phân cấp thông tin (H1 -> H2 -> H3) có logic không?
   - Mật độ từ khóa có tự nhiên không?
2. META TAGS:
   - Đề xuất Title & Description hấp dẫn.
3. CONVERSION (CRO):
   - CTA có đủ mạnh? Value Proposition có rõ ràng?

⭐ [LỖI CẦN TRÁNH TỪ LỊCH SỬ BRAND]
{commonmistakes}

Trả về JSON thuần (Tuyệt đối không Markdown):
{
  "overall_score": number (Thang 100),
  "summary": string (Tổng quan ngắn gọn bằng TIẾNG VIỆT),
  
  "seo_assessment": {
    "score": number (0-100),
    "keyword_check": string (Nhận xét mật độ từ khóa),
    "structure_check": string (Nhận xét cấu trúc Heading),
    "meta_suggestions": {
       "title": string (Gợi ý Meta Title),
       "description": string (Gợi ý Meta Description)
    }
  },

  "ux_assessment": {
    "score": number (0-100),
    "readability": string (Nhận xét độ dễ đọc),
    "formatting": string (Nhận xét trình bày)
  },

  "conversion_assessment": {
    "score": number (0-100),
    "cta_check": string (Nhận xét CTA),
    "value_prop_check": string (Nhận xét Value Prop)
  },

  "brand_voice_assessment": { 
     "is_compliant": boolean, 
     "detailed_comment": string (TIẾNG VIỆT) 
  },

  "identified_issues": [ 
    // Mảng các vấn đề phát hiện. BẮT BUỘC PHẢI CÓ DỮ LIỆU.
    { 
      "issue_type": string (Ví dụ: "SEO/Missing Keywords", "UX/Wall of Text", "Optimization/Structure"), 
      "problematic_text": string (Trích dẫn đoạn văn liên quan hoặc 'N/A'), 
      "reason": string (Giải thích ngắn gọn bằng TIẾNG VIỆT), 
      "severity": string ("High"|"Medium"|"Low"), 
      "suggestion": string (Gợi ý sửa bằng TIẾNG VIỆT) 
    } 
  ],

  "rewritten_text": string (Viết lại bài viết bằng ngôn ngữ {language} đã tối ưu SEO & UX & Brand Voice),
  
  "improvement_tips": [] (3-5 tips quan trọng nhất bằng TIẾNG VIỆT)
}`;

export const GEN_TEMPLATES = [
  { 
    title: "Website SEO Article", 
    desc: "Bài Blog chuẩn SEO, 800-2000 từ, cấu trúc H1/H2/H3 chuyên sâu.", 
    prompt: "Viết bài Blog chuẩn SEO về chủ đề này. Đảm bảo độ dài 1000 từ trở lên, tối ưu từ khóa, chia đoạn rõ ràng.",
    platform: "Website / SEO Blog"
  },
  { 
    title: "Facebook Viral Post", 
    desc: "Bài viết ngắn, hài hước, bắt trend, khuyến khích tương tác.", 
    prompt: "Viết bài Facebook ngắn, hài hước, bắt trend về chủ đề này. Dùng emoji phù hợp, văn phong trẻ trung.",
    platform: "Facebook Post"
  },
  { 
    title: "LinkedIn Thought Leadership", 
    desc: "Chia sẻ kiến thức chuyên sâu, xây dựng thương hiệu cá nhân/doanh nghiệp.", 
    prompt: "Viết bài chia sẻ kiến thức chuyên sâu (Thought Leadership) trên LinkedIn. Giọng văn chuyên nghiệp, cấu trúc rõ ràng, tập trung vào giá trị cho người đọc.",
    platform: "LinkedIn Article"
  },
  { 
    title: "Cold Email B2B", 
    desc: "Email giới thiệu ngắn gọn, tập trung vào nỗi đau khách hàng.", 
    prompt: "Viết email cold outreach giới thiệu giải pháp. Tập trung vào 'pain point' của khách hàng và cách giải quyết. Ngắn gọn, súc tích.",
    platform: "Email Marketing"
  }
];
