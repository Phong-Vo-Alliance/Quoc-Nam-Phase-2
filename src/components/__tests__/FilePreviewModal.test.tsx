import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import FilePreviewModal from "../FilePreviewModal";
import * as usePdfPreviewModule from "@/hooks/usePdfPreview";
import { getVideoStreamBlob, getVideoThumbnailInfo } from "@/api/files.api";

vi.mock("@/api/files.api", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/files.api")>("@/api/files.api");

  return {
    ...actual,
    downloadFile: vi.fn(),
    getVideoStreamBlob: vi.fn(),
    getVideoThumbnailInfo: vi.fn(),
  };
});

// Mock the usePdfPreview hook
const mockUsePdfPreview = vi.spyOn(usePdfPreviewModule, "usePdfPreview");

describe("FilePreviewModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    fileId: "test-file-123",
    fileName: "test-document.pdf",
  };

  const defaultHookReturn = {
    currentPage: 1,
    totalPages: 5,
    imageUrl: "blob:http://localhost:3000/mock-image",
    isLoading: false,
    error: null,
    navigateToPage: vi.fn(),
    retry: vi.fn(),
    canDownload: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePdfPreview.mockReturnValue(defaultHookReturn);
    vi.mocked(getVideoThumbnailInfo).mockResolvedValue({
      fileId: "video-file-123",
      fileName: "demo.mp4",
      imageBase64: btoa("thumb"),
      contentType: "image/jpeg",
      canDownload: true,
      hasWatermark: true,
      size: "large",
      fromCache: false,
    });
    vi.stubGlobal(
      "URL",
      Object.assign(globalThis.URL, {
        createObjectURL: vi.fn(() => "blob:http://localhost:3000/mock-video"),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  describe("TC-FM-001: Renders modal with correct file data", () => {
    it("should not render when isOpen is false", () => {
      // GIVEN
      const props = { ...defaultProps, isOpen: false };

      // WHEN
      const { container } = render(<FilePreviewModal {...props} />);

      // THEN
      expect(container.firstChild).toBeNull();
    });

    it("should render all main sections when open", () => {
      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      expect(screen.getByTestId("file-preview-backdrop")).toBeInTheDocument();
      expect(
        screen.getByTestId("file-preview-modal-container"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("file-preview-modal-header"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("file-preview-content-area"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("file-preview-modal-footer"),
      ).toBeInTheDocument();
    });

    it("should display filename in header", () => {
      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const filenameElement = screen.getByTestId("file-preview-modal-filename");
      expect(filenameElement).toHaveTextContent("test-document.pdf");
    });

    it("should use default filename when not provided", () => {
      // GIVEN
      const { fileName, ...propsWithoutFilename } = defaultProps;

      // WHEN
      render(<FilePreviewModal {...propsWithoutFilename} />);

      // THEN
      const filenameElement = screen.getByTestId("file-preview-modal-filename");
      expect(filenameElement).toHaveTextContent("document.pdf");
    });
  });

  describe("TC-FM-002: Calls usePdfPreview hook with correct fileId", () => {
    it("should call usePdfPreview with fileId on mount", () => {
      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      expect(mockUsePdfPreview).toHaveBeenCalledWith("test-file-123");
    });

    it("should call usePdfPreview with new fileId when it changes", () => {
      // GIVEN
      const { rerender } = render(<FilePreviewModal {...defaultProps} />);

      // WHEN
      rerender(<FilePreviewModal {...defaultProps} fileId="new-file-456" />);

      // THEN
      expect(mockUsePdfPreview).toHaveBeenCalledWith("new-file-456");
    });
  });

  describe("TC-FM-003: Displays page indicator correctly", () => {
    it("should display page indicator with correct Vietnamese text", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 2,
        totalPages: 5,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const indicator = screen.getByTestId("file-preview-page-indicator");
      expect(indicator).toHaveTextContent("Trang 2 / 5");
    });

    it("should update page indicator when page changes", () => {
      // GIVEN
      const { rerender } = render(<FilePreviewModal {...defaultProps} />);

      // WHEN - Navigate to page 3
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 3,
      });
      rerender(<FilePreviewModal {...defaultProps} />);

      // THEN
      const indicator = screen.getByTestId("file-preview-page-indicator");
      expect(indicator).toHaveTextContent("Trang 3 / 5");
    });

    it("should display first page correctly", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 1,
        totalPages: 10,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const indicator = screen.getByTestId("file-preview-page-indicator");
      expect(indicator).toHaveTextContent("Trang 1 / 10");
    });
  });

  describe("TC-FM-004: Next/Prev navigation works", () => {
    it("should navigate to next page when Next button clicked", async () => {
      // GIVEN
      const mockNavigate = vi.fn();
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 2,
        totalPages: 5,
        navigateToPage: mockNavigate,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);
      const nextButton = screen.getByTestId("file-preview-next-button");
      await userEvent.click(nextButton);

      // THEN
      expect(mockNavigate).toHaveBeenCalledWith(3);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("should navigate to previous page when Prev button clicked", async () => {
      // GIVEN
      const mockNavigate = vi.fn();
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 3,
        totalPages: 5,
        navigateToPage: mockNavigate,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);
      const prevButton = screen.getByTestId("file-preview-prev-button");
      await userEvent.click(prevButton);

      // THEN
      expect(mockNavigate).toHaveBeenCalledWith(2);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("should navigate with arrow keys", async () => {
      // GIVEN
      const mockNavigate = vi.fn();
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 2,
        totalPages: 5,
        navigateToPage: mockNavigate,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("{ArrowLeft}");

      // THEN
      expect(mockNavigate).toHaveBeenNthCalledWith(1, 3); // Next page
      expect(mockNavigate).toHaveBeenNthCalledWith(2, 1); // Prev page
    });

    it("should not navigate beyond boundaries with arrow keys", async () => {
      // GIVEN - On first page
      const mockNavigate = vi.fn();
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 1,
        totalPages: 5,
        navigateToPage: mockNavigate,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);
      await userEvent.keyboard("{ArrowLeft}");

      // THEN
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("TC-FM-005: Close button closes modal", () => {
    it("should call onClose when close button clicked", async () => {
      // GIVEN
      const mockOnClose = vi.fn();

      // WHEN
      render(<FilePreviewModal {...defaultProps} onClose={mockOnClose} />);
      const closeButton = screen.getByTestId("file-preview-modal-close-button");
      await userEvent.click(closeButton);

      // THEN
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop clicked", async () => {
      // GIVEN
      const mockOnClose = vi.fn();

      // WHEN
      render(<FilePreviewModal {...defaultProps} onClose={mockOnClose} />);
      const backdrop = screen.getByTestId("file-preview-backdrop");
      await userEvent.click(backdrop);

      // THEN
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not close when clicking modal container", async () => {
      // GIVEN
      const mockOnClose = vi.fn();

      // WHEN
      render(<FilePreviewModal {...defaultProps} onClose={mockOnClose} />);
      const modalContainer = screen.getByTestId("file-preview-modal-container");
      await userEvent.click(modalContainer);

      // THEN
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("TC-FM-006: ESC key closes modal", () => {
    it("should call onClose when ESC key pressed", async () => {
      // GIVEN
      const mockOnClose = vi.fn();

      // WHEN
      render(<FilePreviewModal {...defaultProps} onClose={mockOnClose} />);
      await userEvent.keyboard("{Escape}");

      // THEN
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should handle ESC key from anywhere in modal", async () => {
      // GIVEN
      const mockOnClose = vi.fn();

      // WHEN
      render(<FilePreviewModal {...defaultProps} onClose={mockOnClose} />);
      // Focus image container instead of close button
      const imageContainer = screen.getByTestId("file-preview-image-container");
      imageContainer.focus();

      await userEvent.keyboard("{Escape}");

      // THEN
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("TC-FM-007: Handles API errors", () => {
    it("should display error state when API fails with 404", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        error: new Error("404 - Không tìm thấy tệp"),
        isLoading: false,
        imageUrl: null,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const errorState = screen.getByTestId("file-preview-error-state");
      expect(errorState).toBeInTheDocument();
      expect(screen.getByText("Không tìm thấy tệp")).toBeInTheDocument();
    });

    it("should display error state when API fails with 401", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        error: new Error("401 - Unauthorized"),
        isLoading: false,
        imageUrl: null,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      expect(screen.getByText("Không có quyền truy cập")).toBeInTheDocument();
    });

    it("should display error state for network errors", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        error: new Error("Network Error"),
        isLoading: false,
        imageUrl: null,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      expect(screen.getByText("Lỗi kết nối mạng")).toBeInTheDocument();
    });

    it("should display generic error for unknown errors", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        error: new Error("Something went wrong"),
        isLoading: false,
        imageUrl: null,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      expect(screen.getByText("Không thể tải tệp")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should show retry button in error state", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        error: new Error("File not found"),
        isLoading: false,
        imageUrl: null,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const retryButton = screen.getByTestId("file-preview-error-retry-button");
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent("Thử lại");
    });

    it("should call retry function when retry button clicked", async () => {
      // GIVEN
      const mockRetry = vi.fn();
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        error: new Error("File not found"),
        isLoading: false,
        imageUrl: null,
        retry: mockRetry,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);
      const retryButton = screen.getByTestId("file-preview-error-retry-button");
      await userEvent.click(retryButton);

      // THEN
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("TC-FM-008: Disables buttons at boundaries", () => {
    it("should disable Prev button on first page", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 1,
        totalPages: 5,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const prevButton = screen.getByTestId("file-preview-prev-button");
      expect(prevButton).toBeDisabled();
    });

    it("should disable Next button on last page", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 5,
        totalPages: 5,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const nextButton = screen.getByTestId("file-preview-next-button");
      expect(nextButton).toBeDisabled();
    });

    it("should enable both buttons on middle pages", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 3,
        totalPages: 5,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const prevButton = screen.getByTestId("file-preview-prev-button");
      const nextButton = screen.getByTestId("file-preview-next-button");
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("should disable both buttons when loading", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 3,
        totalPages: 5,
        isLoading: true,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const prevButton = screen.getByTestId("file-preview-prev-button");
      const nextButton = screen.getByTestId("file-preview-next-button");
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  describe("Loading State", () => {
    it("should display loading skeleton when isLoading is true", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
        imageUrl: null,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const loadingSkeleton = screen.getByTestId(
        "file-preview-loading-skeleton",
      );
      expect(loadingSkeleton).toBeInTheDocument();
      expect(screen.getByText(/Đang tải trang/)).toBeInTheDocument();
    });

    it("should not display image when loading", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
        imageUrl: "blob:mock-url",
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      expect(
        screen.queryByTestId("file-preview-image"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Success State", () => {
    it("should display image when loaded successfully", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        currentPage: 2,
        imageUrl: "blob:http://localhost:3000/mock-image",
        isLoading: false,
        error: null,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const image = screen.getByTestId("file-preview-image");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        "src",
        "blob:http://localhost:3000/mock-image",
      );
      expect(image).toHaveAttribute("alt", "Trang 2 của test-document.pdf");
    });

    it("should not display loading or error when success", () => {
      // GIVEN
      mockUsePdfPreview.mockReturnValue({
        ...defaultHookReturn,
        imageUrl: "blob:mock-url",
        isLoading: false,
        error: null,
      });

      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      expect(
        screen.queryByTestId("file-preview-loading-skeleton"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("file-preview-error-state"),
      ).not.toBeInTheDocument();
    });

    it("should load and render video player for video files", async () => {
      vi.mocked(getVideoStreamBlob).mockResolvedValue(
        new Blob(["video"], { type: "video/mp4" }),
      );

      render(
        <FilePreviewModal
          isOpen={true}
          onClose={vi.fn()}
          fileId="video-file-123"
          fileName="demo.mp4"
        />,
      );

      await waitFor(() => {
        expect(getVideoStreamBlob).toHaveBeenCalledWith("video-file-123");
      });
      expect(getVideoThumbnailInfo).toHaveBeenCalledWith("video-file-123");

      const video = await screen.findByTestId("file-preview-video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute(
        "src",
        "blob:http://localhost:3000/mock-video",
      );
      expect(mockUsePdfPreview).toHaveBeenLastCalledWith(null);
    });

    it("should call video stream API once in StrictMode remount", async () => {
      vi.mocked(getVideoStreamBlob).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve(new Blob(["video"], { type: "video/mp4" })),
              20,
            );
          }),
      );

      render(
        <StrictMode>
          <FilePreviewModal
            isOpen={true}
            onClose={vi.fn()}
            fileId="video-file-123"
            fileName="demo.mp4"
          />
        </StrictMode>,
      );

      await waitFor(() => {
        expect(getVideoStreamBlob).toHaveBeenCalledTimes(1);
      });
    });

    it("should hide video download button when canDownload is false", async () => {
      vi.mocked(getVideoStreamBlob).mockResolvedValue(
        new Blob(["video"], { type: "video/mp4" }),
      );
      vi.mocked(getVideoThumbnailInfo).mockResolvedValue({
        fileId: "video-file-123",
        fileName: "demo.mp4",
        imageBase64: btoa("thumb"),
        contentType: "image/jpeg",
        canDownload: false,
        hasWatermark: true,
        size: "large",
        fromCache: false,
      });

      render(
        <FilePreviewModal
          isOpen={true}
          onClose={vi.fn()}
          fileId="video-file-123"
          fileName="demo.mp4"
        />,
      );

      await screen.findByTestId("file-preview-video");
      expect(
        screen.queryByTestId("file-download-button"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label on close button", () => {
      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      const closeButton = screen.getByTestId("file-preview-modal-close-button");
      expect(closeButton).toHaveAttribute("aria-label", "Đóng");
    });

    it("should focus close button on mount", async () => {
      // WHEN
      render(<FilePreviewModal {...defaultProps} />);

      // THEN
      await waitFor(() => {
        const closeButton = screen.getByTestId(
          "file-preview-modal-close-button",
        );
        expect(closeButton).toHaveFocus();
      });
    });
  });
});
