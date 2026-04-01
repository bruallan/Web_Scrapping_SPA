import { Timestamp } from "firebase/firestore";

export type MissionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Mission {
  id: string;
  status: MissionStatus;
  progress: number;
  target: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ownerId: string;
}

export interface RawFile {
  id: string;
  missionId: string;
  name: string;
  url: string;
  size: number;
  category: string;
  timestamp: Timestamp;
  ownerId: string;
}

export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface Log {
  id: string;
  missionId: string;
  message: string;
  level: LogLevel;
  timestamp: Timestamp;
  ownerId: string;
}
