import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupPage from "@/app/group/[slug]/page";
import { breedGroups } from "@/lib/breeds";
import { vi } from "vitest";

let mockSlug = "herding";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: mockSlug }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("Group page", () => {
  beforeEach(() => {
    mockSlug = "herding";
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue({
      json: async () => ({ status: "success", message: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" }),
    } as Response);
  });

  it("renders group details", () => {
    render(<GroupPage />);
    expect(screen.getByText(breedGroups[0].name)).toBeInTheDocument();
    expect(screen.getByText(breedGroups[0].description)).toBeInTheDocument();
  });

  it("opens the swipe overlay when a breed card is clicked", async () => {
    const { container } = render(<GroupPage />);
    const cards = container.querySelectorAll(".breed-card");
    expect(cards.length).toBeGreaterThan(0);

    const user = userEvent.setup();
    await user.click(cards[0]);
    expect(await screen.findByText("View details →")).toBeInTheDocument();
  });

  it("shows not found for invalid group", () => {
    mockSlug = "unknown-group";
    render(<GroupPage />);
    expect(screen.getByText("Group not found")).toBeInTheDocument();
  });
});
