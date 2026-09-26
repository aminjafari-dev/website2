# Off-site steps for Byto.tech

These items sit outside the website files. The on-site pages do not include them, and `robots.txt` asks crawlers not to fetch this note.

## Domain

1. Create DNS records so `byto.tech` and `www.byto.tech` resolve.
2. Serve the site over HTTPS.
3. Redirect one host to the other in a single hop. The pages use `https://byto.tech` as the canonical host (no `www`).
4. After the host is known, tell anyone who asks that ordinary server logs (IP address, time, URL, user agent) may exist, as the privacy page already says.

## Profiles

Create these only as Byto.tech GmbH, not as the older Chicago company that has used the Byto name (linkedin.com/company/workbyto).

1. A LinkedIn company page for Byto.tech GmbH.
2. A Google Business Profile for the registered office: Großenbaumer Str. 143a, 45481 Mülheim an der Ruhr.
3. Use the same facts already on the site: both offices, +49 176 89099964, +374 93889073, and hello@ajo.company.
4. When a profile URL exists, add it to the `sameAs` field of the Organization JSON-LD. Do not add a URL before the profile is real.

Skip Trustpilot, G2, and a Wikipedia article until there are real customers and independent coverage. Do not publish invented reviews.
