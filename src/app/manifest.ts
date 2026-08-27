import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "咕嘟星球｜私密喝水监督小站",
    short_name: "咕嘟星球",
    description: "把关心装进每一杯水。只有你们两个人的私密喝水监督与互动小站。",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7ef",
    theme_color: "#153946",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
