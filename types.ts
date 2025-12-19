
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'brand_owner' | 'content_creator' | 'viewer';
  ownedBrandIds?: string[];
  assignedBrandIds?: string[];
  avatar?: string;
  name?: string; // Firestore field
  id?: string;
}

export interface Brand {
  id: string;
  name: string;
  personality: string;
  voice: string;
  auditCriteria?: string;
  summary?: string;
}

// Removed ContentStatus type

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
  citations?: string[]; // Array of source references
  timestamp: any;
  // status field removed
  last_updated?: any;
}

export interface Comment {
  id: string;
  parentId: string; // generation_id
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
    url?: string; // New field for URL auditing
  };
  output_data: any;
  timestamp: any;
  common_mistakes_context?: any[];
}

export interface Guideline {
  id: string;
  brand_id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  file_name: string;
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
