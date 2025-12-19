
import { AnalysisResult } from '../types';
import firebase, { db } from '../firebase';

const BASE_URL = "https://moodbizcontentcreatorbe.vercel.app/api";

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
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload guideline thất bại");
  }
}

export async function analyzeWebsite(websiteUrl: string): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/brand-guidelines/analyze-brand`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ websiteUrl }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Phân tích website thất bại");
  }
  return data.data;
}

export async function scrapeWebsiteContent(url: string): Promise<string> {
  // Using the analyze-brand endpoint as a proxy since it likely contains scraping logic, 
  // or a dedicated /scrape endpoint if available. 
  // For now, we assume a new endpoint /scrape exists or we adapt.
  // NOTE: If /scrape doesn't exist on backend, this might fail unless backend is updated.
  // Fallback: We try to use the existing analysis endpoint and extract summary/text if possible, 
  // but a dedicated scrape is better.
  
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

export async function generateContent(payload: any) {
  const response = await fetch(`${BASE_URL}/rag-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function auditContent(payload: any) {
  const response = await fetch(`${BASE_URL}/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
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

// --- NEW FEATURES: COLLABORATION ---

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
