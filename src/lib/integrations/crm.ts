import type { IntegrationProvider } from "./types";

export const crmProvider: IntegrationProvider = {
  name: "CRM",
  status: "stub",
  async syncContacts() {
    return {
      contactsUpdated: 0,
      errors: ["CRM sync is not enabled. Set FEATURE_CRM_SYNC=true when available."],
    };
  },
};
