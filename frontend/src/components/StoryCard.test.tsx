import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { StoryCard } from "./StoryCard";
import type { StoryResponse } from "../types";

// ============================================================
// Test fixtures
// ============================================================

const historicalStory: StoryResponse = {
  country: "Argentina",
  has_history: true,
  match: {
    home_team: "Argentina",
    away_team: "France",
    date: "2022-12-18",
    year: 2022,
    stage: "Final",
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
      {
        team: "France",
        kick_number: 3,
        running_score: "1-1",
        player: "Coman",
        scored: false,
      },
    ],
  },
  story:
    "In the cauldron of Lusail, with the trophy gleaming under the floodlights, " +
    "eleven men stepped up from twelve yards.\n" +
    "Nerves of steel were required.",
};

const speculativeStory: StoryResponse = {
  country: "Canada",
  has_history: false,
  match: null,
  story:
    "Canada has never tasted the dreaded lottery at a World Cup.\n" +
    "But if they did, expect ice in the veins from the maple-leaf brigade.",
};

const historicalStoryWithoutKicks: StoryResponse = {
  country: "Spain",
  has_history: true,
  match: {
    home_team: "Spain",
    away_team: "Italy",
    date: null,
    year: null,
    stage: null,
    score: null,
    penalty_score: null,
    kicks: [],
  },
  story: "A historical shootout where the kick-by-kick data is incomplete.",
};

// ============================================================
// Branch A — Historical story
// ============================================================

describe("StoryCard — historical story", () => {
  it("renders the country name as a heading", () => {
    render(<StoryCard data={historicalStory} />);
    expect(
      screen.getByRole("heading", { name: "Argentina" }),
    ).toBeInTheDocument();
  });

  it("shows the historical badge", () => {
    render(<StoryCard data={historicalStory} />);
    expect(screen.getByText(/historical shootout/i)).toBeInTheDocument();
  });

  it("does NOT show the speculative badge", () => {
    render(<StoryCard data={historicalStory} />);
    expect(screen.queryByText(/speculative tale/i)).not.toBeInTheDocument();
  });

  it('applies the "historical" CSS class', () => {
    const { container } = render(<StoryCard data={historicalStory} />);
    const article = container.querySelector("article");
    expect(article).toHaveClass("story-card", "historical");
    expect(article).not.toHaveClass("speculative");
  });

  it("renders both team names", () => {
    render(<StoryCard data={historicalStory} />);
    expect(
      screen.getByText("Argentina", { selector: "strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("France", { selector: "strong" }),
    ).toBeInTheDocument();
  });

  it("shows the World Cup year and stage", () => {
    render(<StoryCard data={historicalStory} />);
    expect(screen.getByText(/World Cup 2022/)).toBeInTheDocument();
    expect(screen.getByText(/Final/)).toBeInTheDocument();
  });

  it("shows the score after extra time", () => {
    render(<StoryCard data={historicalStory} />);
    expect(
      screen.getByText(/Score after extra time:\s*3-3/),
    ).toBeInTheDocument();
  });

  it("shows the penalty shootout score", () => {
    render(<StoryCard data={historicalStory} />);
    expect(screen.getByText(/Penalty shootout:\s*4-2/)).toBeInTheDocument();
  });

  it("renders a collapsible kick-by-kick section", () => {
    render(<StoryCard data={historicalStory} />);
    expect(
      screen.getByRole("group", { name: /kick-by-kick/i }),
    ).toBeInTheDocument();
  });

  it("lists every kick when the user opens the details", async () => {
    const user = userEvent.setup();
    render(<StoryCard data={historicalStory} />);

    await user.click(screen.getByText(/kick-by-kick/i));

    expect(screen.getByText(/Mbappé/)).toBeInTheDocument();
    expect(screen.getByText(/Messi/)).toBeInTheDocument();
    expect(screen.getByText(/Coman/)).toBeInTheDocument();
  });

  it("marks scored kicks as GOAL and missed kicks as MISS", () => {
    render(<StoryCard data={historicalStory} />);
    // Two scored, one missed in the fixture.
    expect(screen.getAllByText(/GOAL/)).toHaveLength(2);
    expect(screen.getAllByText(/MISS/)).toHaveLength(1);
  });

  it("renders the story body split into paragraphs", () => {
    const { container } = render(<StoryCard data={historicalStory} />);
    const paragraphs = container.querySelectorAll(".story-body p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent(/cauldron of Lusail/);
    expect(paragraphs[1]).toHaveTextContent(/Nerves of steel/);
  });
});

// ============================================================
// Branch B — Speculative story
// ============================================================

describe("StoryCard — speculative story", () => {
  it("renders the country name as a heading", () => {
    render(<StoryCard data={speculativeStory} />);
    expect(screen.getByRole("heading", { name: "Canada" })).toBeInTheDocument();
  });

  it("shows the speculative badge", () => {
    render(<StoryCard data={speculativeStory} />);
    expect(screen.getByText(/speculative tale/i)).toBeInTheDocument();
  });

  it("does NOT show the historical badge", () => {
    render(<StoryCard data={speculativeStory} />);
    expect(screen.queryByText(/historical shootout/i)).not.toBeInTheDocument();
  });

  it('applies the "speculative" CSS class', () => {
    const { container } = render(<StoryCard data={speculativeStory} />);
    const article = container.querySelector("article");
    expect(article).toHaveClass("story-card", "speculative");
    expect(article).not.toHaveClass("historical");
  });

  it("does NOT render the match metadata block", () => {
    const { container } = render(<StoryCard data={speculativeStory} />);
    expect(container.querySelector(".match-meta")).not.toBeInTheDocument();
  });

  it("does NOT render the kick-by-kick section", () => {
    render(<StoryCard data={speculativeStory} />);
    expect(screen.queryByText(/kick-by-kick/i)).not.toBeInTheDocument();
  });

  it("renders the speculative story body", () => {
    render(<StoryCard data={speculativeStory} />);
    expect(
      screen.getByText(/never tasted the dreaded lottery/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/ice in the veins/i)).toBeInTheDocument();
  });
});

// ============================================================
// Edge cases
// ============================================================

describe("StoryCard — edge cases", () => {
  it("renders even when the historical match has no kicks", () => {
    render(<StoryCard data={historicalStoryWithoutKicks} />);
    expect(screen.getByRole("heading", { name: "Spain" })).toBeInTheDocument();
    // No kick-by-kick section when kicks list is empty.
    expect(screen.queryByText(/kick-by-kick/i)).not.toBeInTheDocument();
  });

  it("omits optional metadata lines when fields are null", () => {
    render(<StoryCard data={historicalStoryWithoutKicks} />);
    expect(
      screen.queryByText(/Score after extra time/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Penalty shootout:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/World Cup \d{4}/)).not.toBeInTheDocument();
  });

  it("still shows the story body when metadata is missing", () => {
    render(<StoryCard data={historicalStoryWithoutKicks} />);
    expect(
      screen.getByText(/kick-by-kick data is incomplete/i),
    ).toBeInTheDocument();
  });

  it("filters out empty paragraphs from the story text", () => {
    const data: StoryResponse = {
      ...speculativeStory,
      story: "First paragraph.\n\n\nSecond paragraph.",
    };
    const { container } = render(<StoryCard data={data} />);
    const paragraphs = container.querySelectorAll(".story-body p");
    expect(paragraphs).toHaveLength(2);
  });
});
