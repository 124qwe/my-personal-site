import { getSession, toMeDTO } from "@/lib/auth";
import { Board } from "@/components/Board";
import { DbSetup } from "@/components/DbSetup";
import { Onboarding } from "@/components/Onboarding";
import { getState } from "@/lib/state";

export const dynamic = "force-dynamic";

function isDbConfigError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("DATABASE_URL") || msg.includes("缺少 DATABASE_URL");
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  try {
    const session = await getSession();

    if (!session) {
      const sp = await searchParams;
      const code = (sp?.c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      return <Onboarding inviteCode={code} />;
    }

    const initial = await getState(
      session.couple,
      toMeDTO(session),
      session.partnerJoined,
    );
    return <Board initial={initial} />;
  } catch (err) {
    if (isDbConfigError(err)) {
      const msg = err instanceof Error ? err.message : String(err);
      return <DbSetup message={msg} />;
    }
    throw err;
  }
}
