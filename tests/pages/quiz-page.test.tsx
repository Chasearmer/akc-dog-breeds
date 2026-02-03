import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizPage from "@/app/quiz/page";
import { breedGroups } from "@/lib/breeds";
import { vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

let randomSpy: ReturnType<typeof vi.spyOn>;

describe("Quiz page", () => {
  beforeEach(() => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue({
      json: async () => ({ status: "success", message: [
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
      ] }),
    } as Response);
    randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    randomSpy.mockRestore();
    localStorage.clear();
  });

  it("allows submitting a correct breed and updates score", async () => {
    render(<QuizPage />);

    await screen.findByText("Submit");
    const breed = breedGroups[0].breeds[0];

    const input = screen.getByPlaceholderText("Select breed...");
    const user = userEvent.setup();
    await user.type(input, breed.name);
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Next Dog →")).toBeInTheDocument();
    });

    expect(screen.getByText(`✓ ${breedGroups[0].name}`)).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
  });
});
