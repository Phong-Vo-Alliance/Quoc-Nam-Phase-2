/**
 * Unit tests for receiveInfoMessage utility functions
 *
 * Feature: CHAT-026 - Receive Info System Message
 */

import { describe, it, expect } from "vitest";
import {
  isImageAttachment,
  classifyAttachments,
  truncateText,
  formatTime24h,
  getMessageContentDescription,
  buildReceiveInfoContent,
} from "./receiveInfoMessage";
import type { Message, FileAttachment } from "@/features/portal/types";

// Helper to create a mock message
const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: "msg-1",
  groupId: "group-1",
  senderId: "user-1",
  type: "text",
  sender: "Test User",
  time: "14:30",
  createdAt: "2026-02-24T14:30:00.000Z",
  ...overrides,
});

// Helper to create a mock file attachment
const createMockFile = (
  name: string,
  type: "image" | "pdf" | "excel" | "word" | "other" = "other",
): FileAttachment => ({
  id: `file-${name}`,
  name,
  url: `https://example.com/${name}`,
  type,
});

describe("isImageAttachment", () => {
  it("should return true for .jpg files", () => {
    expect(isImageAttachment(createMockFile("photo.jpg", "image"))).toBe(true);
  });

  it("should return true for .jpeg files", () => {
    expect(isImageAttachment(createMockFile("photo.jpeg", "image"))).toBe(true);
  });

  it("should return true for .png files", () => {
    expect(isImageAttachment(createMockFile("screenshot.png", "image"))).toBe(
      true,
    );
  });

  it("should return true for .gif files", () => {
    expect(isImageAttachment(createMockFile("animation.gif", "image"))).toBe(
      true,
    );
  });

  it("should return true for .webp files", () => {
    expect(isImageAttachment(createMockFile("modern.webp", "image"))).toBe(
      true,
    );
  });

  it("should return true for .bmp files", () => {
    expect(isImageAttachment(createMockFile("old.bmp", "image"))).toBe(true);
  });

  it("should return false for .pdf files", () => {
    expect(isImageAttachment(createMockFile("document.pdf", "pdf"))).toBe(
      false,
    );
  });

  it("should return false for .xlsx files", () => {
    expect(isImageAttachment(createMockFile("report.xlsx", "excel"))).toBe(
      false,
    );
  });

  it("should return false for .docx files", () => {
    expect(isImageAttachment(createMockFile("memo.docx", "word"))).toBe(false);
  });

  it("should handle case-insensitive extensions", () => {
    expect(isImageAttachment(createMockFile("PHOTO.JPG", "image"))).toBe(true);
    expect(isImageAttachment(createMockFile("Photo.PNG", "image"))).toBe(true);
  });
});

describe("classifyAttachments", () => {
  it("should classify all images correctly", () => {
    const files = [
      createMockFile("a.jpg", "image"),
      createMockFile("b.png", "image"),
    ];
    const result = classifyAttachments(files);
    expect(result.isAllImages).toBe(true);
    expect(result.isAllDocuments).toBe(false);
    expect(result.isMixed).toBe(false);
    expect(result.images).toHaveLength(2);
    expect(result.documents).toHaveLength(0);
  });

  it("should classify all documents correctly", () => {
    const files = [
      createMockFile("a.pdf", "pdf"),
      createMockFile("b.xlsx", "excel"),
    ];
    const result = classifyAttachments(files);
    expect(result.isAllImages).toBe(false);
    expect(result.isAllDocuments).toBe(true);
    expect(result.isMixed).toBe(false);
    expect(result.images).toHaveLength(0);
    expect(result.documents).toHaveLength(2);
  });

  it("should classify mixed attachments correctly", () => {
    const files = [
      createMockFile("photo.jpg", "image"),
      createMockFile("doc.pdf", "pdf"),
    ];
    const result = classifyAttachments(files);
    expect(result.isAllImages).toBe(false);
    expect(result.isAllDocuments).toBe(false);
    expect(result.isMixed).toBe(true);
    expect(result.images).toHaveLength(1);
    expect(result.documents).toHaveLength(1);
  });

  it("should handle empty array", () => {
    const result = classifyAttachments([]);
    expect(result.isAllImages).toBe(false);
    expect(result.isAllDocuments).toBe(false);
    expect(result.isMixed).toBe(false);
  });
});

describe("truncateText", () => {
  it("should not truncate text shorter than max length", () => {
    expect(truncateText("Hello", 60)).toBe("Hello");
  });

  it("should not truncate text equal to max length", () => {
    const text = "A".repeat(60);
    expect(truncateText(text, 60)).toBe(text);
  });

  it("should truncate text longer than max length", () => {
    const text = "A".repeat(65);
    expect(truncateText(text, 60)).toBe("A".repeat(60) + "…");
  });

  it("should use default max length of 60", () => {
    const text = "A".repeat(65);
    expect(truncateText(text)).toBe("A".repeat(60) + "…");
  });
});

