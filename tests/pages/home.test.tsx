import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { breedGroups } from "@/lib/breeds";
import { vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("Home page", () => {
  it("renders header and group cards", () => {
    render(<Home />);
    expect(screen.getByText("AKC Dog Breeds")).toBeInTheDocument();
    expect(screen.getByText("Explore 200+ Dog Breeds")).toBeInTheDocument();

    const groupLinks = screen.getAllByRole("link");
    const groupCardLinks = groupLinks.filter(link => link.classList.contains("group-card"));
    expect(groupCardLinks.length).toBe(breedGroups.length);
  });
});
