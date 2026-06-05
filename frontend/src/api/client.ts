import axios, { AxiosError } from "axios";
import type { CountriesResponse, StoryResponse, ApiError } from "../types";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 90_000, // LLM responses can be slow.
});

/** Normalises Axios errors into a predictable shape. */
function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    return {
      detail: err.response?.data?.detail ?? err.message,
      status: err.response?.status ?? 0,
    };
  }
  return { detail: "Unexpected error", status: 0 };
}

export async function fetchCountries(): Promise<string[]> {
  try {
    const { data } = await apiClient.get<CountriesResponse>("/countries");
    return data.countries;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function fetchStory(country: string): Promise<StoryResponse> {
  try {
    const { data } = await apiClient.post<StoryResponse>("/story", { country });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}
