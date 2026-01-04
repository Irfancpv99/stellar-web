import { SimulationJob, SimulationResult, SimulationParameters, TimeSeriesPoint } from '@/types/simulation';

// Generate a UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// In-memory store (simulates database)
let simulations: SimulationJob[] = [];
const results: Map<string, SimulationResult> = new Map();

// Seed with some initial data
const seedData = () => {
  if (simulations.length > 0) return;
  
  const now = new Date();
  const completedJob: SimulationJob = {
    id: generateUUID(),
    status: 'COMPLETED',
    parameters: {
      coil_count: 50,
      magnetic_field_strength: 5.5,
      plasma_density: 1e20,
      simulation_resolution: 'high',
    },
    created_at: new Date(now.getTime() - 3600000).toISOString(),
    started_at: new Date(now.getTime() - 3500000).toISOString(),
    completed_at: new Date(now.getTime() - 3400000).toISOString(),
    error_message: null,
  };
  
  const runningJob: SimulationJob = {
    id: generateUUID(),
    status: 'RUNNING',
    parameters: {
      coil_count: 48,
      magnetic_field_strength: 5.0,
      plasma_density: 8e19,
      simulation_resolution: 'medium',
    },
    created_at: new Date(now.getTime() - 60000).toISOString(),
    started_at: new Date(now.getTime() - 50000).toISOString(),
    completed_at: null,
    error_message: null,
  };
  
  simulations = [completedJob, runningJob];
  
  // Generate result for completed job
  results.set(completedJob.id, generateResult(completedJob.id, completedJob.parameters));
};

// Generate deterministic-but-random results based on parameters
const generateResult = (jobId: string, params: SimulationParameters): SimulationResult => {
  const seed = params.coil_count * 1000 + params.magnetic_field_strength * 100 + params.plasma_density / 1e18;
  
  const confinement_score = 0.6 + (Math.sin(seed) * 0.2 + 0.2);
  const energy_loss = 0.05 + (Math.cos(seed) * 0.03 + 0.03);
  const stability_index = 0.7 + (Math.sin(seed * 2) * 0.15 + 0.15);
  
  // Generate time series (100 points)
  const time_series: TimeSeriesPoint[] = [];
  for (let i = 0; i < 100; i++) {
    const t = i * 0.1;
    const value = confinement_score * Math.exp(-energy_loss * t) * (1 + 0.1 * Math.sin(t * stability_index * 10));
    time_series.push({ t, value });
  }
  
  return {
    job_id: jobId,
    confinement_score: Number(confinement_score.toFixed(4)),
    energy_loss: Number(energy_loss.toFixed(4)),
    stability_index: Number(stability_index.toFixed(4)),
    time_series,
  };
};

// Simulate async job execution
const executeSimulation = async (jobId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const job = simulations.find(s => s.id === jobId);
  if (!job) return;
  
  job.status = 'RUNNING';
  job.started_at = new Date().toISOString();
  
  const executionTime = 3000 + Math.random() * 7000;
  await new Promise(resolve => setTimeout(resolve, executionTime));
  
  if (Math.random() < 0.1) {
    job.status = 'FAILED';
    job.error_message = 'Simulation diverged: plasma instability detected at t=4.2s';
    job.completed_at = new Date().toISOString();
    return;
  }
  
  job.status = 'COMPLETED';
  job.completed_at = new Date().toISOString();
  results.set(jobId, generateResult(jobId, job.parameters));
};

// API Functions
export const api = {
  getSimulations: async (): Promise<SimulationJob[]> => {
    seedData();
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...simulations].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
  
  getSimulation: async (id: string): Promise<SimulationJob | null> => {
    seedData();
    await new Promise(resolve => setTimeout(resolve, 50));
    return simulations.find(s => s.id === id) || null;
  },
  
  createSimulation: async (params: SimulationParameters): Promise<SimulationJob> => {
    seedData();
    const job: SimulationJob = {
      id: generateUUID(),
      status: 'PENDING',
      parameters: params,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      error_message: null,
    };
    
    simulations.unshift(job);
    executeSimulation(job.id);
    
    return job;
  },
  
  deleteSimulation: async (id: string): Promise<boolean> => {
    const index = simulations.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    simulations.splice(index, 1);
    results.delete(id);
    return true;
  },
  
  getResults: async (id: string): Promise<SimulationResult | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return results.get(id) || null;
  },
  
  exportResults: async (id: string, format: 'json' | 'csv'): Promise<string> => {
    const result = results.get(id);
    if (!result) throw new Error('Results not found');
    
    if (format === 'json') {
      return JSON.stringify(result, null, 2);
    }
    
    const headers = 't,value\n';
    const rows = result.time_series.map(p => `${p.t},${p.value}`).join('\n');
    return headers + rows;
  },
};
