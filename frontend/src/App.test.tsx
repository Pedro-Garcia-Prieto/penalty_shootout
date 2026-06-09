import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import * as api from "./api/client";
import type { StoryResponse } from "./types";

// ============================================================
// Mock the entire API client module
// ============================================================
vi.mock("./api/client");

const mockedFetchCountries = vi.mocked(api.fetchCountries);
const mockedFetchStory = vi.mocked(api.fetchStory);

// ============================================================
// Test fixtures
// ============================================================

const COUNTRIES = ["Argentina", "Canada", "France", "Spain"];

const historicalResponse: StoryResponse = {
  country: "Argentina",
  has_history: true,
  match: {
    home_team: "Argentina",
    away_team: "France",
    date: "2022-12-18",
    year: "2022",
    venue: "Lusail Stadium",
    round: "Final",
    score: "3-3",
    penalty_score: "4-2",
    kicks: [
      {
        team: "France",
        kick_number: 1,
        running_score: "1-0",
        player: "Mbappé",
        scored: true,
      },
      {
        team: "Argentina",
        kick_number: 2,
        running_score: "1-1",
        player: "Messi",
        scored: true,
      },
    ],
  },
  story: "In the cauldron of Lusail, eleven men stepped up from twelve yards.",
};

const speculativeResponse: StoryResponse = {
  country: "Canada",
  has_history: false,
  match: null,
  story: "Canada has never tasted the dreaded lottery at a World Cup.",
};

// ============================================================
// Setup
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockedFetchCountries.mockResolvedValue(COUNTRIES);
});

// ============================================================
// Initial render
// ============================================================

describe("App — initial render", () => {
  it("renders the application title", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: /world cup penalty shootout storyteller/i,
      }),
    ).toBeInTheDocument();
  });

  it("fetches the country list on mount", async () => {
    render(<App />);
    await waitFor(() => {
      expect(mockedFetchCountries).toHaveBeenCalledTimes(1);
    });
  });

  it("populates the country buttons with the API response", async () => {
    render(<App />);
    for (const country of COUNTRIES) {
      expect(
        await screen.findByRole("button", { name: new RegExp(country, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("disables the generate button until a country is selected", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /generate story/i }),
    ).toBeDisabled();
  });
});

// ============================================================
// Country selection
// ============================================================

describe("App — country selection", () => {
  it("enables the generate button after selecting a country", async () => {
    const user = userEvent.setup();
    render(<App />);

    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);

    expect(
      screen.getByRole("button", { name: /generate story/i }),
    ).toBeEnabled();
  });

  it("disables the button again if the user clicks the same country twice", async () => {
    const user = userEvent.setup();
    render(<App />);

    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });

    // First click selects Argentina
    await user.click(argentinaButton);
    expect(
      screen.getByRole("button", { name: /generate story/i }),
    ).toBeEnabled();

    // Second click on same country deselects it
    await user.click(argentinaButton);
    expect(
      screen.getByRole("button", { name: /generate story/i }),
    ).toBeDisabled();
  });
});

// ============================================================
// Branch A — country with shootout history
// ============================================================

describe("App — historical story flow", () => {
  it("shows the spinner while the story is being generated", async () => {
    const user = userEvent.setup();
    // Promise that we control manually to keep the loading state visible.
    let resolveStory: (value: StoryResponse) => void = () => {};
    mockedFetchStory.mockReturnValue(
      new Promise((resolve) => {
        resolveStory = resolve;
      }),
    );

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    expect(screen.getByRole("status")).toBeInTheDocument();

    // Resolve and let the component update.
    resolveStory(historicalResponse);
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });

  it("renders the StoryCard with historical data after a successful call", async () => {
    const user = userEvent.setup();
    mockedFetchStory.mockResolvedValue(historicalResponse);

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    expect(await screen.findByText(/historical shootout/i)).toBeInTheDocument();
    expect(screen.getByText(/cauldron of Lusail/i)).toBeInTheDocument();
    expect(screen.getByText(/World Cup 2022/)).toBeInTheDocument();
  });

  it("passes the selected country to fetchStory", async () => {
    const user = userEvent.setup();
    mockedFetchStory.mockResolvedValue(historicalResponse);

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    await waitFor(() => {
      expect(mockedFetchStory).toHaveBeenCalledWith("Argentina");
    });
  });
});

// ============================================================
// Branch B — country without shootout history
// ============================================================

