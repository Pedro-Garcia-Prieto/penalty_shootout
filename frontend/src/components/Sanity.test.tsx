import { render, screen } from "@testing-library/react";

describe("Vitest setup", () => {
  it("runs and renders a basic element", () => {
    render(<h1>Hello, Vitest!</h1>);
    expect(screen.getByRole("heading")).toHaveTextContent("Hello, Vitest!");
  });
});
