import type React from 'react';

export const HealthFirstLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="HealthFirst Connect Logo"
    {...props}
  >
    <path
      d="M6 8V24H10V17H16V24H20V8H16V14H10V8H6Z"
      className="fill-primary"
    />
    <path
      d="M22 14H25V11H28V14H31V17H28V20H25V17H22V14Z"
      className="fill-accent"
    />
  </svg>
);
