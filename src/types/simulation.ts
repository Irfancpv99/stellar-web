export type SimulationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type SimulationResolution = 'low' | 'medium' | 'high';

export interface SimulationParameters {
  coil_count: number;
  magnetic_field_strength: number;
  plasma_density: number;
  simulation_resolution: SimulationResolution;
  failure_rate?: number; // 0-100 percentage, defaults to 10
}

export interface SimulationJob {
  id: string;
  status: SimulationStatus;
  parameters: SimulationParameters;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface TimeSeriesPoint {
  t: number;
  value: number;
}

export interface SimulationResult {
  job_id: string;
  confinement_score: number;
  energy_loss: number;
  stability_index: number;
  time_series: TimeSeriesPoint[];
}

export interface CreateSimulationRequest {
  parameters: SimulationParameters;
}
