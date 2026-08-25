export const MAX_PER_ACTION = 5;
export const DEFAULT_WISH_COST = 20;

export type StickerDef = {
  icon: string;
  label: string;
  hint: string;
};

export const AWARD_STICKERS: StickerDef[] = [
  { icon: "🌟", label: "星星贴", hint: "表现太好，必须记一功" },
  { icon: "🍓", label: "草莓贴", hint: "今天甜到我了" },
  { icon: "🐻", label: "抱抱贴", hint: "抱得很用力，加分" },
  { icon: "🍜", label: "干饭贴", hint: "做饭 / 带饭 / 洗碗" },
  { icon: "🧹", label: "家务贴", hint: "屋子被你收拾干净了" },
  { icon: "💪", label: "靠谱贴", hint: "说到做到，很有安全感" },
  { icon: "🌈", label: "哄人贴", hint: "把我哄好了，很会嘛" },
  { icon: "🎁", label: "惊喜贴", hint: "偷偷准备的小心思" },
  { icon: "💌", label: "情书贴", hint: "说的话我记住了" },
  { icon: "🐱", label: "撒娇贴", hint: "猫猫行为，可爱犯规" },
  { icon: "🌙", label: "晚安贴", hint: "每天都记得说晚安" },
  { icon: "🏆", label: "冠军贴", hint: "本月最佳男友" },
];

export const DEDUCT_STICKERS: StickerDef[] = [
  { icon: "😤", label: "生气贴", hint: "惹我不开心了" },
  { icon: "📱", label: "手机贴", hint: "一直刷手机不理我" },
  { icon: "⏰", label: "迟到贴", hint: "又让我等" },
  { icon: "🙈", label: "忘记贴", hint: "说好的事情忘了" },
  { icon: "🍺", label: "贪杯贴", hint: "喝多了不许抱我" },
  { icon: "🥶", label: "冷战贴", hint: "不理人，扣" },
  { icon: "🧦", label: "乱扔贴", hint: "袜子又在沙发上" },
  { icon: "🗯️", label: "顶嘴贴", hint: "态度不好，重来" },
];

export const QUICK_REASONS_AWARD = [
  "主动洗碗",
  "接我下班",
  "记得我的小日子",
  "哄我哄得很有耐心",
  "做了一桌我爱吃的",
  "陪我看完了整部剧",
];

export const QUICK_REASONS_DEDUCT = [
  "打游戏不理我",
  "答应的事没做",
  "迟到 20 分钟",
  "偷偷吃独食",
  "把我说的话忘了",
  "凶我",
];

export const WISH_IDEAS = [
  "一整天的自由游戏日",
  "你陪我看我选的烂片",
  "点一次我最贵的外卖",
  "周末去我想去的地方",
  "免做一次家务券",
  "买一个我加了很久的购物车",
];

export const WISH_STATUS_LABEL: Record<string, string> = {
  open: "待兑现",
  granted: "已兑现",
  declined: "已作废",
};

export function pickSticker(
  list: StickerDef[],
  icon: string,
): StickerDef | undefined {
  return list.find((s) => s.icon === icon);
}
