import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CountrySelector } from "./CountrySelector";
import * as api from "../api/client";
import { vi } from "vitest";

describe("CountrySelector", () => {
  it("renders countries fetched from the API as buttons", async () => {
    vi.spyOn(api, "fetchCountries").mockResolvedValue(["Argentina", "Canada"]);

    render(<CountrySelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Argentina/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Canada/i }),
      ).toBeInTheDocument();
    });
  });

  it("calls onChange when the user clicks a country button", async () => {
    vi.spyOn(api, "fetchCountries").mockResolvedValue(["Argentina"]);
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<CountrySelector value="" onChange={onChange} />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });

    await user.click(argentinaButton);
    expect(onChange).toHaveBeenCalledWith("Argentina");
  });

  it("highlights the selected country button", async () => {
    vi.spyOn(api, "fetchCountries").mockResolvedValue(["Argentina", "Brazil"]);

    render(<CountrySelector value="Argentina" onChange={() => {}} />);

    await waitFor(() => {
      const argentinaButton = screen.getByRole("button", {
        name: /Argentina/i,
      });
      expect(argentinaButton).toHaveClass("country-button--selected");
      expect(argentinaButton).toHaveAttribute("aria-pressed", "true");
    });
  });
});
