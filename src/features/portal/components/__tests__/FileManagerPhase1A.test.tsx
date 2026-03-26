import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileManagerPhase1A } from "../FileManagerPhase1A";

vi.mock("@/components/FilePreviewModal", () => ({
  default: ({
    isOpen,
    fileId,
    fileName,
  }: {
    isOpen: boolean;
    fileId: string;
    fileName?: string;
  }) =>
    isOpen ? (
      <div data-testid="mock-file-preview-modal">
        {fileId}:{fileName}
      </div>
    ) : null,
}));

vi.mock("@/components/ImagePreviewModal", () => ({
  default: () => <div data-testid="mock-image-preview-modal" />,
}));

describe("FileManagerPhase1A", () => {
  it("opens shared file preview modal when clicking a video item", async () => {
    const user = userEvent.setup();

    render(
      <FileManagerPhase1A
        mode="media"
        groupId="group-1"
        selectedWorkTypeId="worktype-1"
        conversationAttachment={{
          items: [
            {
              id: "attachment-1",
              fileId: "video-file-123",
              fileName: "demo.mp4",
              contentType: "video/mp4",
              createdAt: "2026-03-25T10:00:00.000Z",
              parentMessageId: null,
            },
          ],
        }}
      />,
    );

    await user.click(screen.getByTestId("media-grid-item-attachment-1"));

    expect(screen.getByTestId("mock-file-preview-modal")).toHaveTextContent(
      "video-file-123:demo.mp4",
    );
  });
});
