import { getSession, toMeDTO } from "@/lib/auth";
import { Board } from "@/components/Board";
import { Onboarding } from "@/components/Onboarding";
import { getState } from "@/lib/state";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
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
}
