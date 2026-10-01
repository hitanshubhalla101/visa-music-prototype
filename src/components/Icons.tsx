import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
});

export const IconArrow = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconBack = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
export const IconCopy = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" /></svg>;
export const IconCheck = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const IconShield = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>;
export const IconCard = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3" /></svg>;
export const IconClock = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
export const IconTicket = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4V7.5z" /><path d="M14 6v12" strokeDasharray="2 2.2" /></svg>;
export const IconStar = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" /></svg>;
export const IconUsers = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16 14.2c2.2.2 3.9 1.8 4.4 4.3" /></svg>;
export const IconLock = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="2.2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
export const IconAlert = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 4l9 15.5H3L12 4z" /><path d="M12 10v4M12 17h.01" /></svg>;
export const IconX = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconInfo = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></svg>;
export const IconGlobe = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5S9.6 6.1 12 3.5z" /></svg>;
export const IconSliders = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>;
export const IconMail = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="2.2" /><path d="M4 7l8 6 8-6" /></svg>;
export const IconPin = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>;
export const IconCalendar = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></svg>;
export const IconMusic = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>;
export const IconRefresh = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4" /></svg>;
export const IconChevron = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 9l6 6 6-6" /></svg>;
export const IconPresent = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4" /></svg>;
