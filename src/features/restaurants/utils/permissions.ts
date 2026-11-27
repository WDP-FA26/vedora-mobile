import type {
  WorkspaceDetail,
  WorkspaceMember,
} from '../types/restaurant.schema';

export function canRemoveWorkspaceMember(
  workspace: Pick<WorkspaceDetail, 'role' | 'pageUserId'>,
  member: Pick<WorkspaceMember, 'role' | 'userId'>,
  userId: string | null | undefined,
  actorId: string | null | undefined
) {
  const personId = actorId ?? userId;
  return (
    member.role !== 'OWNER' &&
    (workspace.role === 'OWNER' || member.userId === personId) &&
    !(member.userId === personId && userId === workspace.pageUserId)
  );
}
