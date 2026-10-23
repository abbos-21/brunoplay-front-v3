<template>
  <!-- a leather wallet with a gold clasp and a banknote peeking out -->
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="wallet-body" x1="32" y1="18" x2="32" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#e58a3a" />
        <stop offset="1" stop-color="#b8571a" />
      </linearGradient>
      <linearGradient id="wallet-clasp" x1="48" y1="30" x2="48" y2="46" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffe680" />
        <stop offset="1" stop-color="#f2b11c" />
      </linearGradient>
    </defs>
    <!-- banknote -->
    <g transform="rotate(-8 30 22)">
      <rect x="12" y="8" width="34" height="20" rx="3" fill="#5ed06a" stroke="#2f8f3b" stroke-width="1.6" />
      <circle cx="29" cy="18" r="5" fill="#a8f0ae" stroke="#2f8f3b" stroke-width="1.4" />
    </g>
    <!-- body -->
    <rect x="6" y="20" width="52" height="36" rx="8" fill="url(#wallet-body)" stroke="#7a3a12" stroke-width="2" />
    <path d="M10 27c0-2 1.6-3.5 3.6-3.5h36.8" stroke="#ffd29a" stroke-width="2" stroke-linecap="round" opacity="0.7" />
    <!-- stitching -->
    <path d="M12 51h26" stroke="#ffd29a" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 3" opacity="0.6" />
    <!-- clasp -->
    <rect x="40" y="30" width="20" height="16" rx="6" fill="url(#wallet-clasp)" stroke="#7a3a12" stroke-width="2" />
    <circle cx="48" cy="38" r="2.6" fill="#7a3a12" />
  </svg>
</template>
