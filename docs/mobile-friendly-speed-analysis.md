# Mobile and Performance Verification

Updated: 2026-11-09. Environment: local React/Vite application, Go/Gin API and MariaDB. No new production Lighthouse score is claimed.

## Responsive checks

`npm run test:browser` checks 60 route/viewport combinations at 320, 390, 768 and 1440px, including the public page, account screens, study pages, calculators and simulation views. It also exercises lesson persistence, account-separated notes, quiz scoring and mistake retries, duplicate-card validation, saved setup launch, all-in settlement and mobile navigation.

An additional 20 table layouts cover one through five AI opponents at the same four widths. They reject horizontal document overflow and intersections between opponent seats, the hero and the board. The narrower table layout is selected by a 620px container query, so a tablet with a desktop sidebar does not accidentally use a desktop-sized table. Editor CRUD/detail dialogs, keyboard dismissal and the administrator role action are checked separately.

All checks passed without runtime page errors. These are automated geometry/workflow checks, not a complete accessibility audit or proof of usability for every assistive technology.

## Performance implementation

- Route code is lazy-loaded; showdown simulations and opponent decisions run in a Web Worker.
- The landing image is a 141.38 kB WebP rather than an autoplay video.
- Self-hosted Inter and Newsreader variable fonts use font-display swap and Unicode subsets. The browser fetches the subsets and styles needed for the actual text.
- The tooltip provider is local to the simulator; there is no continuous canvas/3D render loop.
- The production build completed successfully. The entry JavaScript is approximately 294.49 kB raw / 97.05 kB gzip; shared CSS is 116.63 kB raw / 25.09 kB gzip. Other route chunks and fonts add traffic on demand. UI libraries increase bundle size, so their presence alone must not be described as a speed improvement.

## Remaining measurements

Run Lighthouse against the final production HTTPS URL using mobile emulation, repeat at least three times and report the median, device/network settings and build version. Record FCP, LCP, TBT/INP where supported, CLS and transferred bytes. A local Vite development-server screenshot or a successful unit test is not a substitute for those measurements.

The earlier screenshots supplied by the student describe an earlier build and must not be reused as this build's measured result.

## Security dependency note

After compatible npm audit fixes, the production dependency audit reported zero known vulnerabilities. Seven moderate findings remain in the development lint dependency chain (minimatch/typescript-eslint). No forced major-version/downgrade fix was applied. This is not a claim that the application is free from all security risks.
