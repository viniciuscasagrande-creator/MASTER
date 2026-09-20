export interface GuardResult {
  passed: boolean;
  code?: string;
  message?: string;
  details?: any;
}

export interface ITransitionGuard {
  readonly name: string;
  evaluate(eventId: string, context?: any): Promise<GuardResult>;
}
