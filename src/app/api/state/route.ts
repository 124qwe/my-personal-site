import { getSession } from "@/lib/auth";
import { ensureTables } from "@/lib/ensure";
import { handleDbError, respond, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureTables();
    const s = await getSession();
    if (!s) return unauthorized();
    return await respond(s);
  } catch (err) {
    return handleDbError(err) ?? (() => { throw err; })();
  }
}
