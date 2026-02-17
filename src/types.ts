export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string;
          lat_rounded: number;
          lon_rounded: number;
          geog: unknown;
          updated_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          lat_rounded: number;
          lon_rounded: number;
          updated_at?: string;
        };
        Update: {
          handle?: string;
          lat_rounded?: number;
          lon_rounded?: number;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          handle: string;
          body: string;
          lat_rounded: number;
          lon_rounded: number;
          geog: unknown;
          created_at: string;
        };
        Insert: {
          handle: string;
          body: string;
          lat_rounded: number;
          lon_rounded: number;
        };
      };
      reports: {
        Row: {
          id: string;
          message_id: string;
          reporter_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          message_id: string;
          reporter_id: string;
          reason?: string | null;
        };
      };
    };
  };
}

export interface Message {
  id: string;
  handle: string;
  body: string;
  created_at: string;
}

export interface Profile {
  id: string;
  handle: string;
  lat_rounded: number;
  lon_rounded: number;
}
