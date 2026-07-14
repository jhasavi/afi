import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { maybeAutoSyncNb } from "@/lib/actions/nb-sync";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Do not block navigation on weekly NB sync — failures must never crash pages.
  void maybeAutoSyncNb(user.id);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={user.name} companyName={user.companyName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
