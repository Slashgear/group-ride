// @ts-check
import starlight from "@astrojs/starlight"
import { defineConfig } from "astro/config"
import { remarkMermaid } from "./src/plugins/remark-mermaid.mjs"

export default defineConfig({
  site: "https://group-ride.slashgear.dev",
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
  integrations: [
    starlight({
      title: "group-ride",
      description: "Discord & Telegram bot to organise group cycling rides",
      logo: {
        src: "./public/favicon.svg",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/Slashgear/group-ride",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Overview", slug: "docs" },
            { label: "Installation", slug: "docs/installation" },
            { label: "Configuration", slug: "docs/configuration" },
          ],
        },
        {
          label: "Adapters",
          items: [
            {
              label: "Discord",
              items: [
                { label: "Overview", slug: "docs/adapters/discord" },
                { label: "Installation", slug: "docs/adapters/discord/installation" },
              ],
            },
            {
              label: "Telegram",
              items: [
                { label: "Overview", slug: "docs/adapters/telegram" },
                { label: "Installation", slug: "docs/adapters/telegram/installation" },
              ],
            },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Commands", slug: "docs/commands" },
            { label: "Architecture", slug: "docs/architecture" },
            { label: "Deployment", slug: "docs/deployment" },
            { label: "Troubleshooting", slug: "docs/troubleshooting" },
            { label: "Changelog", slug: "docs/changelog" },
          ],
        },
      ],
      customCss: ["./src/styles/docs.css"],
      head: [
        {
          tag: "meta",
          attrs: { property: "og:image", content: "https://group-ride.slashgear.dev/og.jpeg" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:image", content: "https://group-ride.slashgear.dev/og.jpeg" },
        },
        {
          tag: "script",
          attrs: { type: "module" },
          content: `
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
            mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
          `,
        },
      ],
    }),
  ],
})
