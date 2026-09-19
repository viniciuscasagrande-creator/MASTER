export interface TelemetrySpanData {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  status: 'OK' | 'ERROR';
  errorMessage?: string;
}

export interface TelemetryMetricData {
  name: string;
  value: number;
  unit?: string;
  attributes: Record<string, string>;
  timestamp: number;
}

export interface ITelemetryProvider {
  recordSpan(span: TelemetrySpanData): Promise<void>;
  recordMetric(metric: TelemetryMetricData): Promise<void>;
  exportSpans(): Promise<TelemetrySpanData[]>;
  exportMetrics(): Promise<TelemetryMetricData[]>;
}
