import type { IntegrationProvider } from "./types";

export const gmailProvider: IntegrationProvider = {
  name: "Gmail",
  status: "stub",
  async syncContacts() {
    return {
      contactsUpdated: 0,
      errors: ["Gmail sync is not enabled. Set FEATURE_GMAIL_SYNC=true when available."],
    };
  },
};
