
import { 
  Zap, Handshake, Target, Shield, LayoutDashboard, PenTool, 
  Activity, FileText, BarChart2, Settings, Users, Building2, 
  BookOpen, Package, ShieldAlert, FileSearch, Target as TargetIcon,
  Languages, BrainCircuit, Award, ShoppingBag, FileCode
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
  language: { label: "Ngôn ngữ", icon: Languages, color: "text-blue-500", bg: "bg-blue-50", description: "Ngữ pháp, hành văn & SOP." },
  ai_logic: { label: "AI & Logic", icon: BrainCircuit, color: "text-purple-500", bg: "bg-purple-50", description: "Độ xác thực và logic nội dung." },
  brand: { label: "Thương hiệu", icon: Award, color: "text-[#102d62]", bg: "bg-slate-100", description: "Brand Voice, Tone & Persona." },
  product: { label: "Sản phẩm", icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-50", description: "USP, Thông số & Giá trị SP." }
};

export const GLOBAL_AUDIT_STANDARDS = `
1. Accuracy: Đảm bảo thông tin xác thực, không bịa đặt.
2. Tone: Tuân thủ đúng giọng văn thương hiệu.
3. Grammar: Đúng ngữ pháp, không lỗi chính tả.
4. Compliance: Không vi phạm các từ cấm (Don't words).
5. Clarity: Nội dung rõ ràng, dễ hiểu.
`;

export const SOCIAL_AUDIT_PROMPT = `Bạn là Chuyên gia QC & Auditor Cực Đoan của MOODBIZ. 
Mục tiêu duy nhất của bạn là: TRIỆT TIÊU 100% RỦI RO.

[BỐI CẢNH THƯƠNG HIỆU]
Thương hiệu: {brand_name}
Tính cách: {brand_personality}
Giọng văn: {brand_voice}
Từ nên dùng (Do-words): {do_words}
❌ TỪ CẤM (Don't-words): {dont_words}

[HỆ THỐNG QUY TẮC SOP & LỊCH SỬ VI PHẠM]
{dynamic_rules}

[KNOWLEDGE BASE TÀI LIỆU]
{guideline}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CHỈ THỊ THỰC THI (QUY TRÌNH 3 BƯỚC KHÉP KÍN):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 1 - AUDIT BẢN GỐC: Liệt kê tất cả các lỗi của văn bản gốc "{text}". 

BƯỚC 2 - VIẾT LẠI & TỰ SOI LỖI (SELF-CORRECTION):
- Viết lại bản tối ưu.
- SAU ĐÓ, đóng vai một người kiểm duyệt khác, dùng TOÀN BỘ danh sách Từ cấm và Quy tắc SOP ở trên để soi lại bản vừa viết. 
- Nếu bản viết lại vẫn chứa từ cấm hoặc sai giọng văn, bạn PHẢI sửa lại cho đến khi đạt độ tuân thủ tuyệt đối.

BƯỚC 3 - CAM KẾT ĐẦU RA: 
- "rewritten_text" phải là bản thảo "Sạch" đến mức nếu tôi Audit lại bản này 100 lần nữa, nó vẫn phải ra 0 lỗi.

YÊU CẦU ĐẦU RA (JSON ONLY):
{
  "summary": "Tóm tắt ngắn gọn các lỗi đã triệt tiêu và cam kết về độ sạch của bản mới.",
  "identified_issues": [
    {
      "category": "language / ai_logic / brand / product",
      "problematic_text": "Phần lỗi từ văn bản GỐC",
      "reason": "Giải thích chi tiết lỗi dựa trên SOP/Từ cấm/Brand Profile",
      "severity": "High / Medium / Low",
      "suggestion": "Bạn đã sửa nó như thế nào?"
    }
  ],
  "rewritten_text": "Bản thảo hoàn hảo, tuyệt đối không vi phạm SOP hay chứa từ cấm."
}`;

export const WEBSITE_AUDIT_PROMPT = SOCIAL_AUDIT_PROMPT;

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
  { type: 'header', label: 'Hồ sơ Brand', role: ['admin', 'brand_owner', 'content_creator'] },
  { type: 'link', id: 'brands', icon: Building2, label: 'Quản lý thương hiệu', role: ['admin', 'brand_owner'] },
  { type: 'link', id: 'products', icon: Package, label: 'Sản phẩm & Dịch vụ', role: ['admin', 'brand_owner'] },
  { type: 'link', id: 'guidelines', icon: BookOpen, label: 'Brand Guidelines' },
  { type: 'header', label: 'Hệ thống', role: ['admin'] },
  { type: 'link', id: 'settings', icon: Settings, label: 'Cấu hình Prompt & Rules', role: ['admin'] },
  { type: 'link', id: 'users', icon: Users, label: 'Quản lý tài khoản', role: ['admin', 'brand_owner'] }
];

export const PLATFORM_CONFIGS: Record<string, string> = {
  'Website / SEO Blog': `- CẤU TRÚC: H1, H2, H3, CTA.`,
  'Facebook Post': `- Hook, Đoạn ngắn, CTA.`,
  'LinkedIn Article': `- PHONG CÁCH: B2B Expert.`,
  'Email Marketing': `- MỤC TIÊU: Click-through.`
};

export const DEFAULT_GEN_PROMPT = `Bạn là chuyên gia Content Strategy cho {brand_name}.
{rag_context}
Platform: {platform}
Language: {language}
Product Context: {product_context}
Brand Persona: {brand_personality}
Tone of Voice: {brand_voice}
Avoid Words: {dont_words}
`;

export const COMPANY_STATS = [
  { label: 'Brands', value: '150+' },
  { label: 'Generations', value: '12.5k' },
  { label: 'Audits', value: '8.2k' },
  { label: 'Users', value: '450' },
];

export const CORE_VALUES = [
  { title: 'Chất lượng', desc: 'Đảm bảo nội dung luôn đạt chuẩn cao nhất.', icon: Shield },
  { title: 'Sáng tạo', desc: 'Ứng dụng AI để bứt phá giới hạn sáng tạo.', icon: Zap },
  { title: 'Chính xác', desc: 'Mọi thông tin đều được kiểm chứng kỹ lưỡng.', icon: Target },
  { title: 'Đồng hành', desc: 'Luôn lắng nghe và thấu hiểu khách hàng.', icon: Handshake },
];
