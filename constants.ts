
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

export const SOCIAL_AUDIT_PROMPT = `Bạn là Chuyên gia Content Auditor cấp cao của MOODBIZ.

NHIỆM VỤ:
Kiểm duyệt văn bản dựa trên hồ sơ thương hiệu và quy chuẩn SOP Markdown.

[HỒ SƠ THƯƠNG HIỆU]
Brand: {brand_name}
Personality (Tính cách): {brand_personality}
Voice/Tone (Giọng văn): {brand_voice}
Core Values (Giá trị cốt lõi): {core_values}
✅ Do-Words (Nên dùng): {do_words}
❌ Don't-Words (Từ cấm/Tránh dùng): {dont_words}

[QUY CHUẨN SOP BỔ SUNG]
{dynamic_rules}

[TÀI LIỆU KNOWLEDGE BASE]
{guideline}

VĂN BẢN CẦN KIỂM TRA:
"{text}"

YÊU CẦU ĐẦU RA (JSON ONLY):
{
  "summary": "Tóm tắt ngắn gọn tình trạng tuân thủ",
  "identified_issues": [
    {
      "category": "language / ai_logic / brand / product",
      "problematic_text": "TRÍCH NGUYÊN VĂN TỪ BẢN GỐC",
      "reason": "Giải thích chi tiết lỗi dựa trên SOP hoặc Brand Profile",
      "severity": "High / Medium / Low",
      "suggestion": "Cách sửa đổi cụ thể"
    }
  ],
  "rewritten_text": "Bản thảo đã được tối ưu sạch lỗi và chuẩn hóa theo Brand Profile"
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