describe("App — speculative story flow", () => {
  it("renders the StoryCard with the speculative badge for a country without history", async () => {
    const user = userEvent.setup();
    mockedFetchStory.mockResolvedValue(speculativeResponse);

    render(<App />);
    const canadaButton = await screen.findByRole("button", { name: /Canada/i });
    await user.click(canadaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    expect(await screen.findByText(/speculative tale/i)).toBeInTheDocument();
    expect(
      screen.getByText(/never tasted the dreaded lottery/i),
    ).toBeInTheDocument();
  });

  it("does not render match metadata when there is no historical match", async () => {
    const user = userEvent.setup();
    mockedFetchStory.mockResolvedValue(speculativeResponse);

    render(<App />);
    const canadaButton = await screen.findByRole("button", { name: /Canada/i });
    await user.click(canadaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    await screen.findByText(/speculative tale/i);
    expect(screen.queryByText(/kick-by-kick/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Score after extra time/),
    ).not.toBeInTheDocument();
  });
});

// ============================================================
// Error handling
// ============================================================

describe("App — error handling", () => {
  it("shows the ErrorBanner when fetchStory fails", async () => {
    const user = userEvent.setup();
    mockedFetchStory.mockRejectedValue({
      detail: "Ollama is unreachable",
      status: 503,
    });

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    expect(
      await screen.findByText(/ollama is unreachable/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it('retries the request when the user clicks "Try again"', async () => {
    const user = userEvent.setup();
    mockedFetchStory
      .mockRejectedValueOnce({ detail: "Temporary failure", status: 503 })
      .mockResolvedValueOnce(historicalResponse);

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    // First attempt failed → error banner with retry button.
    await screen.findByText(/temporary failure/i);
    await user.click(screen.getByRole("button", { name: /try again/i }));

    // Second attempt succeeded → story card visible, error gone.
    expect(await screen.findByText(/historical shootout/i)).toBeInTheDocument();
    expect(screen.queryByText(/temporary failure/i)).not.toBeInTheDocument();
    expect(mockedFetchStory).toHaveBeenCalledTimes(2);
  });

  it("clears the previous story when starting a new request", async () => {
    const user = userEvent.setup();
    mockedFetchStory
      .mockResolvedValueOnce(historicalResponse)
      .mockResolvedValueOnce(speculativeResponse);

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    const canadaButton = await screen.findByRole("button", {
      name: /Canada/i,
    });
    const button = screen.getByRole("button", { name: /generate story/i });

    // First story.
    await user.click(argentinaButton);
    await user.click(button);
    await screen.findByText(/historical shootout/i);

    // Switch country and generate again.
    await user.click(canadaButton);
    await user.click(button);

    await screen.findByText(/speculative tale/i);
    expect(screen.queryByText(/historical shootout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cauldron of Lusail/i)).not.toBeInTheDocument();
  });

  it("hides the previous error when a new request starts", async () => {
    const user = userEvent.setup();
    mockedFetchStory
      .mockRejectedValueOnce({ detail: "First failure", status: 503 })
      .mockResolvedValueOnce(historicalResponse);

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    // Error appears.
    await screen.findByText(/first failure/i);

    // Trigger a new request via the retry button.
    await user.click(screen.getByRole("button", { name: /try again/i }));

    // Error must disappear before the success arrives.
    await waitFor(() =>
      expect(screen.queryByText(/first failure/i)).not.toBeInTheDocument(),
    );
    expect(await screen.findByText(/historical shootout/i)).toBeInTheDocument();
  });

  it("falls back to a generic message when the error has no detail", async () => {
    const user = userEvent.setup();
    mockedFetchStory.mockRejectedValue({ status: 0 });

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();
  });
});

// ============================================================
// Disabled states during loading
// ============================================================

describe("App — UI state during loading", () => {
  it("disables the country buttons and generate button while a request is in flight", async () => {
    const user = userEvent.setup();
    let resolveStory: (value: StoryResponse) => void = () => {};
    mockedFetchStory.mockReturnValue(
      new Promise((resolve) => {
        resolveStory = resolve;
      }),
    );

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    // All country buttons should be disabled
    expect(argentinaButton).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /generate story/i }),
    ).toBeDisabled();

    // Cleanup: resolve so the test doesn't leak the pending promise.
    resolveStory(historicalResponse);
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });

  it("re-enables controls after the request completes", async () => {
    const user = userEvent.setup();
    mockedFetchStory.mockResolvedValue(historicalResponse);

    render(<App />);
    const argentinaButton = await screen.findByRole("button", {
      name: /Argentina/i,
    });
    await user.click(argentinaButton);
    await user.click(screen.getByRole("button", { name: /generate story/i }));

    await screen.findByText(/historical shootout/i);
    expect(argentinaButton).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /generate story/i }),
    ).toBeEnabled();
  });
});
