export interface WebhookConfig {
  url: string;
  token?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isAdmin: boolean;
  webhookConfig?: WebhookConfig;
  createdAt: Date;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface TradingSignal {
  symbol: 'MES' | 'N225MC';
  action: 'BUY' | 'SELL' | 'FLAT';
  price: number;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  details: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface WebhookConfigData {
  url: string;
  token?: string;
  isActive: boolean;
}