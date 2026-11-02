# laightup UI snapshot

This is a portable source snapshot of the actual components consumed by the laightup frontend. The upstream `components/settings/nav/SettingsSidebar.tsx`, `SettingsPageFrame.tsx` and `PreferencesTab.tsx` use these primitives from `@chainmatics/laightup-glass` (`libs/glass/src/lib`). The documentation management UI now uses the same component family instead of custom native control styling.

Included: settings page header, grouped surfaces and rows, navigation, cards, input, textarea, buttons and icon buttons, switch, select, menu, popover and tooltip dependencies. `SOURCE.json` records the source checkout's commit, original file hashes and adaptations. Hashes identify the working-tree content, including any upstream uncommitted changes. No runtime import points outside this repository.

Integration adaptations:

- CSS `:root` selectors are scoped to `.laightup-management`; named properties remain registered globally. No document-root theme is changed.
- Popovers and tooltips portal into the management root to inherit those scoped tokens.
- A type-only `unknown` bridge in the polymorphic menu satisfies this project's React typings.
- `utility-adapter.css` supplies the small set of Tailwind layout/size utilities composed by GlassButton; this app does not run Tailwind. Component variants and optical recipes remain upstream CSS.
- Menus use a denser white surface and dark selected text for readable overlap over form fields. Reduced motion suppresses decorative transitions/animations.
- Next.js navigation, application authentication and react-intl wrappers are replaced by this app's router, local service and existing German management copy. The wrapper is a composition of the product's primitives, not a claimed full copy of its authenticated settings screen.

The explicit user request to use laightup's actual UI supersedes the design skill's generic prohibition of glass and violet. Do not flatten these components back into unrelated generic admin controls. Update this snapshot deliberately from the source project, review API/CSS changes and rerun build plus keyboard/mobile checks. Never overwrite source-project files during a sync.
