import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  parseSystemMessageContent,
  renderSystemMessageWithHighlights,
} from "./systemMessageParser";

describe("parseSystemMessageContent — pin patterns", () => {
  it("parses a pinned text message", () => {
    expect(
      parseSystemMessageContent("Nguyễn Văn A đã ghim tin nhắn Xin chào"),
    ).toEqual([
      { type: "pin-actor", content: "Nguyễn Văn A" },
      { type: "text", content: " đã ghim tin nhắn " },
      { type: "content-name", content: "Xin chào" },
    ]);
  });

  it("parses an unpinned text message", () => {
    expect(
      parseSystemMessageContent("Nguyễn Văn A đã bỏ ghim tin nhắn Xin chào"),
    ).toEqual([
      { type: "pin-actor", content: "Nguyễn Văn A" },
      { type: "text", content: " đã bỏ ghim tin nhắn " },
      { type: "content-name", content: "Xin chào" },
    ]);
  });

  it("parses single-attachment pins by type", () => {
    expect(
      parseSystemMessageContent("Nguyễn Văn A đã ghim một hình ảnh"),
    ).toEqual([
      { type: "pin-actor", content: "Nguyễn Văn A" },
      { type: "text", content: " đã ghim một hình ảnh" },
    ]);
  });

  it("parses multiple-attachment pins", () => {
    expect(
      parseSystemMessageContent("Nguyễn Văn A đã bỏ ghim nhiều tệp đính kèm"),
    ).toEqual([
      { type: "pin-actor", content: "Nguyễn Văn A" },
      { type: "text", content: " đã bỏ ghim nhiều tệp đính kèm" },
    ]);
  });

  it("parses a reorder message", () => {
    expect(
      parseSystemMessageContent("Nguyễn Văn A đã chỉnh sửa danh sách ghim"),
    ).toEqual([
      { type: "pin-actor", content: "Nguyễn Văn A" },
      { type: "text", content: " đã chỉnh sửa danh sách ghim" },
    ]);
  });
});

describe("renderSystemMessageWithHighlights — pin actor self swap", () => {
  const content = "Nguyễn Văn A đã ghim tin nhắn Xin chào";

  it("shows the full name when the viewer isn't the actor", () => {
    const html = renderToStaticMarkup(
      renderSystemMessageWithHighlights(content, { pinActorSelf: false }),
    );
    expect(html).toContain("Nguyễn Văn A");
    expect(html).not.toContain("Bạn");
  });

  it("shows 'Bạn' when the viewer is the actor", () => {
    const html = renderToStaticMarkup(
      renderSystemMessageWithHighlights(content, { pinActorSelf: true }),
    );
    expect(html).toContain("Bạn");
    expect(html).not.toContain("Nguyễn Văn A");
  });
});
