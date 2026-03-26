import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import MessageVideo from "../MessageVideo";
import { getVideoThumbnail } from "@/api/files.api";

vi.mock("@/api/files.api", () => ({
  getVideoThumbnail: vi.fn(),
}));

global.URL.createObjectURL = vi.fn(() => "blob:video-thumb-url");
global.URL.revokeObjectURL = vi.fn();

describe("MessageVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should request video thumbnail and render it", async () => {
    const mockBlob = new Blob(["thumb"], { type: "image/jpeg" });
    vi.mocked(getVideoThumbnail).mockResolvedValueOnce(mockBlob);

    const { getByTestId } = render(
      <MessageVideo fileId="video-123" fileName="demo.mp4" fileSize={1024} />,
    );

    await waitFor(() => {
      expect(getVideoThumbnail).toHaveBeenCalledWith("video-123", 640);
    });

    await waitFor(() => {
      const thumbnail = getByTestId("message-video-thumbnail-video-123");
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute("src", "blob:video-thumb-url");
    });
  });

  it("should keep fallback UI when thumbnail request fails", async () => {
    vi.mocked(getVideoThumbnail).mockRejectedValueOnce(new Error("network"));

    const { getByTestId, queryByTestId } = render(
      <MessageVideo fileId="video-123" fileName="demo.mp4" />,
    );

    await waitFor(() => {
      expect(getVideoThumbnail).toHaveBeenCalledWith("video-123", 640);
    });

    expect(
      getByTestId("message-video-container-video-123"),
    ).toBeInTheDocument();
    expect(
      queryByTestId("message-video-thumbnail-video-123"),
    ).not.toBeInTheDocument();
  });
});
