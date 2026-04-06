"use client";

import type { ReportFormData } from "./types";

export async function generateReport(
  data: ReportFormData,
  templateFile: string,
  format: "pdf" | "word"
): Promise<void> {
  try {
    // Call the API to generate document
    const response = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data, templateFile, format }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || "Failed to generate document");
    }

    // Get the file blob
    const fileBlob = await response.blob();

    // Create download link and trigger download
    const extension = format === "pdf" ? "pdf" : "docx";
    const fileName = `TUV_Report_${data.car.reportNumber || "draft"}.${extension}`;

    const url = window.URL.createObjectURL(fileBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}
