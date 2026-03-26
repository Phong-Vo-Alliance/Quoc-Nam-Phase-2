/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import {
  getFileType,
  isMultiPageDocument,
  isSupportedFileType,
} from "../fileUtils";

describe("fileUtils", () => {
  describe("getFileType", () => {
    it("should detect PDF files", () => {
      expect(getFileType("document.pdf")).toBe("pdf");
      expect(getFileType("REPORT.PDF")).toBe("pdf");
    });

    it("should detect Word files", () => {
      expect(getFileType("document.docx")).toBe("word");
      expect(getFileType("old-doc.doc")).toBe("word");
      expect(getFileType("FILE.DOCX")).toBe("word");
    });

    it("should detect Excel files", () => {
      expect(getFileType("spreadsheet.xlsx")).toBe("excel");
      expect(getFileType("data.xls")).toBe("excel");
      expect(getFileType("BUDGET.XLSX")).toBe("excel");
    });

    it("should detect PowerPoint files", () => {
      expect(getFileType("presentation.pptx")).toBe("powerpoint");
      expect(getFileType("slides.ppt")).toBe("powerpoint");
      expect(getFileType("DECK.PPTX")).toBe("powerpoint");
    });

    it("should detect text files", () => {
      expect(getFileType("notes.txt")).toBe("text");
      expect(getFileType("readme.rtf")).toBe("text");
      expect(getFileType("LOG.TXT")).toBe("text");
    });

    it("should detect image files", () => {
      expect(getFileType("photo.jpg")).toBe("image");
      expect(getFileType("picture.jpeg")).toBe("image");
      expect(getFileType("image.png")).toBe("image");
      expect(getFileType("animation.gif")).toBe("image");
      expect(getFileType("photo.webp")).toBe("image");
    });

    it("should detect video files", () => {
      expect(getFileType("clip.mp4")).toBe("video");
      expect(getFileType("recording.webm")).toBe("video");
      expect(getFileType("MOVIE.MOV")).toBe("video");
    });

    it("should fallback to image for unknown extensions", () => {
      expect(getFileType("file.xyz")).toBe("image");
      expect(getFileType("no-extension")).toBe("image");
      expect(getFileType(".hidden")).toBe("image");
    });

    it("should handle edge cases", () => {
      expect(getFileType("")).toBe("image");
      expect(getFileType("multiple.dots.in.name.pdf")).toBe("pdf");
      expect(getFileType("file.")).toBe("image");
    });
  });

  describe("isMultiPageDocument", () => {
    it("should return true for multi-page documents", () => {
      expect(isMultiPageDocument(2)).toBe(true);
      expect(isMultiPageDocument(5)).toBe(true);
      expect(isMultiPageDocument(100)).toBe(true);
    });

    it("should return false for single-page documents", () => {
      expect(isMultiPageDocument(1)).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isMultiPageDocument(0)).toBe(false);
      expect(isMultiPageDocument(-1)).toBe(false);
    });
  });

  describe("isSupportedFileType", () => {
    it("should return true for supported file types", () => {
      expect(isSupportedFileType("document.pdf")).toBe(true);
      expect(isSupportedFileType("file.docx")).toBe(true);
      expect(isSupportedFileType("data.xlsx")).toBe(true);
      expect(isSupportedFileType("slides.pptx")).toBe(true);
      expect(isSupportedFileType("notes.txt")).toBe(true);
      expect(isSupportedFileType("photo.jpg")).toBe(true);
      expect(isSupportedFileType("video.mp4")).toBe(true);
    });

    it("should return false for unsupported file types", () => {
      expect(isSupportedFileType("audio.mp3")).toBe(false);
      expect(isSupportedFileType("archive.zip")).toBe(false);
      expect(isSupportedFileType("unknown.xyz")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isSupportedFileType("FILE.PDF")).toBe(true);
      expect(isSupportedFileType("IMAGE.JPG")).toBe(true);
      expect(isSupportedFileType("VIDEO.MP4")).toBe(true);
    });

    it("should handle edge cases", () => {
      expect(isSupportedFileType("")).toBe(false);
      expect(isSupportedFileType("no-extension")).toBe(false);
      expect(isSupportedFileType(".hidden")).toBe(false);
    });
  });
});
