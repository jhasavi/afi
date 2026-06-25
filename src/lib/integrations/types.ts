export type IntegrationStatus = "disabled" | "stub" | "connected";

export type SyncResult = {
  contactsUpdated: number;
  errors: string[];
};

export interface IntegrationProvider {
  name: string;
  status: IntegrationStatus;
  /** Read-only sync — never sends messages */
  syncContacts?(userId: string): Promise<SyncResult>;
}
