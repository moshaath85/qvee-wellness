# QVee Mindbody setup

The site is prepared for Mindbody links but no studio account or live checkout is configured.

1. Confirm all package prices, 30-day memberships, freezing rules, Guest Pass rules and yoga access in Mindbody.
2. Add the HTTPS studio schedule URL to `scheduleUrl` in `booking-config.js`.
3. Add the HTTPS purchase URL for each specific plan under `plans`. Use your own studio links, never Mindbody's general homepage.
4. Run `npm run build`. Deploy `dist/` only.
5. Verify every plan opens the matching product and total in Mindbody. Test purchase/booking confirmation before launch.

Without a configured URL, plan buttons open an email enquiry and the schedule section says booking is coming soon. No purchase or reservation is claimed.

Public configuration contains URLs only. Never put API keys, credentials or client data in this file.

Prices on the site exclude VAT. Match this treatment in Mindbody before launch.

Still to confirm with the studio: package validity; Guest Pass quantity/conditions; how yoga access uses credits; monthly renewal rules; freeze notice and per-year limits. The site does not invent these terms.

If using embedded widgets instead of links later, update CSP only for the exact origins supplied by Mindbody and test the embedded booking flow. Mindbody feature availability depends on the purchased subscription.
