import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MessageDateSeparator from "./MessageDateSeparator";

describe("MessageDateSeparator", () => {
  it("renders today label", () => {
    render(<MessageDateSeparator date="Hôm nay" />);
    expect(screen.getByTestId("message-date-separator")).toBeInTheDocument();
    expect(screen.getByText("Hôm nay")).toBeInTheDocument();
  });

  it("renders yesterday label", () => {
    render(<MessageDateSeparator date="Hôm qua" />);
    expect(screen.getByText("Hôm qua")).toBeInTheDocument();
  });

  it("renders weekday + date label", () => {
    render(<MessageDateSeparator date="Thứ năm, 30/01/2026" />);
    expect(screen.getByText("Thứ năm, 30/01/2026")).toBeInTheDocument();
  });

  it("renders date only label", () => {
    render(<MessageDateSeparator date="25/01/2026" />);
    expect(screen.getByText("25/01/2026")).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    const { container } = render(<MessageDateSeparator date="Hôm nay" />);
    const wrapper = container.querySelector(
      '[data-testid="message-date-separator"]',
    );
    const pill = wrapper?.querySelector("div");

    expect(wrapper).toHaveClass("flex", "justify-center", "my-4");
    expect(pill).toHaveClass(
      "bg-gray-100",
      "text-gray-500",
      "text-xs",
      "px-3",
      "py-1",
      "rounded-full",
    );
  });
});
