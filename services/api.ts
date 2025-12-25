
import { Brand, AnalysisResult, User } from '../types';
import firebase, { db } from '../firebase';

const BASE_URL = "https://moodbizcontentcreatorbe.vercel.app/api";

/**
 * Phân tích thương hiệu từ nội dung Website thông qua Backend
 */
export async function analyzeWebsite(websiteUrl: string): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/brand-guidelines/analyze-brand`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ websiteUrl }),
  });
  
  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || "Không thể phân tích website này");
  }

  return result.data; // Trả về schema AnalysisResult đã chuẩn hóa từ BE
}

/**
 * Phân tích thương hiệu từ File thông qua Backend
 */
export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/brand-guidelines/analyze-file`, {
    method: "POST",
    body: formData,
  });

  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || "Không thể phân tích file này");
  }

  return result.data;
}

/**
 * Tạo nội dung thông qua RAG Backend
 */
export async function generateContent(payload: any) {
  const res = await fetch(`${BASE_URL}/rag-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand: payload.brand,
      topic: payload.topic,
      platform: payload.platform,
      userText: payload.context,
      systemPrompt: payload.systemPrompt
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lỗi tạo nội dung từ Server");
  
  return data;
}

/**
 * Kiểm tra giọng văn (Audit) thông qua Backend 4-Layer Engine
 */
export async function auditContent(payload: any) {
  const res = await fetch(`${BASE_URL}/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand: payload.brand,
      text: payload.text,
      platform: payload.platform,
      language: payload.language,
      product: payload.product,
      products: payload.products, // Add products array support
      rules: payload.rules,
      platformRules: payload.platformRules
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lỗi Audit từ Server");

  return data;
}

export async function createGuidelineFromFile(brandId: string, brandName: string, file: File, currentUser: any) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("brandId", brandId);
  formData.append("type", "guideline");
  formData.append("description", `Initial guideline for ${brandName}`);

  const res = await fetch(`${BASE_URL}/brand-guidelines/upload`, {
    method: "POST",
    body: formData,
  });
  
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Upload guideline thất bại");
  }

  return data; // Trả về { success: true, id: guideId, ... }
}

export async function scrapeWebsiteContent(url: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Không thể lấy nội dung từ link này");
  }
  return data.content || data.text || "";
}

export async function createUserApi(payload: any, token: string) {
  const response = await fetch(`${BASE_URL}/create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create user");
  }
  return result;
}

export async function deleteUserApi(userId: string, token: string) {
  const response = await fetch(`${BASE_URL}/delete-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to delete user");
  }
  return result;
}

export async function approveGuideline(guidelineId: string, hasFile: boolean) {
  const endpoint = hasFile
    ? `${BASE_URL}/brand-guidelines/approve-and-ingest`
    : `${BASE_URL}/brand-guidelines/approve-text-and-ingest`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guidelineId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Approve thất bại");
  }
}

export async function addCommentToGeneration(generationId: string, user: any, content: string) {
  return db.collection('generations').doc(generationId).collection('comments').add({
    parentId: generationId,
    userId: user.uid,
    userName: user.name || user.displayName || user.email,
    userRole: user.role,
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}
