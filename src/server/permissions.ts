import "server-only";
import { getCurrentPlayerId } from "@/lib/auth";
import { db, unwrap } from "@/lib/supabase";

/**
 * A note on what this is and is not.
 *
 * Everyone shares one passcode and picks their own name from a list, so "who
 * you are" is self-declared — anyone could switch to another name and delete
 * whatever they like. These checks are a guard rail against mis-taps and a
 * statement of intent, not real access control. Making them enforceable would
 * mean giving each person a real login.
 */
export type Viewer = {
  playerId: string | null;
  isAdmin: boolean;
  /** False until somebody is marked as an admin — then nobody is locked out. */
  anyAdminExists: boolean;
};

export async function getViewer(): Promise<Viewer> {
  const playerId = await getCurrentPlayerId();
  const list = unwrap(await db().from("players").select("id, is_admin")) as {
    id: string;
    is_admin: boolean;
  }[];

  return {
    playerId,
    isAdmin: !!playerId && list.some((p) => p.id === playerId && p.is_admin),
    anyAdminExists: list.some((p) => p.is_admin),
  };
}

/** The organiser of an event, or an admin, may delete or edit it. */
export function canManageEvent(
  viewer: Viewer,
  event: { created_by: string | null },
): boolean {
  // Before anyone is made an admin, keep the old free-for-all so a fresh
  // install is not stuck with events nobody can remove.
  if (!viewer.anyAdminExists) return true;
  if (viewer.isAdmin) return true;
  return !!viewer.playerId && event.created_by === viewer.playerId;
}

/** Why the delete button is hidden, phrased for a person. */
export function manageDeniedReason(
  viewer: Viewer,
  event: { created_by: string | null },
): string {
  if (!viewer.playerId) {
    return "Pick who you are first (tap your name up top) to manage this event.";
  }
  if (event.created_by) {
    return "Only whoever created this event, or an admin, can delete it.";
  }
  return "Only an admin can delete this event.";
}
