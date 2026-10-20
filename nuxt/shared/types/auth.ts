export interface PilotProfile {
  name: string;
  totalFlightHours: number;
  avatarUrl: string;
  today: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}
