export interface HealthResponse {
  status: "ok";
  service: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function fetchHealth(
  signal?: AbortSignal,
): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, { signal });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}.`);
  }

  return (await response.json()) as HealthResponse;
}

