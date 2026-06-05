import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CountrySelector } from "./CountrySelector";
import * as api from "../api/client";
import { vi } from "vitest";

describe("CountrySelector", () => {
  it("renders countries fetched from the API", async () => {
    vi.spyOn(api, "fetchCountries").mockResolvedValue(["Argentina", "Canada"]);

    render(<CountrySelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Argentina" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Canada" }),
      ).toBeInTheDocument();
    });
  });

  it("calls onChange when the user picks a country", async () => {
    vi.spyOn(api, "fetchCountries").mockResolvedValue(["Argentina"]);
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<CountrySelector value="" onChange={onChange} />);
    await screen.findByRole("option", { name: "Argentina" });

    await user.selectOptions(screen.getByRole("combobox"), "Argentina");
    expect(onChange).toHaveBeenCalledWith("Argentina");
  });
});
