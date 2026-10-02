import { SVGProps } from "react";

// Custom crab icon — lucide-react doesn't ship a Crab, so we draw a simple one.
// Matches lucide stroke style (24x24 viewBox, 2px stroke, currentColor).
export function CrabIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Body */}
      <ellipse cx="12" cy="13" rx="5" ry="3.5" />
      {/* Eyes */}
      <circle cx="10" cy="11.5" r="0.5" fill="currentColor" />
      <circle cx="14" cy="11.5" r="0.5" fill="currentColor" />
      {/* Left claw arm */}
      <path d="M7 11.5 C 4 11, 3 9, 3.5 7.5" />
      <path d="M3.5 7.5 C 2.5 7, 2 6, 2.5 5" />
      <path d="M3.5 7.5 C 4.5 7, 5 6, 4.5 5" />
      {/* Right claw arm */}
      <path d="M17 11.5 C 20 11, 21 9, 20.5 7.5" />
      <path d="M20.5 7.5 C 21.5 7, 22 6, 21.5 5" />
      <path d="M20.5 7.5 C 19.5 7, 19 6, 19.5 5" />
      {/* Legs */}
      <path d="M8 15.5 L 6.5 18" />
      <path d="M16 15.5 L 17.5 18" />
      <path d="M9.5 16 L 8.5 19" />
      <path d="M14.5 16 L 15.5 19" />
    </svg>
  );
}
