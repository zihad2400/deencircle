"use client";

export default function UserAvatar({ name, role, avatarUrl, size = 40 }) {
  const initial = name ? name.charAt(0).toUpperCase() : "A";
  const isAdmin = role === "admin";

  return (
    <div className="relative inline-block shrink-0">
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={name} 
          className={`rounded-full object-cover shadow-sm ${isAdmin ? "ring-2 ring-amber-400/50" : ""}`}
          style={{ width: size, height: size }}
        />
      ) : (
        <div 
          className={`flex items-center justify-center rounded-full font-bold text-white shadow-sm
            ${isAdmin ? "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 ring-2 ring-amber-400/30" : "bg-gradient-to-br from-ts-primary to-indigo-600"}`}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {initial}
        </div>
      )}
      
      {isAdmin && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-ts-surface rounded-full p-0.5">
          <svg viewBox="0 0 24 24" width={size * 0.35} height={size * 0.35} fill="#3b82f6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </span>
      )}
    </div>
  );
}
