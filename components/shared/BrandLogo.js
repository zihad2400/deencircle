export default function BrandLogo({ size = 32, className = "" }) {
  return (
    <div 
      className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* SVG Islamic Pattern (Mosque Dome & Star) */}
      <svg 
        viewBox="0 0 24 24" 
        width={size * 0.6} 
        height={size * 0.6} 
        fill="none" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Dome */}
        <path d="M12 3c-1.5 2-4 3-4 6 0 1.5 1 2.5 2 3h4c1-.5 2-1.5 2-3 0-3-2.5-4-4-6z" fill="white" opacity="0.9"/>
        {/* Base */}
        <path d="M8 12v7m8-7v7M6 19h12" />
        {/* Crescent Star on top */}
        <path d="M12 2l.5 1.5h1.5l-1.2.9.5 1.6-1.3-1-1.3 1 .5-1.6-1.2-.9h1.5z" fill="white" stroke="none" />
      </svg>
    </div>
  );
}
