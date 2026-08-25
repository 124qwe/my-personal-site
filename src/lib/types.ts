export type EntryKind = "award" | "deduct";
export type WishStatus = "open" | "granted" | "declined";
export type Role = "her" | "his";

export type EntryDTO = {
  id: string;
  kind: EntryKind;
  actorRole: Role;
  amount: number;
  icon: string;
  label: string;
  reason: string;
  createdAt: string;
};

export type WishDTO = {
  id: string;
  title: string;
  detail: string | null;
  ownerRole: Role;
  cost: number;
  status: WishStatus;
  note: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type CoupleDTO = {
  id: string;
  code: string;
  /** 她的登录码，只有她自己能看到；他那边是 null */
  ownerKey: string | null;
  herName: string;
  hisName: string;
  wishCost: number;
  hasPartner: boolean;
};

export type MeDTO = {
  role: Role;
  nickname: string;
  memberId: string;
};

export type Summary = {
  awarded: number;
  deducted: number;
  balance: number;
  reserved: number;
  available: number;
  wishCost: number;
  canWish: boolean;
  openWishes: number;
  grantedWishes: number;
  weekAwarded: number;
  weekDeducted: number;
};

export type AppState = {
  entries: EntryDTO[];
  wishes: WishDTO[];
  couple: CoupleDTO;
  me: MeDTO;
  summary: Summary;
};
