-- Create experiments table for grouping simulations
CREATE TABLE public.experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create batch_runs table for parameter sweeps
CREATE TABLE public.batch_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sweep_parameter text NOT NULL, -- 'coil_count', 'magnetic_field_strength', 'plasma_density'
  start_value real NOT NULL,
  end_value real NOT NULL,
  step_count integer NOT NULL DEFAULT 5,
  base_coil_count integer NOT NULL,
  base_magnetic_field_strength real NOT NULL,
  base_plasma_density real NOT NULL,
  base_simulation_resolution simulation_resolution NOT NULL DEFAULT 'medium',
  status simulation_status NOT NULL DEFAULT 'PENDING',
  experiment_id uuid REFERENCES public.experiments(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Create scheduled_simulations table
CREATE TABLE public.scheduled_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_at timestamp with time zone NOT NULL,
  coil_count integer NOT NULL,
  magnetic_field_strength real NOT NULL,
  plasma_density real NOT NULL,
  simulation_resolution simulation_resolution NOT NULL DEFAULT 'medium',
  experiment_id uuid REFERENCES public.experiments(id) ON DELETE SET NULL,
  simulation_id uuid REFERENCES public.simulations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'executed', 'cancelled'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create comments table for annotations
CREATE TABLE public.simulation_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  content text NOT NULL,
  time_point real, -- optional: specific time in the time series
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add experiment_id and batch_run_id to simulations
ALTER TABLE public.simulations 
ADD COLUMN experiment_id uuid REFERENCES public.experiments(id) ON DELETE SET NULL,
ADD COLUMN batch_run_id uuid REFERENCES public.batch_runs(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for experiments
CREATE POLICY "Allow public read experiments" ON public.experiments FOR SELECT USING (true);
CREATE POLICY "Allow public insert experiments" ON public.experiments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update experiments" ON public.experiments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete experiments" ON public.experiments FOR DELETE USING (true);

-- RLS policies for batch_runs
CREATE POLICY "Allow public read batch_runs" ON public.batch_runs FOR SELECT USING (true);
CREATE POLICY "Allow public insert batch_runs" ON public.batch_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update batch_runs" ON public.batch_runs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete batch_runs" ON public.batch_runs FOR DELETE USING (true);

-- RLS policies for scheduled_simulations
CREATE POLICY "Allow public read scheduled_simulations" ON public.scheduled_simulations FOR SELECT USING (true);
CREATE POLICY "Allow public insert scheduled_simulations" ON public.scheduled_simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update scheduled_simulations" ON public.scheduled_simulations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete scheduled_simulations" ON public.scheduled_simulations FOR DELETE USING (true);

-- RLS policies for simulation_comments
CREATE POLICY "Allow public read comments" ON public.simulation_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert comments" ON public.simulation_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update comments" ON public.simulation_comments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete comments" ON public.simulation_comments FOR DELETE USING (true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.experiments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_simulations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulation_comments;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.simulation_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();