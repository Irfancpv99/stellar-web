import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { FileText, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SimulationJob, SimulationResult } from '@/types/simulation';

interface PDFReportGeneratorProps {
  simulation: SimulationJob;
  results: SimulationResult | null;
  chartRef?: React.RefObject<HTMLDivElement | null>;
}

export function PDFReportGenerator({ simulation, results, chartRef }: PDFReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header
      pdf.setFillColor(15, 23, 42); // Dark background
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(0, 200, 200); // Cyan
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Stellarator Simulation Report', margin, 25);
      
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 35);
      
      yPosition = 55;

      // Simulation ID and Status
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Simulation Details', margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`ID: ${simulation.id}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Status: ${simulation.status}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Created: ${new Date(simulation.created_at).toLocaleString()}`, margin, yPosition);
      if (simulation.completed_at) {
        yPosition += 6;
        pdf.text(`Completed: ${new Date(simulation.completed_at).toLocaleString()}`, margin, yPosition);
      }
      yPosition += 15;

      // Parameters Section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Input Parameters', margin, yPosition);
      yPosition += 8;

      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 35, 'F');
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const params = [
        ['Coil Count', simulation.parameters.coil_count.toString()],
        ['Magnetic Field Strength', `${simulation.parameters.magnetic_field_strength} T`],
        ['Plasma Density', `${simulation.parameters.plasma_density.toExponential(2)} m⁻³`],
        ['Resolution', simulation.parameters.simulation_resolution.toUpperCase()],
      ];

      const colWidth = (pageWidth - 2 * margin) / 2;
      params.forEach((param, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + 5 + col * colWidth;
        const y = yPosition + 5 + row * 15;
        
        pdf.setTextColor(100, 100, 100);
        pdf.text(param[0], x, y);
        pdf.setTextColor(30, 30, 30);
        pdf.setFont('helvetica', 'bold');
        pdf.text(param[1], x, y + 6);
        pdf.setFont('helvetica', 'normal');
      });

      yPosition += 45;

      // Results Section
      if (results) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(50, 50, 50);
        pdf.text('Simulation Results', margin, yPosition);
        yPosition += 10;

        // Metrics boxes
        const metrics = [
          { label: 'Confinement Score', value: results.confinement_score.toFixed(4), unit: 'τ_E' },
          { label: 'Energy Loss', value: results.energy_loss.toFixed(2), unit: 'MW' },
          { label: 'Stability Index', value: results.stability_index.toFixed(4), unit: '' },
        ];

        const boxWidth = (pageWidth - 2 * margin - 20) / 3;
        metrics.forEach((metric, i) => {
          const x = margin + i * (boxWidth + 10);
          
          pdf.setFillColor(0, 180, 180);
          pdf.rect(x, yPosition, boxWidth, 25, 'F');
          
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text(metric.label, x + 5, yPosition + 8);
          
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${metric.value} ${metric.unit}`, x + 5, yPosition + 19);
        });

        yPosition += 35;

        // Chart capture
        if (chartRef?.current) {
          try {
            const canvas = await html2canvas(chartRef.current, {
              backgroundColor: '#1a1a2e',
              scale: 2,
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Check if we need a new page
            if (yPosition + imgHeight > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(50, 50, 50);
            pdf.text('Confinement Time Series', margin, yPosition);
            yPosition += 8;
            
            pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, 80));
            yPosition += Math.min(imgHeight, 80) + 10;
          } catch (err) {
            console.error('Failed to capture chart:', err);
          }
        }

        // Time series data summary
        if (yPosition + 40 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(50, 50, 50);
        pdf.text('Time Series Summary', margin, yPosition);
        yPosition += 8;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        const values = results.time_series.map(p => p.value);
        const stats = [
          ['Data Points', results.time_series.length.toString()],
          ['Min Value', Math.min(...values).toFixed(4)],
          ['Max Value', Math.max(...values).toFixed(4)],
          ['Mean Value', (values.reduce((a, b) => a + b, 0) / values.length).toFixed(4)],
        ];

        stats.forEach((stat, i) => {
          pdf.setTextColor(100, 100, 100);
          pdf.text(`${stat[0]}:`, margin, yPosition + i * 6);
          pdf.setTextColor(30, 30, 30);
          pdf.text(stat[1], margin + 40, yPosition + i * 6);
        });
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Stellarator Simulation Dashboard | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save
      pdf.save(`simulation-${simulation.id.slice(0, 8)}-report.pdf`);
      toast({ title: 'PDF report generated successfully' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={generatePDF}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileText className="w-4 h-4 mr-2" />
      )}
      {isGenerating ? 'Generating...' : 'PDF Report'}
    </Button>
  );
}
