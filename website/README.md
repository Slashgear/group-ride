# group-ride — website

Landing page for the [group-ride](https://github.com/Slashgear/group-ride) Discord & Telegram bot.

Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Structure

```
website/
├── public/
│   ├── favicon.svg       # Favicon (🚴 on blurple background)
│   └── og.svg            # OpenGraph / Twitter card image (1200×630)
├── src/
│   ├── components/
│   │   └── LandingPage.astro   # Full page component (shared between locales)
│   ├── i18n/
│   │   └── translations.ts     # All strings — FR and EN
│   └── pages/
│       ├── index.astro         # / → French (default)
│       └── en/
│           └── index.astro     # /en/ → English
└── astro.config.mjs
```

## Dev

From the monorepo root:

```sh
bun run website        # starts dev server at localhost:4321
```

Or from inside `website/`:

```sh
bun dev
bun build
bun preview
```

## Adding a translation

Edit `src/i18n/translations.ts`. Both the `fr` and `en` objects must implement the full `Translation` interface — TypeScript will tell you if anything is missing.

## Deployment

The site is configured for GitHub Pages at `https://slashgear.github.io/group-ride`.

If you change the deployment URL, update `site` in `astro.config.mjs` so canonical and hreflang tags stay correct.
