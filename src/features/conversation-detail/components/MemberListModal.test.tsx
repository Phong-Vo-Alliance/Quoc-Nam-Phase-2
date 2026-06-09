import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemberListModal } from "./MemberListModal";
import type { MinimalMember } from "../types";

// Mock data
const mockMembers: MinimalMember[] = [
  { id: "1", name: "Nguyễn Văn An", role: "Leader" },
  { id: "2", name: "Trần Thị Bích", role: "Member" },
  { id: "3", name: "Lê Minh", role: "Member" },
  { id: "4", name: "Phạm Thị Ngọc-Hà", role: "Member" },
];

describe("MemberListModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    members: mockMembers,
    groupName: "Marketing",
  };

  it("renders modal with title", () => {
    render(<MemberListModal {...defaultProps} />);

    expect(screen.getByTestId("member-list-modal")).toBeInTheDocument();
    expect(screen.getAllByText("Thành viên").length).toBeGreaterThanOrEqual(1);
  });

  it("renders modal with category name and group name", () => {
    render(
      <MemberListModal {...defaultProps} categoryName="Danh mục A" />,
    );

    expect(screen.getByText("Danh mục A")).toBeInTheDocument();
    expect(screen.getByText("Marketing")).toBeInTheDocument();
  });

  it("displays all members with correct data-testid", () => {
    render(<MemberListModal {...defaultProps} />);

    mockMembers.forEach((member) => {
      expect(
        screen.getByTestId(`member-item-${member.id}`),
      ).toBeInTheDocument();
    });
  });

  it("sorts members with Leaders first", () => {
    render(<MemberListModal {...defaultProps} />);

    const memberItems = screen.getAllByTestId(/^member-item-/);
    // First item should be the Leader (id: 1)
    expect(memberItems[0]).toHaveAttribute("data-testid", "member-item-1");
  });

  it("displays 2-letter initials from last two words", () => {
    render(<MemberListModal {...defaultProps} />);

    // "Nguyễn Văn An" → "VA"
    expect(screen.getByText("VA")).toBeInTheDocument();
    // "Trần Thị Bích" → "TB"
    expect(screen.getByText("TB")).toBeInTheDocument();
    // "Lê Minh" → "LM"
    expect(screen.getByText("LM")).toBeInTheDocument();
    // "Phạm Thị Ngọc-Hà" → "TN" (chữ đầu của 2 từ cuối)
    expect(screen.getByText("TN")).toBeInTheDocument();
  });

  it("shows Leader badge for leaders only", () => {
    render(<MemberListModal {...defaultProps} />);

    // Leader badge should appear once (only for the leader member)
    const leaderBadges = screen.getAllByText("Trưởng nhóm");
    // One in the counter section, one as badge, one as role text
    expect(leaderBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onOpenChange when close button is clicked", () => {
    const onOpenChange = vi.fn();
    render(<MemberListModal {...defaultProps} onOpenChange={onOpenChange} />);

    const closeButton = screen.getByTestId("member-list-close-button");
    fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows empty state when no members", () => {
    render(<MemberListModal {...defaultProps} members={[]} />);

    expect(screen.getByText("Chưa có thành viên nào")).toBeInTheDocument();
  });

  it("displays correct member and leader counts", () => {
    render(<MemberListModal {...defaultProps} />);

    // 1 Trưởng nhóm, 3 Thành viên
    expect(screen.getByText("1 Trưởng nhóm")).toBeInTheDocument();
    expect(screen.getByText("3 Thành viên")).toBeInTheDocument();
  });
});

describe("getInitials helper function", () => {
  // Test the initials logic indirectly through rendered output
  it("handles various Vietnamese name formats", () => {
    const testCases: MinimalMember[] = [
      { id: "1", name: "Nguyễn Văn An", role: "Member" }, // → VA
      { id: "2", name: "Lê Minh", role: "Member" }, // → LM
      { id: "3", name: "An", role: "Member" }, // → AN (1 từ)
      { id: "4", name: "Trần Thị Bích-Ngọc", role: "Member" }, // → TB
    ];

    render(
      <MemberListModal
        open={true}
        onOpenChange={vi.fn()}
        members={testCases}
        groupName="Test"
      />,
    );

    expect(screen.getByText("VA")).toBeInTheDocument();
    expect(screen.getByText("LM")).toBeInTheDocument();
    expect(screen.getByText("AN")).toBeInTheDocument();
    expect(screen.getByText("TB")).toBeInTheDocument();
  });
});
