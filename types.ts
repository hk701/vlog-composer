export interface ScriptRequest {
  topic: string;
  style: string;
  duration: string;
  tone: string;
  keyPoints: string;
}

export interface GeneratedScript {
  content: string;
  timestamp: number;
}

export interface SavedScript {
  id: string;
  topic: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  request: ScriptRequest;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
