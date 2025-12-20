
import { 
  Zap, Handshake, Target, Shield, LayoutDashboard, PenTool, 
  Activity, FileText, BarChart2, Settings, Users, Building2, 
  BookOpen
} from 'lucide-react';

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

export const PLATFORM_CONFIGS: Record<string, string> = {
  'Website / SEO Blog': `
    - ĐỘ DÀI: 800 - 2000 từ (Bắt buộc).
    - CẤU TRÚC: 
      + Tiêu đề H1: Hấp dẫn, chứa từ khóa chính.
      + Sapo: 100-150 từ, nêu vấn đề và giải pháp.
      + Thân bài: Chia thành các thẻ H2, H3 rõ ràng.
      + Kết bài: Tóm tắt và CTA.
  `,
  'Facebook Post': `
    - ĐỘ DÀI: Ngắn gọn (dưới 300 từ) hoặc Long-form.
    - CẤU TRÚC: Hook thu hút, thân đoạn thoáng, Emoji phù hợp, CTA rõ ràng.
  `,
  'LinkedIn Article': `
    - ĐỘ DÀI: 500 - 1000 từ.
    - PHONG CÁCH: Chuyên gia, Insight ngành, trang trọng.
  `,
  'Email Marketing': `
    - ĐỘ DÀI: Dưới 400 từ.
    - CẤU TRÚC: Subject line gây tò mò, mở bài cá nhân hóa, tập trung Benefit, CTA đơn giản.
  `
};

export const DEFAULT_GEN_PROMPT = `Bạn là Trợ lý AI của {brand_name}.
Nhiệm vụ: Viết bài đăng cho kênh {platform} về chủ đề: "{topic}".

QUAN TRỌNG: NGÔN NGỮ ĐẦU RA LÀ {language}.

THÔNG TIN THƯƠNG HIỆU:
[TÍNH CÁCH THƯƠNG HIỆU]
{brand_personality}

[GIỌNG VĂN & PHONG CÁCH]
{brand_voice}

[CẦN TRÁNH - CÁC LỖI THƯỜNG GẶP]
{common_mistakes}

[YÊU CẦU QUAN TRỌNG: RAG & TRÍCH DẪN]
{rag_context}`;

export const GLOBAL_AUDIT_STANDARDS = `
1. GRAMMAR & SPELLING
2. STRUCTURE & CLARITY
3. CTA FORMAT
4. PLATFORM APPROPRIATENESS
5. TONE CONSISTENCY
6. RELEVANCE & ACCURACY
`;

export const SOCIAL_AUDIT_PROMPT = `Bạn là Chuyên gia Kiểm duyệt Thương hiệu {brand_name}.
PHÂN TÍCH JSON: {
  "overall_score": number,
  "summary": string,
  "identified_issues": [ { "issue_type": string, "problematic_text": string, "reason": string, "severity": string, "suggestion": string } ],
  "rewritten_text": string
}`;

export const WEBSITE_AUDIT_PROMPT = `Bạn là Chuyên gia SEO Audit cho {brand_name}.
PHÂN TÍCH JSON.`;

export const GEN_TEMPLATES = [
  { title: "Website SEO Article", desc: "Bài Blog chuẩn SEO chuyên sâu.", platform: "Website / SEO Blog" },
  { title: "Facebook Viral Post", desc: "Bài viết ngắn, hài hước, bắt trend.", platform: "Facebook Post" },
  { title: "LinkedIn Thought Leadership", desc: "Chia sẻ kiến thức chuyên sâu.", platform: "LinkedIn Article" },
  { title: "Cold Email B2B", desc: "Giới thiệu giải pháp ngắn gọn.", platform: "Email Marketing" }
];
