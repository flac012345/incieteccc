import { GeotechParameters, SimulationSummary, AIResponse } from '../types/geotech';

const API_BASE_URL = 'http://localhost:8000/api';

export async function checkBackendHealth(): Promise<{ status: string; engine: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Error al conectar con la API de Terrascope');
  }
  return response.json();
}

export async function simulateSlopeStability(params: GeotechParameters): Promise<SimulationSummary> {
  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Error ejecutando cálculo geotécnico en backend');
  }

  return response.json();
}

export async function queryAIAnalysis(payload: {
  question: string;
  parameters: GeotechParameters;
  summary: SimulationSummary;
  comparison_summary?: SimulationSummary | null;
}): Promise<AIResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Error al consultar el asistente geotécnico de IA');
  }

  return response.json();
}
