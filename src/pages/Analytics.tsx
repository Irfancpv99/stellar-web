import { Header } from '@/components/Header';
import { CorrelationAnalysis } from '@/components/CorrelationAnalysis';
import { BatchRunForm } from '@/components/BatchRunForm';
import { ExperimentManager } from '@/components/ExperimentManager';
import { ScheduleSimulation } from '@/components/ScheduleSimulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Advanced Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Parameter sweeps, experiments, scheduling, and correlation analysis
          </p>
        </div>

        <Tabs defaultValue="correlation" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="correlation">Correlations</TabsTrigger>
            <TabsTrigger value="batch">Batch Runs</TabsTrigger>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="correlation">
            <CorrelationAnalysis />
          </TabsContent>

          <TabsContent value="batch">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-foreground mb-4">Parameter Sweep</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Queue multiple simulations varying one parameter to find optimal configurations
              </p>
              <BatchRunForm />
            </div>
          </TabsContent>

          <TabsContent value="experiments">
            <ExperimentManager />
          </TabsContent>

          <TabsContent value="schedule">
            <div className="max-w-2xl">
              <ScheduleSimulation />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
