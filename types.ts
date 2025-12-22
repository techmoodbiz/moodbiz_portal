
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'brand_owner' | 'content_creator' | 'viewer';
  ownedBrandIds?: string[];
  assignedBrandIds?: string[];
  avatar?: string;
  name?: string;
  id?: string;
}

export interface Brand {
  id: string;
  name: string;
  legal_name?: string;
  slug?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_colors?: string[];
  slogan?: string;
  tagline?: string;
  industry?: string;
  category?: string;
  country?: string;
  mission?: string;
  vision?: string;
  brand_promise?: string;
  positioning_statement?: string;
  core_values?: string[];
  usp?: string[];
  target_segments?: string[];
  personality: string; 
  brand_personality?: string[]; 
  voice: string; 
  tone_of_voice?: string;
  do_words?: string[];
  dont_words?: string[];
  style_rules?: string;
  visual_rules?: string;
  auditCriteria?: string;
  summary?: string;
  last_guideline_updated_at?: any;
}

export interface Generation {
  id: string;
  brand_id: string;
  user_id: string;
  user_name: string;
  input_data: {
    platform: string;
    topic: string;
    product_id?: string;
  };
  output_data: string;
  citations?: string[];
  timestamp: any;
  last_updated?: any;
}

export interface Comment {
  id: string;
  parentId: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  timestamp: any;
}

export interface Auditor {
  id: string;
  type: string;
  brand_id: string;
  brand_name?: string;
  user_id: string;
  user_name: string;
  input_data: {
    rawText: string;
    text: string;
    url?: string;
  };
  output_data: any;
  timestamp: any;
}

export interface Guideline {
  id: string;
  brand_id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  file_name: string;
  is_primary?: boolean;
  description?: string;
  guideline_text?: string;
  file_url?: string;
  uploaded_by?: string;
  uploaded_role?: string;
  created_at?: any;
}

export interface SystemPrompts {
  generator: string;
  auditor: {
    social: string;
    website: string;
  };
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  type: 'good' | 'service';
  category: string;
  sub_category?: string;
  line?: string;
  version?: string; // Basic/Pro/Enterprise
  status: 'Active' | 'Paused';
  
  // Giá trị & Khách hàng
  target_audience: {
    type: 'B2B' | 'B2C' | 'Both';
    industry?: string;
    scale?: string;
    market?: string;
  };
  value_prop: {
    pain_points: string[];
    benefits: string[];
    usp: string[];
    use_cases: string[];
  };

  // Nội dung marketing chuẩn hóa
  marketing: {
    short_desc: string;
    long_desc?: string;
    key_messages: string[];
    default_cta?: string;
    tags?: string[];
    funnel_stage?: 'TOFU' | 'MOFU' | 'BOFU' | 'All';
    tone?: string;
  };

  // Bằng chứng & Asset
  assets: {
    testimonials?: { id: string, name: string, quote: string }[];
    key_results?: string[];
    media_links?: { title: string, url: string }[];
  };

  // Layer Dịch vụ
  service_details?: {
    scope: { items: { label: string, enabled: boolean, desc?: string }[] };
    process: { phases: { name: string, duration?: string, desc?: string }[] };
    kpis: {
      traffic?: string;
      leads?: string;
      mql_sql?: string;
      cpl_cpa?: string;
      cr?: string;
      revenue?: string;
      commitment_min?: string;
    };
    input_reqs: string[]; // GA4, CRM, budget...
  };

  // Layer Sản phẩm vật lý
  physical_details?: {
    technical: {
      ingredients?: string;
      specs?: string;
      dimensions?: string;
      weight?: string;
      expiry?: string;
      standards?: string; // ISO, GMP...
    };
    usage: {
      guide?: string;
      storage?: string;
      warnings?: string;
      target_group?: string;
      contraindications?: string;
    };
    commerce: {
      price_list?: number;
      price_promo?: number;
      moq?: string;
      unit?: string;
      stock?: string;
      channels?: string[]; // Online/Offline/Sàn
    };
  };
}

export interface AnalysisResult {
  brandName?: string;
  industry?: string;
  targetAudience?: string;
  tone?: string;
  coreValues?: string[];
  keywords?: string[];
  visualStyle?: string;
  dos?: string[];
  donts?: string[];
  summary?: string;
  sourceUrl?: string;
  analyzedAt?: string;
  method?: string;
  confidence?: string;
}

export interface Persona {
  id: string;
  brand_id: string;
  name: string;
  jobTitle: string;
  industry: string;
  goals: string;
  painPoints: string;
  preferredLanguage: string;
}

export interface ContentTemplate {
  id: string;
  brand_id: string;
  name: string;
  structure: 'AIDA' | 'PAS' | 'Storytelling' | 'H-P-I-S-C';
  description: string;
  prompt_skeleton: string;
}
