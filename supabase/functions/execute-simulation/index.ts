import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimeSeriesPoint {
  t: number;
  value: number;
}

// Simple seedable random number generator
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function generateTimeSeries(seed: number, resolution: string): TimeSeriesPoint[] {
  const random = seededRandom(seed);
  const points: TimeSeriesPoint[] = [];
  const numPoints = resolution === 'low' ? 50 : resolution === 'medium' ? 100 : 200;
  
  let value = 0.5 + random() * 0.3;
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    value += (random() - 0.5) * 0.1;
    value = Math.max(0.1, Math.min(0.95, value));
    points.push({ t: parseFloat(t.toFixed(4)), value: parseFloat(value.toFixed(4)) });
  }
  
  return points;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { simulation_id, failure_rate = 10 } = await req.json();
    
    if (!simulation_id) {
      console.error('Missing simulation_id');
      return new Response(
        JSON.stringify({ error: 'Missing simulation_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate failure rate (0-100)
    const validFailureRate = Math.max(0, Math.min(100, Number(failure_rate) || 10));
    console.log(`Starting simulation execution for: ${simulation_id} with failure rate: ${validFailureRate}%`);

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to RUNNING
    const { error: updateError } = await supabase
      .from('simulations')
      .update({ 
        status: 'RUNNING',
        started_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', simulation_id);

    if (updateError) {
      console.error('Error updating simulation to RUNNING:', updateError);
      throw updateError;
    }

    // Get simulation parameters
    const { data: simulation, error: fetchError } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulation_id)
      .single();

    if (fetchError || !simulation) {
      console.error('Error fetching simulation:', fetchError);
      throw fetchError || new Error('Simulation not found');
    }

    console.log(`Simulation parameters:`, simulation);

    // Simulate execution time (3-10 seconds) - using truly random
    const executionTime = 3000 + Math.random() * 7000;
    
    console.log(`Simulating execution for ${executionTime}ms`);
    await sleep(executionTime);

    // Configurable failure rate - TRULY RANDOM
    const failureRoll = Math.random() * 100;
    console.log(`Failure roll: ${failureRoll.toFixed(2)} (fails if < ${validFailureRate})`);
    const shouldFail = failureRoll < validFailureRate;

    if (shouldFail) {
      console.log(`Simulation ${simulation_id} failed`);
      await supabase
        .from('simulations')
        .update({
          status: 'FAILED',
          completed_at: new Date().toISOString(),
          error_message: 'Numerical instability detected in plasma equilibrium solver',
        })
        .eq('id', simulation_id);
    } else {
      console.log(`Simulation ${simulation_id} completed successfully`);
      
      // Generate deterministic results based on parameters
      const baseSeed = simulation.coil_count * 1000 + 
        Math.floor(simulation.magnetic_field_strength * 100) + 
        Math.floor(Math.log10(simulation.plasma_density));
      
      const resultRandom = seededRandom(baseSeed);
      
      const confinement_score = 0.5 + resultRandom() * 0.4 + 
        (simulation.coil_count / 100) * 0.2 + 
        (simulation.magnetic_field_strength / 15) * 0.1;
      
      const energy_loss = 2 + resultRandom() * 5 + 
        (1 - simulation.coil_count / 100) * 2;
      
      const stability_index = 0.6 + resultRandom() * 0.3 + 
        (simulation.magnetic_field_strength / 15) * 0.1;

      const time_series = generateTimeSeries(baseSeed, simulation.simulation_resolution);

      // Insert results
      const { error: insertError } = await supabase
        .from('simulation_results')
        .insert({
          job_id: simulation_id,
          confinement_score: parseFloat(confinement_score.toFixed(4)),
          energy_loss: parseFloat(energy_loss.toFixed(4)),
          stability_index: parseFloat(stability_index.toFixed(4)),
          time_series,
        });

      if (insertError) {
        console.error('Error inserting results:', insertError);
        throw insertError;
      }

      // Update simulation status
      await supabase
        .from('simulations')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        })
        .eq('id', simulation_id);
    }

    return new Response(
      JSON.stringify({ success: true, simulation_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in execute-simulation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