describe("formatTime24h", () => {
  it("should format Date object to HH:mm", () => {
    const date = new Date("2026-02-24T14:30:00.000Z");
    // Note: This depends on timezone, so we check format pattern
    const result = formatTime24h(date);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("should format ISO string to HH:mm", () => {
    const result = formatTime24h("2026-02-24T09:05:00.000Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("getMessageContentDescription", () => {
  it("should return text content for text message", () => {
    const msg = createMockMessage({ content: "Báo cáo doanh thu" });
    expect(getMessageContentDescription(msg)).toBe('"Báo cáo doanh thu"');
  });

  it("should truncate long text content", () => {
    const longText = "A".repeat(70);
    const msg = createMockMessage({ content: longText });
    expect(getMessageContentDescription(msg)).toBe(`"${"A".repeat(60)}…"`);
  });

  it("should return file name for single file", () => {
    const msg = createMockMessage({
      content: "",
      files: [createMockFile("report.pdf", "pdf")],
    });
    expect(getMessageContentDescription(msg)).toBe('"report.pdf"');
  });

  it("should handle single file via fileInfo", () => {
    const msg = createMockMessage({
      content: "",
      fileInfo: createMockFile("document.xlsx", "excel"),
    });
    expect(getMessageContentDescription(msg)).toBe('"document.xlsx"');
  });

  it("should return correct format for multiple files", () => {
    const msg = createMockMessage({
      content: "",
      files: [
        createMockFile("report.pdf", "pdf"),
        createMockFile("data.xlsx", "excel"),
        createMockFile("memo.docx", "word"),
      ],
    });
    expect(getMessageContentDescription(msg)).toBe(
      '"report.pdf" và 2 tài liệu khác',
    );
  });

  it("should return correct format for multiple images", () => {
    const msg = createMockMessage({
      content: "",
      files: [
        createMockFile("photo1.jpg", "image"),
        createMockFile("photo2.png", "image"),
        createMockFile("photo3.gif", "image"),
        createMockFile("photo4.webp", "image"),
      ],
    });
    expect(getMessageContentDescription(msg)).toBe(
      '"photo1.jpg" và 3 ảnh khác',
    );
  });

  it("should return correct format for mixed attachments", () => {
    const msg = createMockMessage({
      content: "",
      files: [
        createMockFile("photo.jpg", "image"),
        createMockFile("report.pdf", "pdf"),
        createMockFile("data.xlsx", "excel"),
        createMockFile("screenshot.png", "image"),
        createMockFile("memo.docx", "word"),
      ],
    });
    expect(getMessageContentDescription(msg)).toBe(
      '"photo.jpg" và 4 tài liệu và ảnh khác',
    );
  });

  it("should prioritize text content over attachments", () => {
    const msg = createMockMessage({
      content: "Đây là nội dung text",
      files: [createMockFile("report.pdf", "pdf")],
    });
    expect(getMessageContentDescription(msg)).toBe('"Đây là nội dung text"');
  });

  it("should return fallback for empty message", () => {
    const msg = createMockMessage({ content: "" });
    expect(getMessageContentDescription(msg)).toBe('"Tin nhắn"');
  });

  it("should trim whitespace-only content", () => {
    const msg = createMockMessage({ content: "   " });
    expect(getMessageContentDescription(msg)).toBe('"Tin nhắn"');
  });
});

describe("buildReceiveInfoContent", () => {
  it("should build correct content for text message", () => {
    const msg = createMockMessage({ content: "Báo cáo doanh thu" });
    const result = buildReceiveInfoContent(
      msg,
      "Nguyễn Văn A",
      "2026-02-24T14:30:00.000Z",
    );
    expect(result).toContain('"Báo cáo doanh thu"');
    expect(result).toContain("đã được tiếp nhận bởi Nguyễn Văn A");
    expect(result).toContain("lúc");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("should build correct content for single file", () => {
    const msg = createMockMessage({
      content: "",
      files: [createMockFile("report.pdf", "pdf")],
    });
    const result = buildReceiveInfoContent(
      msg,
      "Trần Thị B",
      "2026-02-24T09:15:00.000Z",
    );
    expect(result).toContain('"report.pdf"');
    expect(result).toContain("đã được tiếp nhận bởi Trần Thị B");
  });

  it("should build correct content for multiple images", () => {
    const msg = createMockMessage({
      content: "",
      files: [
        createMockFile("photo1.jpg", "image"),
        createMockFile("photo2.png", "image"),
        createMockFile("photo3.gif", "image"),
      ],
    });
    const result = buildReceiveInfoContent(
      msg,
      "Lê Văn C",
      new Date("2026-02-24T16:45:00.000Z"),
    );
    expect(result).toContain('"photo1.jpg" và 2 ảnh khác');
    expect(result).toContain("đã được tiếp nhận bởi Lê Văn C");
  });

  it("should work with Date object", () => {
    const msg = createMockMessage({ content: "Test" });
    const date = new Date("2026-02-24T08:00:00.000Z");
    const result = buildReceiveInfoContent(msg, "Test User", date);
    expect(result).toContain("đã được tiếp nhận bởi Test User");
    expect(result).toContain("lúc");
  });
});
