# Hostel Rasoi — iOS build notes

Single-page offline cooking guide (102 mild North Indian recipes for students) wrapped with Capacitor 8.

- Bundle ID: `in.co.pcssolutions.hostelrasoi` (ASC bundle id 32WQ47J2V6)
- Display name: Hostel Rasoi · Store name: "Hostel Rasoi: 102 Easy Recipes"
- Web content: `www/index.html` (self-contained, no network calls)
- Custom `RasoiViewController` (CAPBridgeViewController subclass) in AppDelegate.swift — enables edge-swipe back and avoids the stock-Capacitor 4.3(a) fingerprint
- `ITSAppUsesNonExemptEncryption=false` in Info.plist
- Signing: cert C4U99ML96C + profile "hostelrasoi appstore profile" (`hostelrasoi_appstore_profile.mobileprovision`) — fetch into Codemagic identities as `hostelrasoi_appstore_profile`
- Build: Codemagic `ios-release` workflow (mac_mini_m2), auto-publishes to TestFlight
- ASC helper scripts: asc-register / asc-finalize / asc-listing / asc-screenshots / asc-attach / asc-buildpoll / asc-buildcheck / asc-submit (all take Issuer ID as argv[2])
- Privacy policy: `hostelrasoi-privacy-policy.html` → host at https://pcssolutions.co.in/hostelrasoi-privacy-policy.html
