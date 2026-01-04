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
    const { batch_id } = await req.json();
    
    if (!batch_id) {
      console.error('Missing batch_id');
      return new Response(
        JSON.stringify({ error: 'Missing batch_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting batch execution for: ${batch_id}`);

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get batch run details
    const { data: batch, error: batchError } = await supabase
      .from('batch_runs')
      .select('*')
      .eq('id', batch_id)
      .single();

    if (batchError || !batch) {
      console.error('Error fetching batch:', batchError);
      throw batchError || new Error('Batch not found');
    }

    console.log(`Batch parameters:`, batch);

    // Update batch to RUNNING
    await supabase
      .from('batch_runs')
      .update({ status: 'RUNNING' })
      .eq('id', batch_id);

    // Generate parameter values for sweep
    const stepSize = (batch.end_value - batch.start_value) / Math.max(1, batch.step_count - 1);
    const parameterValues: number[] = [];
    for (let i = 0; i < batch.step_count; i++) {
      parameterValues.push(batch.start_value + stepSize * i);
    }

    console.log(`Sweeping ${batch.sweep_parameter} with values:`, parameterValues);

    // Create and execute simulations for each parameter value
    for (let i = 0; i < parameterValues.length; i++) {
      const paramValue = parameterValues[i];
      
      // Build simulation parameters
      let coil_count = batch.base_coil_count;
      let magnetic_field_strength = batch.base_magnetic_field_strength;
      let plasma_density = batch.base_plasma_density;
      
      switch (batch.sweep_parameter) {
        case 'coil_count':
          coil_count = Math.round(paramValue);
          break;
        case 'magnetic_field_strength':
          magnetic_field_strength = paramValue;
          break;
        case 'plasma_density':
          plasma_density = paramValue;
          break;
      }

      console.log(`Creating simulation ${i + 1}/${batch.step_count} with ${batch.sweep_parameter}=${paramValue}`);

      // Create simulation
      const { data: simulation, error: simError } = await supabase
        .from('simulations')
        .insert({
          coil_count,
          magnetic_field_strength,
          plasma_density,
          simulation_resolution: batch.base_simulation_resolution,
          batch_run_id: batch_id,
          experiment_id: batch.experiment_id,
          status: 'PENDING',
        })
        .select()
        .single();

      if (simError || !simulation) {
        console.error('Error creating simulation:', simError);
        continue;
      }

      // Update to RUNNING
      await supabase
        .from('simulations')
        .update({ 
          status: 'RUNNING',
          started_at: new Date().toISOString(),
        })
        .eq('id', simulation.id);

      // Simulate execution (1-3 seconds per simulation) - using truly random
      const executionTime = 1000 + Math.random() * 2000;
      await sleep(executionTime);

      // 5% chance of failure - TRULY RANDOM (not based on parameters)
      const failureRoll = Math.random();
      console.log(`Simulation ${simulation.id} failure roll: ${failureRoll}`);
      const shouldFail = failureRoll < 0.05;

      if (shouldFail) {
        console.log(`Simulation ${simulation.id} failed`);
        await supabase
          .from('simulations')
          .update({
            status: 'FAILED',
            completed_at: new Date().toISOString(),
            error_message: 'Numerical instability in batch run',
          })
          .eq('id', simulation.id);
      } else {
        // Generate results
        const baseSeed = coil_count * 1000 + 
          Math.floor(magnetic_field_strength * 100) + 
          Math.floor(Math.log10(plasma_density));
        
        const resultRandom = seededRandom(baseSeed);
        
        const confinement_score = 0.5 + resultRandom() * 0.4 + 
          (coil_count / 100) * 0.2 + 
          (magnetic_field_strength / 15) * 0.1;
        
        const energy_loss = 2 + resultRandom() * 5 + 
          (1 - coil_count / 100) * 2;
        
        const stability_index = 0.6 + resultRandom() * 0.3 + 
          (magnetic_field_strength / 15) * 0.1;

        const time_series = generateTimeSeries(baseSeed, batch.base_simulation_resolution);

        // Insert results
        await supabase
          .from('simulation_results')
          .insert({
            job_id: simulation.id,
            confinement_score: parseFloat(confinement_score.toFixed(4)),
            energy_loss: parseFloat(energy_loss.toFixed(4)),
            stability_index: parseFloat(stability_index.toFixed(4)),
            time_series,
          });

        // Update simulation status
        await supabase
          .from('simulations')
          .update({
            status: 'COMPLETED',
            completed_at: new Date().toISOString(),
          })
          .eq('id', simulation.id);

        console.log(`Simulation ${simulation.id} completed`);
      }
    }

    // Update batch to COMPLETED
    await supabase
      .from('batch_runs')
      .update({ 
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch_id);

    console.log(`Batch ${batch_id} completed`);

    return new Response(
      JSON.stringify({ success: true, batch_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in execute-batch:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});