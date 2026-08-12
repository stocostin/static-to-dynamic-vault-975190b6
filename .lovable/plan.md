# Custom domain shows "Index of /" — diagnosis and next steps

## What I found

Checked from outside your network just now:

- `shachavirtimber.com` resolves to **185.158.133.1** (Lovable) at the authoritative nameservers (`ns3/ns4.novacloud.co.ke`) and returns **HTTP 200** with the real site.
- `www.shachavirtimber.com` is a CNAME to the root and correctly **302s** to `https://shachavirtimber.com/`.
- The Lovable ownership TXT record (`lovable_verify=...`) is present.
- The zone's serial is `2026081214` — the DNS change was made **today**, and the zone's TTLs are long (14400 s = 4 h for records, 21600 s = 6 h for NS).

The LiteSpeed "Index of /" page you see is your **previous cPanel/LiteSpeed host**. Nothing in the app or its DNS is wrong — your devices are still being handed the old IP from a cache that hasn't expired yet. Because every device on your network shares the same ISP resolver (and your router's cache), they all show the stale result together.

## No code changes needed

There is nothing to fix in the project for this. The domain is connected correctly and serving the site.

## Steps to confirm on your side

1. Flush the local caches:
   - Windows: `ipconfig /flushdns` in Command Prompt (Run as administrator)
   - macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
   - Chrome: visit `chrome://net-internals/#dns` and click **Clear host cache**
   - Reboot your router (this clears its DNS cache too)
2. Test bypassing your ISP resolver: temporarily set your device's DNS to `1.1.1.1` / `8.8.8.8`, then reload `https://shachavirtimber.com` in a private window.
3. Independent check: open `https://dnschecker.org/#A/shachavirtimber.com` — every location should read `185.158.133.1`. Any location still showing another IP is just a cache that has not expired.
4. Worst case, the stale entries expire on their own within about 4-6 hours of the DNS change.

## Related item worth doing separately

The site's canonical/`og:url`/sitemap URLs were switched to `https://shachavirtimber.com` but the project has not been published since. Publishing pushes that correction live and lets Google Search Console be re-verified against the correct domain.
