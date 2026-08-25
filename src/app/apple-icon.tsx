import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

/** iOS 主屏幕图标。iOS 自己会加圆角，所以画满整块、不留白边。 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(150deg,#ffe0e9 0%,#ffb3c6 48%,#ff7fa3 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 115,
            height: 115,
            borderRadius: 999,
            background: "rgba(255,255,255,0.30)",
            top: -28,
            left: -24,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 86,
            height: 86,
            borderRadius: 999,
            background: "rgba(255,206,84,0.38)",
            bottom: -24,
            right: -16,
            display: "flex",
          }}
        />

        <svg width="127" height="127" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 89C29 74.5 11 60 11 40 11 26 21.5 16.5 33 16.5c7.3 0 13.6 3.8 17 9.7 3.4-5.9 9.7-9.7 17-9.7C78.5 16.5 89 26 89 40c0 20-18 34.5-39 49Z"
            fill="#a81f38"
            opacity="0.28"
            transform="translate(1.5,4)"
          />
          <path
            d="M50 89C29 74.5 11 60 11 40 11 26 21.5 16.5 33 16.5c7.3 0 13.6 3.8 17 9.7 3.4-5.9 9.7-9.7 17-9.7C78.5 16.5 89 26 89 40c0 20-18 34.5-39 49Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinejoin="round"
          />
          <path
            d="M50 89C29 74.5 11 60 11 40 11 26 21.5 16.5 33 16.5c7.3 0 13.6 3.8 17 9.7 3.4-5.9 9.7-9.7 17-9.7C78.5 16.5 89 26 89 40c0 20-18 34.5-39 49Z"
            fill="#ec3b55"
          />
          <path
            d="M50 89c21-14.5 39-29 39-49 0-14-10.5-23.5-22-23.5-7.3 0-13.6 3.8-17 9.7V89Z"
            fill="#c4243d"
            opacity="0.5"
          />
          <ellipse
            cx="32"
            cy="35"
            rx="11"
            ry="8"
            fill="#ffffff"
            opacity="0.8"
            transform="rotate(-33 32 35)"
          />
          <path
            d="M70 30.5l2.6 5.8 5.8 2.6-5.8 2.6L70 47.3l-2.6-5.8-5.8-2.6 5.8-2.6Z"
            fill="#ffffff"
            opacity="0.92"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
