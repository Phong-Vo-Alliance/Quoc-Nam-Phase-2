import { describe, it, expect, beforeEach, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { fileApiClient } from "../fileClient";
import {
  uploadFile,
  getImageThumbnail,
  getImageThumbnailInfo,
  getVideoThumbnail,
  getVideoStreamBlob,
  getImagePreview,
  createBlobUrl,
  revokeBlobUrl,
  downloadFile,
} from "../files.api";
import type { UploadFileResult } from "@/types/files";
import type { ThumbnailInfoDto } from "@/types/filePreview";

describe("files.api", () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    // Create fresh mock adapter for each test
    mockAxios = new MockAdapter(fileApiClient);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe("uploadFile()", () => {
    const mockFile = new File(["test content"], "test-document.pdf", {
      type: "application/pdf",
    });

    const mockUploadSuccess: UploadFileResult = {
      fileId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      storagePath: "chat/2024/01/06/3fa85f64-5717-4562-b3fc-2c963f66afa6.pdf",
      fileName: "test-document.pdf",
      contentType: "application/pdf",
      size: 1048576,
    };

    it("should upload file successfully", async () => {
      // Mock API response
      mockAxios.onPost(/\/api\/Files\?/).reply(201, mockUploadSuccess);

      // Upload file
      const result = await uploadFile({
        file: mockFile,
        sourceModule: 1,
      });

      // Verify result
      expect(result).toEqual(mockUploadSuccess);
      expect(result.fileId).toBe("3fa85f64-5717-4562-b3fc-2c963f66afa6");
      expect(result.fileName).toBe("test-document.pdf");
    });

    it("should create FormData with correct file", async () => {
      // Spy on FormData
      const formDataSpy = vi.spyOn(FormData.prototype, "append");

      mockAxios.onPost(/\/api\/Files\?/).reply(201, mockUploadSuccess);

      await uploadFile({
        file: mockFile,
        sourceModule: 1,
      });

      // Verify FormData contains file
      expect(formDataSpy).toHaveBeenCalledWith("file", mockFile);

      formDataSpy.mockRestore();
    });

    it("should include sourceModule in query params", async () => {
      mockAxios
        .onPost(/\/api\/Files\?sourceModule=1/)
        .reply(201, mockUploadSuccess);

      await uploadFile({
        file: mockFile,
        sourceModule: 1,
      });

      // Verify request was made with correct query param
      expect(mockAxios.history.post[0].url).toContain("sourceModule=1");
    });

    it("should include sourceEntityId if provided", async () => {
      const entityId = "conversation-uuid-123";

      mockAxios
        .onPost(/\/api\/Files\?sourceModule=1&sourceEntityId=/)
        .reply(201, mockUploadSuccess);

      await uploadFile({
        file: mockFile,
        sourceModule: 1,
        sourceEntityId: entityId,
      });

      // Verify URL contains sourceEntityId
      expect(mockAxios.history.post[0].url).toContain(
        `sourceEntityId=${entityId}`,
      );
    });

    it("should call onUploadProgress callback", async () => {
      const onProgressMock = vi.fn();

      mockAxios.onPost(/\/api\/Files\?/).reply(201, mockUploadSuccess);

      await uploadFile({
        file: mockFile,
        sourceModule: 1,
        onUploadProgress: onProgressMock,
      });

      // Note: MockAdapter doesn't trigger onUploadProgress
      // In real scenario, this would be called during upload
      // We verify it's passed to axios config
      expect(mockAxios.history.post[0].onUploadProgress).toBeDefined();
    });

    it("should handle 401 Unauthorized error", async () => {
      mockAxios.onPost(/\/api\/Files\?/).reply(401, {
        type: "https://tools.ietf.org/html/rfc7235#section-3.1",
        title: "Unauthorized",
        status: 401,
        detail: "Authorization has been denied for this request.",
      });

      await expect(
        uploadFile({
          file: mockFile,
          sourceModule: 1,
        }),
      ).rejects.toThrow();
    });

    it("should handle 400 Bad Request error", async () => {
      mockAxios.onPost(/\/api\/Files\?/).reply(400, {
        type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
        title: "One or more validation errors occurred.",
        status: 400,
        detail: "The sourceModule field is required.",
      });

      await expect(
        uploadFile({
          file: mockFile,
          sourceModule: 1,
        }),
      ).rejects.toThrow();
    });

    it("should handle 413 File Too Large error", async () => {
      mockAxios.onPost(/\/api\/Files\?/).reply(413, {
        type: "https://tools.ietf.org/html/rfc7231#section-6.5.11",
        title: "Payload Too Large",
        status: 413,
        detail: "The uploaded file exceeds the maximum allowed size.",
      });

      await expect(
        uploadFile({
          file: mockFile,
          sourceModule: 1,
        }),
      ).rejects.toThrow();
    });

    it("should handle 415 Unsupported Media Type error", async () => {
      mockAxios.onPost(/\/api\/Files\?/).reply(415, {
        type: "https://tools.ietf.org/html/rfc7231#section-6.5.13",
        title: "Unsupported Media Type",
        status: 415,
        detail: "The uploaded file type is not supported.",
      });

      await expect(
        uploadFile({
          file: mockFile,
          sourceModule: 1,
        }),
      ).rejects.toThrow();
    });

    it("should handle network error", async () => {
      mockAxios.onPost(/\/api\/Files\?/).networkError();

      await expect(
        uploadFile({
          file: mockFile,
          sourceModule: 1,
        }),
      ).rejects.toThrow();
    });
  });

  describe("getImageThumbnail()", () => {
    const mockThumbnailDto: ThumbnailInfoDto = {
      fileId: "file-123",
      fileName: "photo.jpg",
      imageBase64: btoa("fake-thumbnail-data"),
      contentType: "image/jpeg",
      canDownload: true,
      hasWatermark: true,
      size: "large",
      fromCache: false,
    };

    it("should fetch thumbnail and convert base64 to Blob", async () => {
      // GIVEN: Mock API returns JSON ThumbnailInfoDto
      // Note: use regex because fileClient interceptor appends ?t=timestamp
      mockAxios
        .onGet(/\/api\/Files\/file-123\/watermarked-thumbnail/)
        .reply(200, mockThumbnailDto);

      // WHEN: Call API with fileId and size
      const result = await getImageThumbnail("file-123", "large");

      // THEN: Returns Blob converted from base64
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("image/jpeg");

      // Verify request params (no responseType: "blob")
      const request = mockAxios.history.get[0];
      expect(request.url).toContain(
        "/api/Files/file-123/watermarked-thumbnail",
      );
      expect(request.params).toEqual({ size: "large" });
      expect(request.responseType).toBeUndefined();
      expect(request.timeout).toBe(30000);
    });

    it("should use default size 'large' when not provided", async () => {
      mockAxios
        .onGet(/\/api\/Files\/.*\/watermarked-thumbnail/)
        .reply(200, mockThumbnailDto);

      await getImageThumbnail("file-456");

      const request = mockAxios.history.get[0];
      expect(request.params).toEqual({ size: "large" });
    });

    it("should handle timeout errors", async () => {
      mockAxios.onGet(/\/api\/Files\/.*\/watermarked-thumbnail/).timeout();

      await expect(getImageThumbnail("file-789")).rejects.toThrow();
    });

    it("should handle 404 errors", async () => {
      mockAxios
        .onGet("/api/Files/file-999/watermarked-thumbnail")
        .reply(404, { message: "File not found" });

      await expect(getImageThumbnail("file-999")).rejects.toThrow();
    });

    it("should accept all size values (small, medium, large)", async () => {
      mockAxios
        .onGet(/\/api\/Files\/.*\/watermarked-thumbnail/)
        .reply(200, mockThumbnailDto);

      // Test small
      await getImageThumbnail("file-1", "small");
      expect(mockAxios.history.get[0].params.size).toBe("small");

      // Test medium
      await getImageThumbnail("file-2", "medium");
      expect(mockAxios.history.get[1].params.size).toBe("medium");

      // Test large
      await getImageThumbnail("file-3", "large");
      expect(mockAxios.history.get[2].params.size).toBe("large");
    });
  });

  describe("getImageThumbnailInfo()", () => {
    const mockThumbnailDto: ThumbnailInfoDto = {
      fileId: "file-123",
      fileName: "photo.jpg",
      imageBase64: btoa("fake-thumbnail-data"),
      contentType: "image/jpeg",
      canDownload: true,
      hasWatermark: true,
      size: "large",
      fromCache: false,
    };

    it("should return full ThumbnailInfoDto with metadata", async () => {
      mockAxios
        .onGet(/\/api\/Files\/file-123\/watermarked-thumbnail/)
        .reply(200, mockThumbnailDto);

      const result = await getImageThumbnailInfo("file-123", "large");

      expect(result).toEqual(mockThumbnailDto);
      expect(result.canDownload).toBe(true);
      expect(result.hasWatermark).toBe(true);
      expect(result.contentType).toBe("image/jpeg");
    });

    it("should use default size 'large' when not provided", async () => {
      mockAxios
        .onGet(/\/api\/Files\/.*\/watermarked-thumbnail/)
        .reply(200, mockThumbnailDto);

      await getImageThumbnailInfo("file-456");

      const request = mockAxios.history.get[0];
      expect(request.params).toEqual({ size: "large" });
    });
  });

  describe("getVideoThumbnail()", () => {
    const mockThumbnailDto: ThumbnailInfoDto = {
      fileId: "video-file-123",
      fileName: "demo.mp4",
      imageBase64: btoa("fake-video-thumbnail"),
      contentType: "image/jpeg",
      canDownload: true,
      hasWatermark: false,
      size: "320",
      fromCache: false,
    };

    it("should fetch video thumbnail and convert base64 to Blob", async () => {
      mockAxios
        .onGet(/\/api\/Files\/video-file-123\/video-thumbnail/)
        .reply(200, mockThumbnailDto);

      const result = await getVideoThumbnail("video-file-123");

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("image/jpeg");

      const request = mockAxios.history.get[0];
      expect(request.url).toContain(
        "/api/Files/video-file-123/video-thumbnail",
      );
      expect(request.params).toEqual({ width: 320 });
      expect(request.timeout).toBe(30000);
    });

    it("should use custom width when provided", async () => {
      mockAxios
        .onGet(/\/api\/Files\/video-file-123\/video-thumbnail/)
        .reply(200, mockThumbnailDto);

      await getVideoThumbnail("video-file-123", 640);

      expect(mockAxios.history.get[0].params).toEqual({ width: 640 });
    });
  });

  describe("getVideoStreamBlob()", () => {
    it("should fetch video stream as blob", async () => {
      const mockBlob = new Blob(["video-bytes"], { type: "video/mp4" });

      mockAxios
        .onGet("/api/Files/video-stream-123/stream")
        .reply(200, mockBlob);

      const result = await getVideoStreamBlob("video-stream-123");

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("video/mp4");

      const request = mockAxios.history.get[0];
      expect(request.responseType).toBe("blob");
      expect(request.timeout).toBe(60000);
    });
  });

  describe("getImagePreview()", () => {
    it("should fetch preview with correct endpoint and parse JSON response", async () => {
      // Mock JSON response (UPDATED 2026-03-06: API returns JSON with base64 data)
      const mockBase64 = btoa("fake-preview-image-data");
      const mockJsonResponse = {
        fileId: "file-123",
        fileName: "test.png",
        dataBase64: mockBase64,
        contentType: "image/png",
        canDownload: true,
        wasWatermarked: true,
        fromCache: false,
        isPdf: false,
        pageNumber: null,
        totalPages: null,
        wasRedacted: false,
        watermark: null,
      };

      // Note: use regex because fileClient interceptor appends ?t=timestamp
      mockAxios
        .onGet(/\/api\/Files\/file-123\/preview/)
        .reply(200, mockJsonResponse);

      const result = await getImagePreview("file-123");

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("image/png");

      const request = mockAxios.history.get[0];
      expect(request.url).toContain("/api/Files/file-123/preview");
      expect(request.responseType).toBe("json"); // Changed from "blob"
      expect(request.timeout).toBe(30000);
    });

    it("should handle preview errors (404, network)", async () => {
      mockAxios
        .onGet("/api/Files/file-missing/preview")
        .reply(404, { message: "File not found" });

      await expect(getImagePreview("file-missing")).rejects.toThrow();
    });

    it("should handle missing dataBase64 in response", async () => {
      const mockInvalidResponse = {
        fileId: "file-test",
        fileName: "test.png",
        dataBase64: null, // Missing data
        contentType: "image/png",
        canDownload: true,
        wasWatermarked: false,
        fromCache: false,
        isPdf: false,
        pageNumber: null,
        totalPages: null,
        wasRedacted: false,
        watermark: null,
      };

      mockAxios
        .onGet(/\/api\/Files\/file-test\/preview/)
        .reply(200, mockInvalidResponse);

      await expect(getImagePreview("file-test")).rejects.toThrow(
        "No image data in preview response",
      );
    });

    it("should have 30s timeout configured", async () => {
      const mockBase64 = btoa("preview-jpeg");
      const mockJsonResponse = {
        fileId: "file-timeout",
        fileName: "test.jpg",
        dataBase64: mockBase64,
        contentType: "image/jpeg",
        canDownload: true,
        wasWatermarked: false,
        fromCache: false,
        isPdf: false,
        pageNumber: null,
        totalPages: null,
        wasRedacted: false,
        watermark: null,
      };

      mockAxios
        .onGet(/\/api\/Files\/file-timeout\/preview/)
        .reply(200, mockJsonResponse);

      await getImagePreview("file-timeout");

      const request = mockAxios.history.get[0];
      expect(request.timeout).toBe(30000);
    });
  });

  describe("createBlobUrl()", () => {
    it("should create blob URL from blob", () => {
      const mockBlob = new Blob(["test data"], { type: "image/jpeg" });
      const blobUrl = createBlobUrl(mockBlob);

      expect(blobUrl).toMatch(/^blob:/);
      expect(typeof blobUrl).toBe("string");

      // Cleanup
      revokeBlobUrl(blobUrl);
    });

    it("should create different URLs for different blobs", () => {
      const blob1 = new Blob(["data1"], { type: "image/jpeg" });
      const blob2 = new Blob(["data2"], { type: "image/png" });

      const url1 = createBlobUrl(blob1);
      const url2 = createBlobUrl(blob2);

      expect(url1).not.toBe(url2);

      // Cleanup
      revokeBlobUrl(url1);
      revokeBlobUrl(url2);
    });
  });

  describe("revokeBlobUrl()", () => {
    it("should revoke blob URL without throwing", () => {
      const mockBlob = new Blob(["test"], { type: "image/jpeg" });
      const blobUrl = createBlobUrl(mockBlob);

      expect(() => revokeBlobUrl(blobUrl)).not.toThrow();
    });

    it("should handle invalid URL gracefully", () => {
      // Should not throw when revoking invalid URL
      expect(() => revokeBlobUrl("invalid-url")).not.toThrow();
      expect(() => revokeBlobUrl("")).not.toThrow();
    });
  });

  describe("downloadFile()", () => {
    it("should download file successfully", async () => {
      // Arrange
      const mockFileId = "test-file-id-123";
      const mockBlob = new Blob(["fake image data"], { type: "image/jpeg" });

      mockAxios
        .onGet(`/api/Files/${mockFileId}/download`)
        .reply(200, mockBlob, {
          "content-type": "image/jpeg",
          "content-disposition": 'attachment; filename="test.jpg"',
        });

      // Act
      const result = await downloadFile(mockFileId);

      // Assert
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("image/jpeg");
    });

    it("should use 60s timeout for large files", async () => {
      // Arrange
      const mockFileId = "large-file-id";
      const mockBlob = new Blob(["large file data"]);

      mockAxios.onGet(`/api/Files/${mockFileId}/download`).reply(200, mockBlob);

      // Act
      await downloadFile(mockFileId);

      // Assert
      const request = mockAxios.history.get[0];
      expect(request.timeout).toBe(60000);
    });

    it("should throw error when file not found (404)", async () => {
      // Arrange
      const mockFileId = "non-existent-file-id";

      mockAxios.onGet(`/api/Files/${mockFileId}/download`).reply(404, {
        title: "Not Found",
        status: 404,
        errors: { fileId: ["File không tồn tại"] },
      });

      // Act & Assert
      await expect(downloadFile(mockFileId)).rejects.toThrow();
    });

    it("should throw error when unauthorized (401)", async () => {
      // Arrange
      const mockFileId = "test-file-id";

      mockAxios.onGet(`/api/Files/${mockFileId}/download`).reply(401, {
        title: "Unauthorized",
        status: 401,
      });

      // Act & Assert
      await expect(downloadFile(mockFileId)).rejects.toThrow();
    });

    it("should throw error when forbidden (403)", async () => {
      // Arrange
      const mockFileId = "forbidden-file-id";

      mockAxios.onGet(`/api/Files/${mockFileId}/download`).reply(403, {
        title: "Forbidden",
        status: 403,
      });

      // Act & Assert
      await expect(downloadFile(mockFileId)).rejects.toThrow();
    });

    it("should throw error on network timeout", async () => {
      // Arrange
      const mockFileId = "test-file-id";

      mockAxios.onGet(`/api/Files/${mockFileId}/download`).timeout();

      // Act & Assert
      await expect(downloadFile(mockFileId)).rejects.toThrow();
    });
  });
});
