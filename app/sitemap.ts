import type { MetadataRoute } from 'next';

/**
 * Two pages, which is the whole site: slow garden is one screen that changes
 * state rather than a set of routes, so there is nothing else to list.
 *
 * A sitemap this short still earns its place — it is how a crawler learns the
 * canonical host and that these two URLs are the ones that matter, rather than
 * inferring it from whatever link it happened to arrive on.
 *
 * `/privacy` and `/terms` carry a higher change frequency than its priority suggests
 * because it is the page that must never go stale: it is the one that changes
 * whenever a data practice does.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://slowww.garden',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://slowww.garden/privacy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://slowww.garden/terms',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
