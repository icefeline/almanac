/*
 * The songs the media player on /about knows about.
 *
 * To add music: put the file in public/about/music/ and add a line below. mp3, m4a, ogg and wav all play.
 * Only add music you have the right to host; anything else can still be played by whoever is visiting, from their
 * own device, with file > open in the player or by dropping a song onto it. Those never leave their browser.
 */
import {
  THE_WORD_II,
  CALL_IT_FATE_CALL_IT_KARMA,
  COFFIN_NAILS,
  JULIA_DREAM,
  LADY_BROWN,
  MIDNIGHT_PRETENDERS,
  PLAYING_GOD,
  VIOLENT_CRIMES,
  VIRTUAL_INSANITY,
} from './beats';

export interface Track {
  title: string;
  artist?: string;
  src: string;
  /** Beat times in seconds, measured ahead of time; without them the player listens for the beat as it plays. */
  beats?: number[];
  /** A song the visitor picked from their own device: read from the file itself, never fetched. */
  file?: File;
}

export const TRACKS: Track[] = [
  { title: 'virtual insanity', artist: 'jamiroquai', src: '/about/music/virtual-insanity.mp3', beats: VIRTUAL_INSANITY },
  { title: 'call it fate, call it karma', artist: 'the strokes', src: '/about/music/call-it-fate-call-it-karma.mp3', beats: CALL_IT_FATE_CALL_IT_KARMA },
  { title: 'julia dream', artist: 'pink floyd', src: '/about/music/julia-dream.mp3', beats: JULIA_DREAM },
  { title: 'violent crimes', artist: 'kanye west', src: '/about/music/violent-crimes.mp3', beats: VIOLENT_CRIMES },
  { title: 'coffin nails', artist: 'mf doom', src: '/about/music/coffin-nails.mp3', beats: COFFIN_NAILS },
  { title: 'midnight pretenders', artist: 'tomoko aran', src: '/about/music/midnight-pretenders.mp3', beats: MIDNIGHT_PRETENDERS },
  { title: 'lady brown', artist: 'nujabes', src: '/about/music/lady-brown.mp3', beats: LADY_BROWN },
  { title: 'playing god', artist: 'paramore', src: '/about/music/playing-god.mp3', beats: PLAYING_GOD },
  { title: 'the word II', artist: 'shigeo sekito', src: '/about/music/the-word-ii.mp3', beats: THE_WORD_II },
  // { title: 'sunflower', artist: 'rex orange county', src: '/about/music/sunflower.mp3' },
];
