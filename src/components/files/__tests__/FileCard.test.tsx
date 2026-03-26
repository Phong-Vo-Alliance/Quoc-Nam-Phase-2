/**
 * File Display Component Tests - FileCard, FileListItem, FileGrid, FileList
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileCard from "@/components/files/FileCard";
import FileListItem from "@/components/files/FileListItem";
import FileGrid from "@/components/files/FileGrid";
import FileList from "@/components/files/FileList";
import { getVideoThumbnail } from "@/api/files.api";
import type { ExtractedFile } from "@/types/files";

vi.mock("@/api/files.api", () => ({
  getVideoThumbnail: vi.fn(),
}));

const mockFile: ExtractedFile = {
  id: "1",
  name: "document.pdf",
  contentType: "application/pdf",
  size: 1024 * 100,
  url: "https://example.com/document.pdf",
  uploadedAt: "2025-01-09T10:00:00Z",
  senderName: "Alice",
};

const mockImageFile: ExtractedFile = {
  id: "2",
  name: "photo.jpg",
  contentType: "image/jpeg",
  size: 1024 * 50,
  url: "https://example.com/photo.jpg",
  uploadedAt: "2025-01-08T10:00:00Z",
  senderName: "Bob",
};

const mockVideoFile: ExtractedFile = {
  id: "3",
  name: "demo.mp4",
  contentType: "video/mp4",
  size: 1024 * 500,
  url: "https://example.com/demo.mp4",
  uploadedAt: "2025-01-07T10:00:00Z",
  senderName: "Carol",
};

describe("FileCard", () => {
  beforeEach(() => {
    vi.mocked(getVideoThumbnail).mockReset();
    vi.stubGlobal(
      "URL",
      Object.assign(globalThis.URL, {
        createObjectURL: vi.fn(() => "blob:video-thumb"),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  it("should render file card with name", () => {
    render(<FileCard file={mockFile} />);
    expect(
      screen.getByTestId(`chat-file-card-${mockFile.id}`),
    ).toBeInTheDocument();
  });

  it("should display filename (truncated)", () => {
    render(<FileCard file={mockFile} />);
    const nameElement = screen.getByTestId(
      `chat-file-card-name-${mockFile.id}`,
    );
    expect(nameElement).toHaveTextContent("document.pdf");
  });

  it("should show preview and download buttons on hover", async () => {
    const user = userEvent.setup();
    const { container } = render(<FileCard file={mockFile} />);

    const card = container.querySelector(
      '[data-testid="chat-file-card-' + mockFile.id + '"]',
    );
    await user.hover(card!);

    const previewBtn = screen.getByTestId(
      `chat-file-card-preview-button-${mockFile.id}`,
    );
    const downloadBtn = screen.getByTestId(
      `chat-file-card-download-button-${mockFile.id}`,
    );

    expect(previewBtn).toBeVisible();
    expect(downloadBtn).toBeVisible();
  });

  it("should call onPreview callback", async () => {
    const onPreview = vi.fn();
    const user = userEvent.setup();
    render(<FileCard file={mockFile} onPreview={onPreview} position={0} />);

    const viewButton = screen.getByTestId(
      `chat-file-card-view-button-${mockFile.id}`,
    );
    await user.click(viewButton);

    expect(onPreview).toHaveBeenCalledWith(mockFile, 0);
  });

  it("should display file size", () => {
    render(<FileCard file={mockFile} />);
    // Should show formatted size like "100 KB"
    const card = screen.getByTestId(`chat-file-card-${mockFile.id}`);
    expect(card.textContent).toContain("KB");
  });

  it("should display file type label", () => {
    render(<FileCard file={mockFile} />);
    const card = screen.getByTestId(`chat-file-card-${mockFile.id}`);
    expect(card.textContent).toContain("PDF");
  });

  it("should load and display video thumbnail for video files", async () => {
    vi.mocked(getVideoThumbnail).mockResolvedValue(
      new Blob(["thumb"], { type: "image/jpeg" }),
    );

    render(<FileCard file={mockVideoFile} />);

    expect(await screen.findByAltText("demo.mp4")).toBeInTheDocument();
    expect(getVideoThumbnail).toHaveBeenCalledWith("3");
  });
});

describe("FileListItem", () => {
  it("should render list item", () => {
    render(<FileListItem file={mockFile} />);
    expect(
      screen.getByTestId(`chat-file-list-item-${mockFile.id}`),
    ).toBeInTheDocument();
  });

  it("should display full filename", () => {
    render(<FileListItem file={mockFile} />);
    const nameElement = screen.getByTestId(
      `chat-file-list-item-name-${mockFile.id}`,
    );
    expect(nameElement).toHaveTextContent("document.pdf");
  });

  it("should display file metadata", () => {
    render(<FileListItem file={mockFile} />);
    const listItem = screen.getByTestId(`chat-file-list-item-${mockFile.id}`);

    expect(listItem.textContent).toContain("PDF");
    expect(listItem.textContent).toContain("KB");
  });

  it("should show file icon", () => {
    render(<FileListItem file={mockFile} />);
    const icon = screen.getByTestId(`chat-file-list-item-icon-${mockFile.id}`);
    expect(icon).toBeInTheDocument();
  });

  it("should show sender name on hover (for documents)", async () => {
    const user = userEvent.setup();
    const { container } = render(<FileListItem file={mockFile} />);

    const listItem = container.querySelector(
      `[data-testid="chat-file-list-item-${mockFile.id}"]`,
    );
    await user.hover(listItem!);

    const senderInfo = screen.getByTestId(
      `chat-file-list-item-sender-${mockFile.id}`,
    );
    expect(senderInfo).toBeVisible();
    expect(senderInfo).toHaveTextContent("Alice");
  });

  it("should call onPreview callback", async () => {
    const onPreview = vi.fn();
    const user = userEvent.setup();
    render(<FileListItem file={mockFile} onPreview={onPreview} position={0} />);

    const previewButton = screen.getByTestId(
      `chat-file-list-item-preview-button-${mockFile.id}`,
    );
    await user.click(previewButton);

    expect(onPreview).toHaveBeenCalledWith(mockFile, 0);
  });
});

describe("FileGrid", () => {
  const mockFiles = [mockFile, mockImageFile];

  it("should render grid container", () => {
    render(<FileGrid files={mockFiles} />);
    expect(screen.getByTestId("chat-file-grid-container")).toBeInTheDocument();
  });

  it("should render file cards for each file", () => {
    render(<FileGrid files={mockFiles} />);
    expect(
      screen.getByTestId(`chat-file-card-${mockFile.id}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`chat-file-card-${mockImageFile.id}`),
    ).toBeInTheDocument();
  });

  it("should show empty state when no files", () => {
    render(<FileGrid files={[]} />);
    expect(screen.getByTestId("chat-file-grid-empty")).toBeInTheDocument();
    expect(screen.getByText("Không có file nào")).toBeInTheDocument();
  });

  it("should pass onPreviewFile to cards", async () => {
    const onPreview = vi.fn();
    const user = userEvent.setup();
    render(<FileGrid files={mockFiles} onPreviewFile={onPreview} />);

    const viewButton = screen.getByTestId(
      `chat-file-card-view-button-${mockFile.id}`,
    );
    await user.click(viewButton);

    expect(onPreview).toHaveBeenCalled();
  });
});

describe("FileList", () => {
  const mockFiles = [mockFile, mockImageFile];

  it("should render list container", () => {
    render(<FileList files={mockFiles} />);
    expect(screen.getByTestId("chat-file-list-container")).toBeInTheDocument();
  });

  it("should render list items for each file", () => {
    render(<FileList files={mockFiles} />);
    expect(
      screen.getByTestId(`chat-file-list-item-${mockFile.id}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`chat-file-list-item-${mockImageFile.id}`),
    ).toBeInTheDocument();
  });

  it("should show empty state when no files", () => {
    render(<FileList files={[]} />);
    expect(screen.getByTestId("chat-file-list-empty")).toBeInTheDocument();
    expect(screen.getByText("Không có file nào")).toBeInTheDocument();
  });

  it("should pass onPreviewFile to items", async () => {
    const onPreview = vi.fn();
    const user = userEvent.setup();
    render(<FileList files={mockFiles} onPreviewFile={onPreview} />);

    const previewButton = screen.getByTestId(
      `chat-file-list-item-preview-button-${mockFile.id}`,
    );
    await user.click(previewButton);

    expect(onPreview).toHaveBeenCalled();
  });

  it("should maintain order of files", () => {
    const { container } = render(<FileList files={mockFiles} />);
    const items = container.querySelectorAll(
      '[data-testid="chat-file-list-container"] > *',
    );

    expect(items[0]).toHaveAttribute(
      "data-testid",
      `chat-file-list-item-${mockFile.id}`,
    );
    expect(items[1]).toHaveAttribute(
      "data-testid",
      `chat-file-list-item-${mockImageFile.id}`,
    );
  });
});
