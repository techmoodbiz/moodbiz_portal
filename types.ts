

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
  // 1. Định danh cốt lõi
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

  // 2. Chiến lược & Định vị
  mission?: string;
  vision?: string;
  brand_promise?: string;
  positioning_statement?: string;
  core_values?: string[];
  usp?: string[];
  target_segments?: string[];

  // 3. Quy chuẩn nội dung (cho AI)
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

export interface AnalysisResult {
  brandName?: string;
  industry?: string;
  targetAudience?: string;
  tone?: string;
  summary?: string;
  coreValues?: string[];
  keywords?: string[];
  visualStyle?: string;
  dos?: string[];
  donts?: string[];
  sourceUrl?: string;
  analyzedAt?: string;
}

export interface SystemPrompts {
  generator: string;
  auditor: {
    social: string;
    website: string;
  };
}

// Added missing Persona interface definition to fix import errors in PersonasTab.tsx
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

// Added missing Product interface definition to fix import errors in ProductsTab.tsx
export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  features: string[];
  benefits: string[];
  usp: string;
  pricing: string;
}

// Added missing ContentTemplate interface definition to fix import errors in TemplatesTab.tsx
export interface ContentTemplate {
  id: string;
  brand_id: string;
  name: string;
  structure: 'AIDA' | 'PAS' | 'Storytelling' | 'H-P-I-S-C';
  description: string;
  prompt_skeleton: string;
}
