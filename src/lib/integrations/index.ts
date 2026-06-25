import { gmailProvider } from "./gmail";
import { crmProvider } from "./crm";
import { nbProvider } from "./nb";
import type { IntegrationProvider } from "./types";

export const integrationProviders: IntegrationProvider[] = [nbProvider, gmailProvider, crmProvider];

export function getProvider(name: string): IntegrationProvider | undefined {
  return integrationProviders.find((p) => p.name === name);
}
