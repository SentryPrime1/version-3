export interface IScanResult {
  id: number;
  url: string;
  compliance: number;
  violations: any[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  id: number;
  email: string;
  name?: string;
}

export interface IScanRequest {
  url: string;
  userId: number;
}
