import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";
export const dynamic = "force-static";

/**
 * 主屏幕图标：粉色渐变底 + 一张模切爱心贴纸 + 小星星
 * 小尺寸下也能认出来：主体大、白描边强、不放文字
 */
export default function Icon() {
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
        {/* 背景柔光 */}
        <div
          style={{
            position: "absolute",
            width: 320,
            height: 320,
            borderRadius: 999,
            background: "rgba(255,255,255,0.30)",
            top: -80,
            left: -70,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 240,
            height: 240,
            borderRadius: 999,
            background: "rgba(255,206,84,0.38)",
            bottom: -70,
            right: -50,
            display: "flex",
          }}
        />

        <svg width="360" height="360" viewBox="0 0 100 100" fill="none">
          {/* 贴纸投影 */}
          <path
            d="M50 89C29 74.5 11 60 11 40 11 26 21.5 16.5 33 16.5c7.3 0 13.6 3.8 17 9.7 3.4-5.9 9.7-9.7 17-9.7C78.5 16.5 89 26 89 40c0 20-18 34.5-39 49Z"
            fill="#a81f38"
            opacity="0.28"
            transform="translate(1.5,4)"
          />
          {/* 白色模切描边 */}
          <path
            d="M50 89C29 74.5 11 60 11 40 11 26 21.5 16.5 33 16.5c7.3 0 13.6 3.8 17 9.7 3.4-5.9 9.7-9.7 17-9.7C78.5 16.5 89 26 89 40c0 20-18 34.5-39 49Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinejoin="round"
          />
          {/* 爱心主体 */}
          <path
            d="M50 89C29 74.5 11 60 11 40 11 26 21.5 16.5 33 16.5c7.3 0 13.6 3.8 17 9.7 3.4-5.9 9.7-9.7 17-9.7C78.5 16.5 89 26 89 40c0 20-18 34.5-39 49Z"
            fill="#ec3b55"
          />
          {/* 右半边压暗，做出体积 */}
          <path
            d="M50 89c21-14.5 39-29 39-49 0-14-10.5-23.5-22-23.5-7.3 0-13.6 3.8-17 9.7V89Z"
            fill="#c4243d"
            opacity="0.5"
          />
          {/* 高光 */}
          <ellipse
            cx="32"
            cy="35"
            rx="11"
            ry="8"
            fill="#ffffff"
            opacity="0.8"
            transform="rotate(-33 32 35)"
          />
          {/* 小星星点缀 */}
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
