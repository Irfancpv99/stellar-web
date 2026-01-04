import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TimeSeriesPoint } from '@/types/simulation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  label?: string;
  comparisonData?: TimeSeriesPoint[];
  comparisonLabel?: string;
  height?: number;
}

export function TimeSeriesChart({ 
  data, 
  label = 'Confinement', 
  comparisonData,
  comparisonLabel = 'Comparison',
  height = 300 
}: TimeSeriesChartProps) {
  const chartData = {
    labels: data.map(p => p.t.toFixed(1)),
    datasets: [
      {
        label,
        data: data.map(p => p.value),
        borderColor: 'hsl(185, 70%, 50%)',
        backgroundColor: 'hsla(185, 70%, 50%, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
      ...(comparisonData ? [{
        label: comparisonLabel,
        data: comparisonData.map(p => p.value),
        borderColor: 'hsl(150, 60%, 45%)',
        backgroundColor: 'hsla(150, 60%, 45%, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      }] : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const, // No animations per spec
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: !!comparisonData,
        position: 'top' as const,
        labels: {
          color: 'hsl(210, 20%, 85%)',
          font: { family: 'JetBrains Mono', size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'hsl(220, 18%, 15%)',
        titleColor: 'hsl(210, 20%, 92%)',
        bodyColor: 'hsl(210, 20%, 85%)',
        borderColor: 'hsl(220, 15%, 25%)',
        borderWidth: 1,
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'JetBrains Mono' },
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(4)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(220, 15%, 20%)',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(215, 15%, 55%)',
          font: { family: 'JetBrains Mono', size: 10 },
          maxTicksLimit: 10,
        },
        title: {
          display: true,
          text: 'Time (s)',
          color: 'hsl(215, 15%, 55%)',
          font: { family: 'Inter', size: 12 },
        },
      },
      y: {
        grid: {
          color: 'hsl(220, 15%, 20%)',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(215, 15%, 55%)',
          font: { family: 'JetBrains Mono', size: 10 },
        },
        title: {
          display: true,
          text: 'Confinement Factor',
          color: 'hsl(215, 15%, 55%)',
          font: { family: 'Inter', size: 12 },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
