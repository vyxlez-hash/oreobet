import React from 'react';

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(seed: number, max: number) { return seed % max; }

export function GeneratedAvatar({ username, size = 40, className = '' }: { username: string; size?: number; className?: string }) {
  const h = hash(username.toLowerCase());
  const skin = ['#f3c28f','#d99058','#b9682d','#8b4a25','#6b351f'][pick(h,5)];
  const hair = ['#171717','#4a281b','#8b542e','#d39b56','#c9c9c9'][pick(h >>> 3,5)];
  const shirt = ['#242a3b','#34405d','#3b4b3c','#5a3c5c','#6a3e2c'][pick(h >>> 6,5)];
  const eye = ['#111827','#3b2b1f','#53657a'][pick(h >>> 9,3)];
  const mouth = pick(h >>> 12,4);
  const accessory = pick(h >>> 15,5);
  const brow = pick(h >>> 18,3);
  const face = `M50 24 C72 24 84 39 84 57 C84 78 70 91 50 91 C30 91 16 78 16 57 C16 39 28 24 50 24Z`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-label={`${username} avatar`} role="img">
      <circle cx="50" cy="50" r="49" fill="#111827"/>
      <path d="M13 100 C16 80 28 72 50 72 C72 72 84 80 87 100Z" fill={shirt}/>
      <path d={face} fill={skin}/>
      <path d="M17 52 C14 30 28 13 50 13 C72 13 86 30 83 52 C77 42 69 35 58 32 C48 38 35 38 22 47Z" fill={hair}/>
      {accessory === 0 && <path d="M17 43 C28 34 38 32 50 32 C63 32 73 35 83 44 L80 49 C68 43 61 41 50 41 C39 41 31 43 20 50Z" fill="#171717" opacity=".95"/>}
      {accessory === 1 && <><circle cx="36" cy="55" r="9" fill="none" stroke="#222" strokeWidth="3"/><circle cx="64" cy="55" r="9" fill="none" stroke="#222" strokeWidth="3"/><path d="M45 55 H55" stroke="#222" strokeWidth="3"/></>}
      {accessory === 2 && <path d="M22 25 L34 10 L50 20 L66 10 L78 25 L70 31 H30Z" fill="#e7e7e7" opacity=".9"/>}
      {accessory === 3 && <path d="M28 25 Q50 4 72 25" fill="none" stroke="#111" strokeWidth="7" strokeLinecap="round"/>}
      {brow === 0 && <><path d="M28 48 Q36 43 43 47" stroke="#4a2518" strokeWidth="3" fill="none"/><path d="M57 47 Q64 43 72 48" stroke="#4a2518" strokeWidth="3" fill="none"/></>}
      {brow === 1 && <><path d="M28 45 L43 48" stroke="#3a2016" strokeWidth="3"/><path d="M57 48 L72 45" stroke="#3a2016" strokeWidth="3"/></>}
      <ellipse cx="36" cy="56" rx="6" ry="5" fill="#fff"/><ellipse cx="64" cy="56" rx="6" ry="5" fill="#fff"/>
      <circle cx="37" cy="56" r="2.7" fill={eye}/><circle cx="63" cy="56" r="2.7" fill={eye}/>
      <path d="M50 58 Q46 67 50 68 Q54 67 50 58" fill="#9a5b39" opacity=".65"/>
      {mouth === 0 && <path d="M40 72 Q50 79 60 72" stroke="#4a1e18" strokeWidth="3" fill="none" strokeLinecap="round"/>}
      {mouth === 1 && <path d="M40 72 Q50 76 60 72" stroke="#4a1e18" strokeWidth="3" fill="none" strokeLinecap="round"/>}
      {mouth === 2 && <ellipse cx="50" cy="73" rx="8" ry="5" fill="#4a1e18"/>}
      {mouth === 3 && <path d="M40 72 Q50 83 60 72" stroke="#4a1e18" strokeWidth="3" fill="none" strokeLinecap="round"/>}
      {accessory === 4 && <circle cx="77" cy="29" r="5" fill="#f4b942"/>}
    </svg>
  );
}
