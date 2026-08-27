export type Role = "sender" | "star";

export type TaskStatus =
  | "pending_accept"
  | "in_progress"
  | "pending_review"
  | "completed"
  | "failed"
  | "skipped"
  | "cancelled";

export interface GuduTask {
  id: string;
  cups: number;
  ml: number;
  loveNote: string | null;
  miniTask: string | null;
  emoji: string;
  kind: "daily" | "manual";
  status: TaskStatus;
  acceptDeadline: string;
  finishDeadline: string | null;
  acceptedAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  startPhotoUrl: string | null;
  endPhotoUrl: string | null;
  rejectReason: string | null;
  failReason: string | null;
  createdAt: string;
}

export interface GuduReward {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  cost: number;
  active: boolean;
  createdAt: string;
}

export interface GuduRedemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  status: "pending" | "approved" | "done" | "rejected";
  reviewedAt: string | null;
  createdAt: string;
}

export interface GuduCheer {
  id: string;
  text: string;
  emoji: string;
  createdAt: string;
}

export interface LedgerItem {
  id: string;
  delta: number;
  reason: string;
  taskId: string | null;
  createdAt: string;
  kind: "drop" | "medal";
}

export interface TodayReport {
  sent: number;
  completed: number;
  failed: number;
  skipped: number;
  ml: number;
  netDrops: number;
}

export interface AppSnapshot {
  authenticated: true;
  role: Role;
  nickname: string;
  pairCode: string;
  paired: boolean;
  drops: number;
  medals: number;
  tasks: GuduTask[];
  rewards: GuduReward[];
  redemptions: GuduRedemption[];
  cheers: GuduCheer[];
  ledger: LedgerItem[];
  today: TodayReport;
  serverNow: string;
}

export interface GuestSnapshot {
  authenticated: false;
}

export type Snapshot = AppSnapshot | GuestSnapshot;
