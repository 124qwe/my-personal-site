import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "贴画铺子 · 我们的小账本",
    short_name: "贴画铺子",
    description: "情侣专属的贴画奖罚账本，攒够贴画就能许愿。",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdf3e4",
    theme_color: "#ff8fab",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
