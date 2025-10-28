
export type DataSource = 'notion' | 'airtable';

export interface Client {
  id: string;
  name: string;
  phone: string;
  appointmentTime?: string;
  pets?: string;
  smsSent?: boolean;
  noShowSmsSent?: boolean;
}

export interface Template {
  id: string;
  title: string;
  content: string;
}

export enum Step {
  SELECT_CLIENT,
  SELECT_TEMPLATE,
  COMPOSE,
  NO_SHOWS,
}