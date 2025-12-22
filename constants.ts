

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
  language: { label: "Ngôn ngữ", icon: Languages, color: "text-blue-500", bg: "bg-blue-50", description: "Ngữ pháp, hành văn (MD Rules)." },
  ai_logic: { label: "AI & Logic", icon: BrainCircuit, color: "text-purple-500", bg: "bg-purple-50", description: "Bịa thông tin, sai brief (MD Rules)." },
  brand: { label: "Thương hiệu", icon: Award, color: "text-[#102d62]", bg: "bg-slate-100", description: "Brand Voice & Tone (Dynamic)." },
  product: { label: "Sản phẩm", icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-50", description: "Thông số & USP (Database)." }
};

/* Added missing GLOBAL_AUDIT_STANDARDS used in HistoryGenerationsTab */
export const GLOBAL_AUDIT_STANDARDS = `
1. Accuracy: Ensure all information is factual and consistent with brand guidelines.
2. Tone: Maintain the specified brand voice and personality.
3. Grammar: Use correct grammar, spelling, and punctuation.
4. Compliance: Adhere to safety and legal requirements.
5. Clarity: Ensure content is clear, concise, and easy to understand.
`;

export const SOCIAL_AUDIT_PROMPT = `Bạn là Chuyên gia Content Auditor.

NHIỆM VỤ:
Kiểm duyệt văn bản dựa trên các quy chuẩn Markdown (SOP) được cung cấp dưới đây.

YÊU CẦU CỰC KỲ QUAN TRỌNG:
- "problematic_text" phải là TRÍCH NGUYÊN VĂN từ bản gốc.
- Phải đối soát cực kỳ nghiêm ngặt với các file SOP đính kèm.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 SOP RULES (DYNAMIC FROM DATABASE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{dynamic_rules}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HỒ SƠ THƯƠNG HIỆU]
Brand: {brand_name}
Personality: {brand_personality}
Voice: {brand_voice}
Guideline: {guideline}

VĂN BẢN CẦN QUÉT:
"{text}"

YÊU CẦU ĐẦU RA (JSON ONLY):
{
  "summary": "Tóm tắt rủi ro",
  "identified_issues": [
    {
      "category": "language / ai_logic / brand / product",
      "problematic_text": "TRÍCH NGUYÊN VĂN",
      "reason": "Tại sao lỗi (dựa trên SOP nào)",
      "severity": "High / Medium / Low",
      "suggestion": "Cách sửa"
    }
  ],
  "rewritten_text": "Bản thảo đã sạch lỗi"
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
  'Facebook Post': `- Hook, Short segments, CTA.`,
  'LinkedIn Article': `- PHONG CÁCH: B2B Expert.`,
  'Email Marketing': `- MỤC TIÊU: Click-through.`
};

export const DEFAULT_GEN_PROMPT = `Bạn là chuyên gia content của {brand_name}.
{rag_context}
Platform: {platform}
Language: {language}
Product Info: {product_context}
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
