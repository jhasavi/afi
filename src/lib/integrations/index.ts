import { gmailProvider } from "./gmail";
import { crmProvider } from "./crm";
import type { IntegrationProvider } from "./types";

export const integrationProviders: IntegrationProvider[] = [gmailProvider, crmProvider];

export function getProvider(name: string): IntegrationProvider | undefined {
  return integrationProviders.find((p) => p.name === name);
}
