/**
 * The night skies of the dream map: the glow behind everything, the colours of the dreams, how the stars and stipple look.
 * They live in their own file so the interpreter page can read a sky's colours for the dither transition into the map without
 * loading the map.
 */

export const YELLOW = '#F3F35C';
export const INK = '#060A15';

/** Nebula hues, one per dream: [core, mid, edge]. */
export const NEBULA: [string, string, string][] = [
  ['#FFF3D9', '#FF9B7A', '#D6336C'],
  ['#E6FFFB', '#5CD9D0', '#1B7FA6'],
  ['#FFF6D6', '#FFC85C', '#E0662B'],
  ['#EAF2FF', '#6FA3FF', '#2B3FB5'],
  ['#FFE9F2', '#FF7EB0', '#B02A5E'],
];

/** A backdrop is a whole night: the glow behind everything, the colours of the dreams, how the stars and stipple look. */
export interface Backdrop {
  id: string;
  name: string;
  bg: string;
  palette: [string, string, string][];
  starBright: number;
  starSize: number;
  magLimit: number;
  tint: string; // the colour of the drifting stipple
  accent: string; // flecks and chunky dots
  stipple: number; // how strong the stipple is
  swatch: string;
}
export const BACKDROPS: Backdrop[] = [
  {
    id: 'nebula',
    name: 'nebula',
    bg: `radial-gradient(ellipse at 22% 18%, rgba(20,56,196,0.78), transparent 58%), radial-gradient(ellipse at 85% 80%, rgba(210,70,110,0.3), transparent 48%), radial-gradient(ellipse at 70% 15%, rgba(20,150,165,0.28), transparent 45%), radial-gradient(ellipse at 15% 88%, rgba(235,140,50,0.2), transparent 45%), ${INK}`,
    palette: NEBULA,
    starBright: 1,
    starSize: 1,
    magLimit: 6.2,
    tint: '#EAF2FF',
    accent: YELLOW,
    stipple: 1,
    swatch: 'linear-gradient(135deg,#1B7FA6,#D6336C,#E0662B)',
  },
  {
    id: 'deep',
    name: 'deep night',
    bg: 'radial-gradient(ellipse at 25% 15%, rgba(24,44,120,0.35), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(20,30,70,0.3), transparent 50%), #02030A',
    palette: [['#F2F6FF', '#8FB0FF', '#2B3FB5'], ['#EAF2FF', '#9FB8E8', '#3A4A80'], ['#FFF6E0', '#E3C27A', '#7A5A22'], ['#E6FFFB', '#7FD0C8', '#1B5F78'], ['#FFF1F6', '#D49AB8', '#6A2A50']],
    starBright: 1.45,
    starSize: 1.15,
    magLimit: 6.2,
    tint: '#CFE0FF',
    accent: '#BFD2FF',
    stipple: 0.55,
    swatch: 'linear-gradient(135deg,#02030A,#18307A)',
  },
  {
    id: 'starry',
    name: 'starry',
    bg: 'linear-gradient(112deg, transparent 26%, rgba(170,185,255,0.10) 41%, rgba(255,238,215,0.22) 50%, rgba(170,185,255,0.10) 59%, transparent 74%), radial-gradient(ellipse at 20% 15%, rgba(40,60,160,0.5), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(30,90,140,0.35), transparent 50%), #060A22',
    palette: [['#FFFBEA', '#FFD98A', '#C9831E'], ['#FFFFFF', '#BFD6FF', '#4A63B8'], ['#FFF4D6', '#FFB870', '#B24A1A'], ['#F2FFFB', '#9EE6D6', '#2C7A74'], ['#FFF0F0', '#FFB3A6', '#A8402E']],
    starBright: 1.9,
    starSize: 1.4,
    magLimit: 6.5,
    tint: '#FFF6E0',
    accent: '#FFE9A8',
    stipple: 0.8,
    swatch: 'linear-gradient(135deg,#060A22,#FFE9A8)',
  },
  {
    id: 'cobalt',
    name: 'cobalt',
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(80,120,255,0.55), transparent 62%), radial-gradient(ellipse at 20% 100%, rgba(10,20,140,0.6), transparent 55%), #1A2FD4',
    palette: [['#FFFFFF', '#E4ECFF', '#8FA6FF'], ['#FFFFE6', '#F3F35C', '#B8B214'], ['#FFFFFF', '#CFE0FF', '#5C7DFF'], ['#FFFDE0', '#FFF07A', '#C9A91A'], ['#F5F8FF', '#BDD0FF', '#3B5CE8']],
    starBright: 1.1,
    starSize: 1,
    magLimit: 5.6,
    tint: '#FFFFFF',
    accent: YELLOW,
    stipple: 1.7,
    swatch: 'linear-gradient(135deg,#1A2FD4,#F3F35C)',
  },
  {
    id: 'ember',
    name: 'ember',
    bg: 'radial-gradient(ellipse at 20% 20%, rgba(255,90,40,0.38), transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(190,30,60,0.36), transparent 50%), radial-gradient(ellipse at 60% 10%, rgba(255,170,60,0.2), transparent 45%), #0C0507',
    palette: [['#FFF1D6', '#FF9B5C', '#C2381A'], ['#FFE9D9', '#FF7A5C', '#A52424'], ['#FFF6D6', '#FFC85C', '#D4631A'], ['#FFE8EC', '#FF8FA3', '#9C2A48'], ['#FFF3E0', '#FFB070', '#8A3A14']],
    starBright: 1.1,
    starSize: 1,
    magLimit: 6.1,
    tint: '#FFE9D6',
    accent: '#FFB45C',
    stipple: 1,
    swatch: 'linear-gradient(135deg,#C2381A,#FFC85C)',
  },
  {
    id: 'aurora',
    name: 'aurora',
    bg: 'radial-gradient(ellipse at 25% 20%, rgba(20,170,140,0.4), transparent 55%), radial-gradient(ellipse at 80% 15%, rgba(40,110,200,0.35), transparent 50%), radial-gradient(ellipse at 60% 95%, rgba(30,160,90,0.28), transparent 50%), #03100E',
    palette: [['#EAFFF6', '#5CE6B4', '#14806A'], ['#E6FBFF', '#5CC8E6', '#1B6AA6'], ['#F2FFE8', '#B6F06A', '#3F8A1C'], ['#E6FFFB', '#7FF0D8', '#1F7A80'], ['#F0FFFB', '#8FD9FF', '#2A5FA0']],
    starBright: 1.15,
    starSize: 1.05,
    magLimit: 6.2,
    tint: '#E6FFF6',
    accent: '#9FF2D0',
    stipple: 0.9,
    swatch: 'linear-gradient(135deg,#14806A,#5CC8E6)',
  },
  // the next two are taken from NASA's own pictures: the cosmic cliffs (webb) and the pillars of creation (hubble)
  {
    id: 'cliffs',
    name: 'cosmic cliffs',
    bg: `radial-gradient(ellipse at 50% 8%, rgba(30,100,230,0.78), transparent 62%), radial-gradient(ellipse at 12% 22%, rgba(16,52,160,0.6), transparent 50%), radial-gradient(ellipse at 78% 100%, rgba(236,150,50,0.62), transparent 62%), radial-gradient(ellipse at 20% 96%, rgba(190,80,34,0.55), transparent 55%), radial-gradient(ellipse at 52% 70%, rgba(150,60,36,0.3), transparent 55%), ${INK}`,
    palette: [['#FFF1D6', '#F4B35C', '#B2531F'], ['#FFE2C2', '#E08A3E', '#8A3A1A'], ['#E8F1FF', '#6FA2F2', '#2250B8'], ['#FFD9A8', '#D9722F', '#7A2E18'], ['#F4F8FF', '#9CC0FF', '#3B6FD6']],
    starBright: 1.35,
    starSize: 1.15,
    magLimit: 6.3,
    tint: '#FFF0DA',
    accent: '#F7B955',
    stipple: 1,
    swatch: 'linear-gradient(180deg,#2250B8,#6FA2F2 42%,#E08A3E 60%,#B2531F)',
  },
  {
    id: 'pillars',
    name: 'pillars of creation',
    bg: `radial-gradient(ellipse at 60% 30%, rgba(34,128,170,0.72), transparent 66%), radial-gradient(ellipse at 90% 55%, rgba(24,80,150,0.55), transparent 55%), radial-gradient(ellipse at 6% 4%, rgba(70,60,110,0.34), transparent 45%), radial-gradient(ellipse at 14% 100%, rgba(176,138,40,0.55), transparent 55%), radial-gradient(ellipse at 52% 92%, rgba(150,70,34,0.42), transparent 50%), ${INK}`,
    palette: [['#E6FBFF', '#5CC0D2', '#1F6E8E'], ['#FFF0CF', '#D9A84A', '#7A4A1C'], ['#DDEEFF', '#6C9CD8', '#2C5894'], ['#FFE2C4', '#C77A44', '#6A2E1A'], ['#EAFFF2', '#8FD0A8', '#2E7A66']],
    starBright: 1.3,
    starSize: 1.1,
    magLimit: 6.3,
    tint: '#E4F4FA',
    accent: '#E8C25E',
    stipple: 1,
    swatch: 'linear-gradient(180deg,#1F6E8E,#5CC0D2 45%,#C77A44 80%,#B08A28)',
  },
  // from the Hubble 25th anniversary images: the crab nebula, cassiopeia a and stephan's quintet
  {
    id: 'crab',
    name: 'crab nebula',
    bg: `radial-gradient(ellipse at 52% 46%, rgba(70,200,230,0.58), transparent 50%), radial-gradient(ellipse at 84% 22%, rgba(232,112,50,0.5), transparent 54%), radial-gradient(ellipse at 18% 80%, rgba(130,176,70,0.4), transparent 52%), radial-gradient(ellipse at 8% 16%, rgba(190,82,40,0.32), transparent 46%), radial-gradient(ellipse at 90% 90%, rgba(210,100,50,0.28), transparent 44%), ${INK}`,
    palette: [['#E6FFFF', '#58D0E8', '#1F7EA6'], ['#FFF0D8', '#F08A44', '#A8401E'], ['#F2FFD8', '#B6D86A', '#5E8A2A'], ['#FFE2C4', '#E0703A', '#8A2E18'], ['#EAFFF6', '#7FE4D0', '#2A8A86']],
    starBright: 1.25,
    starSize: 1.1,
    magLimit: 6.2,
    tint: '#E4F8FF',
    accent: '#F0A25A',
    stipple: 1,
    swatch: 'radial-gradient(circle,#58D0E8 0 30%,#B6D86A 45%,#F08A44 75%,#8A2E18)',
  },
  {
    id: 'cassiopeia',
    name: 'cassiopeia a',
    bg: `radial-gradient(ellipse at 48% 38%, rgba(226,124,124,0.36), transparent 52%), radial-gradient(ellipse at 72% 74%, rgba(234,180,94,0.32), transparent 52%), radial-gradient(ellipse at 20% 68%, rgba(196,94,104,0.26), transparent 50%), radial-gradient(ellipse at 40% 8%, rgba(52,112,84,0.34), transparent 52%), #07060A`,
    palette: [['#FFEFE8', '#F2A8A8', '#9A4650'], ['#FFF3D6', '#EBC070', '#9A6A28'], ['#EAFFF0', '#7FC8A0', '#2E7A5A'], ['#FFE6DC', '#E58A86', '#8A3A40'], ['#FFF8EA', '#F4D9A0', '#B07A3A']],
    starBright: 1.45,
    starSize: 1.2,
    magLimit: 6.4,
    tint: '#FFF0E6',
    accent: '#EBC070',
    stipple: 0.9,
    swatch: 'linear-gradient(135deg,#07060A,#9A4650 40%,#F2A8A8 62%,#EBC070)',
  },
  {
    id: 'quintet',
    name: 'stephan’s quintet',
    bg: `radial-gradient(ellipse at 28% 26%, rgba(110,172,214,0.5), transparent 50%), radial-gradient(ellipse at 76% 22%, rgba(238,172,100,0.46), transparent 48%), radial-gradient(ellipse at 62% 62%, rgba(248,194,124,0.5), transparent 52%), radial-gradient(ellipse at 22% 92%, rgba(242,162,72,0.4), transparent 44%), ${INK}`,
    palette: [['#EAF6FF', '#7DB8E0', '#2E6A9A'], ['#FFF3DE', '#F4C27C', '#B0662A'], ['#FFE9D0', '#EBA45E', '#8A4A1E'], ['#F2F8FF', '#A8D0F0', '#4A82B8'], ['#FFF8EC', '#F8DBA8', '#C98A44']],
    starBright: 1.3,
    starSize: 1.15,
    magLimit: 6.3,
    tint: '#FFF2E2',
    accent: '#F4C27C',
    stipple: 1,
    swatch: 'linear-gradient(135deg,#2E6A9A,#7DB8E0 35%,#F4C27C 65%,#B0662A)',
  },
];

/** The three colours of each backdrop, used to draw its pixel-art swatch. */
export const PX: Record<string, [string, string, string]> = {
  nebula: ['#1B7FA6', '#D6336C', '#E0662B'],
  deep: ['#02030A', '#18307A', '#8FB0FF'],
  starry: ['#060A22', '#FFE9A8', '#BFD6FF'],
  cobalt: ['#1A2FD4', '#F3F35C', '#FFFFFF'],
  ember: ['#C2381A', '#FF7A5C', '#FFC85C'],
  aurora: ['#14806A', '#5CC8E6', '#B6F06A'],
  cliffs: ['#2250B8', '#6FA2F2', '#E08A3E'],
  pillars: ['#1F6E8E', '#5CC0D2', '#C77A44'],
  crab: ['#1F7EA6', '#58D0E8', '#F08A44'],
  cassiopeia: ['#9A4650', '#F2A8A8', '#EBC070'],
  quintet: ['#2E6A9A', '#7DB8E0', '#F4C27C'],
};
