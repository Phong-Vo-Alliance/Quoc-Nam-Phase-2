import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import ImagePreviewModal from "../ImagePreviewModal";
import * as filesApi from "@/api/files.api";
import { fileApiClient } from "@/api/fileClient";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock API
vi.mock("@/api/files.api", () => ({
  getImagePreview: vi.fn(),
  createBlobUrl: vi.fn(),
  revokeBlobUrl: vi.fn(),
  downloadFile: vi.fn(),
}));

// Mock fileApiClient
vi.mock("@/api/fileClient", () => ({
  fileApiClient: {
    get: vi.fn(),
  },
}));

describe("ImagePreviewModal", () => {
  const mockBlobUrl = "blob:preview-url-456";
  const mockOnOpenChange = vi.fn();

  // Mock preview API response with canDownload
  const mockPreviewResponse = {
    data: {
      fileId: "file-123",
      fileName: "test.jpg",
      dataBase64: btoa("fake preview image data"),
      contentType: "image/jpeg",
      canDownload: true,
      wasWatermarked: true,
      fromCache: false,
      isPdf: false,
      pageNumber: null,
      totalPages: null,
      wasRedacted: false,
      watermark: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fileApiClient.get for preview endpoint
    vi.mocked(fileApiClient.get).mockResolvedValue(mockPreviewResponse);

    // Mock createBlobUrl
    vi.mocked(filesApi.createBlobUrl).mockReturnValue(mockBlobUrl);

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => mockBlobUrl);
    global.URL.revokeObjectURL = vi.fn();
  });

  it("should not render when closed", () => {
    render(
      <ImagePreviewModal
        open={false}
        onOpenChange={mockOnOpenChange}
        fileId="file-123"
      />,
    );

    expect(screen.queryByTestId("image-preview-modal")).not.toBeInTheDocument();
  });

  it("should show loading skeleton when loading", () => {
    render(
      <ImagePreviewModal
        open={true}
        onOpenChange={mockOnOpenChange}
        fileId="file-123"
      />,
    );

    expect(screen.getByTestId("image-preview-skeleton")).toBeInTheDocument();
  });

  it("should load and display preview image", async () => {
    render(
      <ImagePreviewModal
        open={true}
        onOpenChange={mockOnOpenChange}
        fileId="file-123"
        fileName="test.jpg"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("image-preview-image")).toBeInTheDocument();
    });

    const img = screen.getByTestId("image-preview-image") as HTMLImageElement;
    expect(img.src).toBe(mockBlobUrl);
    expect(img.alt).toBe("test.jpg");

    expect(fileApiClient.get).toHaveBeenCalledWith(
      "/api/Files/file-123/preview",
      expect.objectContaining({
        responseType: "json",
        timeout: 30000,
      }),
    );
    expect(filesApi.createBlobUrl).toHaveBeenCalled();
  });

  it("should show error state when preview fetch fails", async () => {
    vi.mocked(fileApiClient.get).mockRejectedValueOnce(new Error("Load error"));

    render(
      <ImagePreviewModal
        open={true}
        onOpenChange={mockOnOpenChange}
        fileId="file-123"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("image-preview-error")).toBeInTheDocument();
    });

    expect(screen.getByText("Không thể tải ảnh")).toBeInTheDocument();
  });

  it("should call onOpenChange when close button clicked", async () => {
    render(
      <ImagePreviewModal
        open={true}
        onOpenChange={mockOnOpenChange}
        fileId="file-123"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("image-preview-close-button"),
      ).toBeInTheDocument();
    });

    const closeBtn = screen.getByTestId("image-preview-close-button");
    await userEvent.click(closeBtn);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should use default file name if not provided", async () => {
    render(
      <ImagePreviewModal
        open={true}
        onOpenChange={mockOnOpenChange}
        fileId="file-123"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Xem ảnh")).toBeInTheDocument();
    });
  });

  it("should revoke blob URL when modal closes", async () => {
    const { rerender } = render(
      <ImagePreviewModal
        open={true}
        onOpenChange={mockOnOpenChange}
        fileId="file-123"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("image-preview-image")).toBeInTheDocument();
    });

    // Close modal
    rerender(
      <ImagePreviewModal
        open={false}
        onOpenChange={mockOnOpenChange}
        fileId="file-123"
      />,
    );

    await waitFor(() => {
      expect(filesApi.revokeBlobUrl).toHaveBeenCalledWith(mockBlobUrl);
    });
  });

  it("should not load preview if fileId is null", () => {
    render(
      <ImagePreviewModal
        open={true}
        onOpenChange={mockOnOpenChange}
        fileId={null}
      />,
    );

    expect(fileApiClient.get).not.toHaveBeenCalled();
  });

  // ✅ NEW TESTS FOR DOWNLOAD FEATURE

  describe("Download Button", () => {
    it("should show download button when canDownload is true", async () => {
      // Arrange - canDownload=true in mockPreviewResponse by default

      // Act
      render(
        <ImagePreviewModal
          open={true}
          onOpenChange={mockOnOpenChange}
          fileId="file-123"
          fileName="test.jpg"
        />,
      );

      // Assert
      await waitFor(() => {
        const downloadButton = screen.getByTestId("image-download-button");
        expect(downloadButton).toBeInTheDocument();
        expect(downloadButton).not.toBeDisabled();
      });
    });

    it("should hide download button when canDownload is false", async () => {
      // Arrange - Override with canDownload=false
      vi.mocked(fileApiClient.get).mockResolvedValueOnce({
        data: {
          ...mockPreviewResponse.data,
          canDownload: false,
        },
      });

      // Act
      render(
        <ImagePreviewModal
          open={true}
          onOpenChange={mockOnOpenChange}
          fileId="file-123"
          fileName="test.jpg"
        />,
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("image-preview-image")).toBeInTheDocument();
      });

      const downloadButton = screen.queryByTestId("image-download-button");
      expect(downloadButton).not.toBeInTheDocument();
    });

    it("should trigger download when download button clicked", async () => {
      // Arrange
      const mockDownloadBlob = new Blob(["original file data"], {
        type: "image/jpeg",
      });
      vi.mocked(filesApi.downloadFile).mockResolvedValueOnce(mockDownloadBlob);

      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValueOnce(
        mockAnchor as any,
      );

      // Act
      render(
        <ImagePreviewModal
          open={true}
          onOpenChange={mockOnOpenChange}
          fileId="file-123"
          fileName="test.jpg"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("image-download-button")).toBeInTheDocument();
      });

      const downloadButton = screen.getByTestId("image-download-button");
      await userEvent.click(downloadButton);

      // Assert
      await waitFor(() => {
        expect(filesApi.downloadFile).toHaveBeenCalledWith("file-123");
        expect(mockAnchor.download).toBe("test.jpg");
        expect(mockAnchor.click).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Tải ảnh thành công");
      });
    });

    it("should show loading state during download", async () => {
      // Arrange - Mock slow download
      vi.mocked(filesApi.downloadFile).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(new Blob(["data"])), 200),
          ),
      );

      // Act
      render(
        <ImagePreviewModal
          open={true}
          onOpenChange={mockOnOpenChange}
          fileId="file-123"
          fileName="test.jpg"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("image-download-button")).toBeInTheDocument();
      });

      const downloadButton = screen.getByTestId("image-download-button");
      await userEvent.click(downloadButton);

      // Assert - Check loading spinner appears
      await waitFor(() => {
        const spinner = screen.getByTestId("download-spinner");
        expect(spinner).toBeInTheDocument();
        expect(downloadButton).toBeDisabled();
      });

      // Wait for download to complete
      await waitFor(
        () => {
          expect(
            screen.queryByTestId("download-spinner"),
          ).not.toBeInTheDocument();
        },
        { timeout: 500 },
      );
    });

    it("should show error toast when download fails with 404", async () => {
      // Arrange
      vi.mocked(filesApi.downloadFile).mockRejectedValueOnce({
        response: { status: 404 },
      });

      // Act
      render(
        <ImagePreviewModal
          open={true}
          onOpenChange={mockOnOpenChange}
          fileId="file-123"
          fileName="test.jpg"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("image-download-button")).toBeInTheDocument();
      });

      const downloadButton = screen.getByTestId("image-download-button");
      await userEvent.click(downloadButton);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("File không tồn tại");
      });
    });

    it("should show error toast when download fails with 403", async () => {
      // Arrange
      vi.mocked(filesApi.downloadFile).mockRejectedValueOnce({
        response: { status: 403 },
      });

      // Act
      render(
        <ImagePreviewModal
          open={true}
          onOpenChange={mockOnOpenChange}
          fileId="file-123"
          fileName="test.jpg"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("image-download-button")).toBeInTheDocument();
      });

      const downloadButton = screen.getByTestId("image-download-button");
      await userEvent.click(downloadButton);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Không có quyền tải file này");
      });
    });
  });
});
