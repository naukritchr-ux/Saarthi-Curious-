import { API_BASE } from "../config/api";
import { appendActorParams } from "../utils/auditHelper";

export const uploadProgramThumbnail = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const url = appendActorParams(`${API_BASE}/programs/upload-thumbnail`);
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to upload thumbnail");
  }

  return data.file_url;
};

export const createProgram = async (programData) => {
  const url = appendActorParams(`${API_BASE}/programs`);
  const response = await fetch(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(programData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed");
  }

  return data;
};

export const getRetentionQuiz = async (programId) => {
  const url = appendActorParams(`${API_BASE}/programs/${programId}/retention-quiz`);
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed");
  }

  return data;
};

export const updateRetentionQuiz = async (programId, retentionQuizData) => {
  const url = appendActorParams(`${API_BASE}/programs/${programId}/retention-quiz`);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(retentionQuizData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed");
  }

  return data;
};

export const getApplicationCheck = async (programId, checkNumber) => {
  const url = appendActorParams(`${API_BASE}/programs/${programId}/application-check/${checkNumber}`);
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed");
  }

  return data;
};

export const updateApplicationCheck = async (
  programId,
  checkNumber,
  applicationCheckData
) => {
  const url = appendActorParams(`${API_BASE}/programs/${programId}/application-check/${checkNumber}`);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicationCheckData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed");
  }

  return data;
};

export const publishProgram = async (programId) => {
  const url = appendActorParams(`${API_BASE}/programs/${programId}/publish`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to publish program");
  }

  return data;
};