/*
 * The songs the media player on /about knows about.
 *
 * To add music: put the file in public/about/music/ and add a line below. mp3, m4a, ogg and wav all play.
 * Only add music you have the right to host; anything else can still be played by whoever is visiting, from their
 * own device, with file > open in the player or by dropping a song onto it. Those never leave their browser.
 */
export interface Track {
  title: string;
  artist?: string;
  src: string;
}

export const TRACKS: Track[] = [
  { title: 'virtual insanity', artist: 'jamiroquai', src: '/about/music/virtual-insanity.mp3' },
  { title: 'call it fate, call it karma', artist: 'the strokes', src: '/about/music/call-it-fate-call-it-karma.mp3' },
  { title: 'julia dream', artist: 'pink floyd', src: '/about/music/julia-dream.mp3' },
  { title: 'violent crimes', artist: 'kanye west', src: '/about/music/violent-crimes.mp3' },
  { title: 'coffin nails', artist: 'mf doom', src: '/about/music/coffin-nails.mp3' },
  { title: 'midnight pretenders', artist: 'tomoko aran', src: '/about/music/midnight-pretenders.mp3' },
  { title: 'lady brown', artist: 'nujabes', src: '/about/music/lady-brown.mp3' },
  { title: 'playing god', artist: 'paramore', src: '/about/music/playing-god.mp3' },
  // { title: 'sunflower', artist: 'rex orange county', src: '/about/music/sunflower.mp3' },
];
