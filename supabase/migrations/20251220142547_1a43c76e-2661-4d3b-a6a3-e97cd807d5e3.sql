-- Create enum for simulation status
CREATE TYPE public.simulation_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- Create enum for simulation resolution
CREATE TYPE public.simulation_resolution AS ENUM ('low', 'medium', 'high');

-- Create simulations table
CREATE TABLE public.simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status simulation_status NOT NULL DEFAULT 'PENDING',
    coil_count INTEGER NOT NULL,
    magnetic_field_strength REAL NOT NULL,
    plasma_density REAL NOT NULL,
    simulation_resolution simulation_resolution NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Create simulation results table
CREATE TABLE public.simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    confinement_score REAL NOT NULL,
    energy_loss REAL NOT NULL,
    stability_index REAL NOT NULL,
    time_series JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(job_id)
);

-- Create parameter presets table
CREATE TABLE public.parameter_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    coil_count INTEGER NOT NULL,
    magnetic_field_strength REAL NOT NULL,
    plasma_density REAL NOT NULL,
    simulation_resolution simulation_resolution NOT NULL DEFAULT 'medium',
    is_builtin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parameter_presets ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required per spec)
CREATE POLICY "Allow public read simulations" ON public.simulations FOR SELECT USING (true);
CREATE POLICY "Allow public insert simulations" ON public.simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update simulations" ON public.simulations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete simulations" ON public.simulations FOR DELETE USING (true);

CREATE POLICY "Allow public read results" ON public.simulation_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert results" ON public.simulation_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read presets" ON public.parameter_presets FOR SELECT USING (true);
CREATE POLICY "Allow public insert presets" ON public.parameter_presets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete presets" ON public.parameter_presets FOR DELETE USING (true);

-- Insert built-in presets
INSERT INTO public.parameter_presets (name, description, coil_count, magnetic_field_strength, plasma_density, simulation_resolution, is_builtin)
VALUES 
    ('Low Resolution Test', 'Quick test run with minimal parameters for rapid iteration', 12, 2.5, 1e19, 'low', true),
    ('Standard Run', 'Balanced configuration for typical stellarator analysis', 24, 5.0, 5e19, 'medium', true),
    ('High Fidelity', 'Maximum precision simulation for detailed research analysis', 48, 7.5, 1e20, 'high', true);

-- Enable realtime for simulations
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulations;