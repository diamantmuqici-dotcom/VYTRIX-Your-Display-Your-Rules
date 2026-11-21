export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id="logoGradient" x1="56" y1="96" x2="456" y2="448" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00D9FF" />
          <stop offset="0.52" stopColor="#6557FF" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path d="M56 96 H152 L256 366 L360 96 H456 L296 448 H216 Z" fill="url(#logoGradient)" />
      <path d="M170 96 H210 L256 232 L302 96 H342 L256 332 Z" fill="#080B12" />
      <path d="M238 380 H274 L256 420 Z" fill="#00D9FF" />
    </svg>
  );
}
