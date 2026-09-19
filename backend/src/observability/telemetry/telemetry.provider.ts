import { ITelemetryProvider, TelemetrySpanData, TelemetryMetricData } from './telemetry.types';

export class InMemoryTelemetryProvider implements ITelemetryProvider {
  private spans: TelemetrySpanData[] = [];
  private metrics: TelemetryMetricData[] = [];
  private maxBufferSize: number = 10000;

  public async recordSpan(span: TelemetrySpanData): Promise<void> {
    this.spans.push(span);
    if (this.spans.length > this.maxBufferSize) {
      this.spans.shift();
    }
  }

  public async recordMetric(metric: TelemetryMetricData): Promise<void> {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxBufferSize) {
      this.metrics.shift();
    }
  }

  public async exportSpans(): Promise<TelemetrySpanData[]> {
    return [...this.spans];
  }

  public async exportMetrics(): Promise<TelemetryMetricData[]> {
    return [...this.metrics];
  }

  public clear(): void {
    this.spans = [];
    this.metrics = [];
  }
}

export const defaultTelemetryProvider = new InMemoryTelemetryProvider();
