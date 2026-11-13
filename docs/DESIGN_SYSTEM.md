# Interface implementation

The existing React/Vite application and Go API are retained. The source-managed shadcn/ui `new-york` components were generated from the official registry, then configured for this project's alias and theme. They use Radix UI behavior and Lucide SVG icons. This is an integration of UI primitives, not a claim that an entire shadcn Blocks application has been installed.

Used components: Button, Input, Dialog, Tabs, Slider, Switch and Tooltip. The content editor has keyboard-accessible create/edit/delete/detail dialogs, a server-derived overview, explicit single-resource reads and an administrator-only role action. Backend ownership checks remain authoritative; hiding a button is not authorization.

Inter Variable and Newsreader Variable are self-hosted through Fontsource packages. Their CSS includes `@font-face`, `font-display: swap` and Unicode subsets, including Lithuanian characters. `src/main.tsx` imports the fonts; `src/theme.css` declares Tailwind tokens; `src/design-system.css` applies the system. Fonts do not depend on a third-party request at runtime. Fontsource fonts retain their OFL licenses in the installed packages; shadcn/ui is MIT-licensed.

The poker arena is custom domain UI, separate from its engine. It displays actual stacks, current-street contributions, the pot, dealer button, board and all-in/fold states. Private opponent cards are revealed only at an eligible showdown. A container query switches to a compact seat layout when the table surface is narrower than 620px, including tablet screens with a desktop sidebar. The table is tested with one through five opponents at 320, 390, 768 and 1440px, checking overlap and document overflow. Reduced-motion preferences are respected.

Heavy calculations stay in the worker. The tooltip provider is scoped to the simulator rather than the application's entry point. Visual effects are CSS-based and do not add a 3D engine, autoplay video or a continuous rendering loop.

UI tests use mocked API responses for repeatable interface states; server integration tests and Newman separately verify the actual MariaDB-backed endpoints. Screenshots in the report illustrate test states, not real student or production account data.
