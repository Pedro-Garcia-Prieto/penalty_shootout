import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ErrorBanner } from "./ErrorBanner";

describe("ErrorBanner", () => {
  // ============================================================
  // Message rendering
  // ============================================================

  it("renders the provided error message", () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("prefixes the message with the warning emoji", () => {
    render(<ErrorBanner message="Connection refused" />);
    expect(screen.getByText(/⚠️\s*Connection refused/)).toBeInTheDocument();
  });

  it("renders different messages independently", () => {
    const { rerender } = render(<ErrorBanner message="First error" />);
    expect(screen.getByText(/first error/i)).toBeInTheDocument();

    rerender(<ErrorBanner message="Second error" />);
    expect(screen.getByText(/second error/i)).toBeInTheDocument();
    expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
  });

  it("handles an empty message without crashing", () => {
    const { container } = render(<ErrorBanner message="" />);
    expect(container.querySelector(".error-banner")).toBeInTheDocument();
  });

  // ============================================================
  // Accessibility
  // ============================================================

  it("exposes the alert role for assistive technologies", () => {
    render(<ErrorBanner message="Network error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("places the message inside the alert region", () => {
    render(<ErrorBanner message="Server unavailable" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/server unavailable/i);
  });

  // ============================================================
  // Retry button behaviour
  // ============================================================

  it("does NOT render the retry button when onRetry is omitted", () => {
    render(<ErrorBanner message="Read-only error" />);
    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the retry button when onRetry is provided", () => {
    render(<ErrorBanner message="Recoverable error" onRetry={() => {}} />);
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("calls onRetry exactly once when the button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorBanner message="Retry me" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry once per click across multiple clicks", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorBanner message="Retry me" onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: /try again/i });

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(onRetry).toHaveBeenCalledTimes(3);
  });

  it("does not throw if onRetry is undefined and there is no button", () => {
    expect(() =>
      render(<ErrorBanner message="No retry available" />),
    ).not.toThrow();
  });

  // ============================================================
  // Structure & styling
  // ============================================================

  it('applies the "error-banner" CSS class to the wrapper', () => {
    const { container } = render(<ErrorBanner message="Style check" />);
    expect(container.querySelector(".error-banner")).toBeInTheDocument();
  });

  it("renders the message inside a paragraph element", () => {
    render(<ErrorBanner message="Paragraph test" />);
    const paragraph = screen.getByText(/paragraph test/i);
    expect(paragraph.tagName).toBe("P");
  });
});
