import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

vi.stubGlobal("fetch", vi.fn());

afterEach(() => {
  vi.clearAllMocks();
});
