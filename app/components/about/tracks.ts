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
  // { title: 'sunflower', artist: 'rex orange county', src: '/about/music/sunflower.mp3' },
];
