import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import BreedPage from "@/app/breed/[slug]/page";
import { vi } from "vitest";

let mockSlug = "australian-cattle-dog";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: mockSlug }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("Breed page", () => {
  beforeEach(() => {
    mockSlug = "australian-cattle-dog";
  });

  it("renders a gallery when images load", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue({
      json: async () => ({ status: "success", message: [
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
      ] }),
    } as Response);

    render(<BreedPage />);
    expect(screen.getByText("Loading photos...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByAltText("Australian Cattle Dog")).toBeInTheDocument();
    });
    expect(screen.getByText(/of 2/)).toBeInTheDocument();
  });

  it("shows not found for invalid breed", () => {
    mockSlug = "not-a-breed";
    render(<BreedPage />);
    expect(screen.getByText("Breed not found")).toBeInTheDocument();
  });
});
