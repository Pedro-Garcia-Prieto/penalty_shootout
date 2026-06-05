import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  // ============================================================
  // Default behaviour
  // ============================================================

  it("renders with the default label when no prop is passed", () => {
    render(<LoadingSpinner />);
    expect(
      screen.getByText(/generating your shootout story/i),
    ).toBeInTheDocument();
  });

  it("exposes a status role for assistive technologies", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it('uses aria-live="polite" so screen readers announce the change', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  // ============================================================
  // Custom label
  // ============================================================

  it("renders the custom label when provided", () => {
    render(<LoadingSpinner label="Calling the local AI model…" />);
    expect(screen.getByText("Calling the local AI model…")).toBeInTheDocument();
  });

  it("does NOT render the default label when a custom label is provided", () => {
    render(<LoadingSpinner label="Custom message" />);
    expect(
      screen.queryByText(/generating your shootout story/i),
    ).not.toBeInTheDocument();
  });

  it("renders an empty string label without crashing", () => {
    const { container } = render(<LoadingSpinner label="" />);
    // Component still mounts; the <p> tag exists but is empty.
    expect(container.querySelector(".spinner")).toBeInTheDocument();
    expect(container.querySelector(".spinner p")).toBeInTheDocument();
  });

  // ============================================================
  // Structure & styling
  // ============================================================

  it('applies the "spinner" CSS class to the wrapper', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector(".spinner")).toBeInTheDocument();
  });

  it("renders the animated circle element", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector(".spinner__circle")).toBeInTheDocument();
  });

  it("renders the label inside a paragraph element", () => {
    render(<LoadingSpinner label="Loading data" />);
    const paragraph = screen.getByText("Loading data");
    expect(paragraph.tagName).toBe("P");
  });

  // ============================================================
  // Snapshot (optional safety net for visual regressions)
  // ============================================================

  it("matches the structural snapshot", () => {
    const { container } = render(<LoadingSpinner label="Working…" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
