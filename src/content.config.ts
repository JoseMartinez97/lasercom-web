import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

// Legal pages, Spanish only: the owner's own texts from the previous site
const legal = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/legal" }),
  schema: z.object({ title: z.string() }),
})

// Guide bodies, one file per language: <lang>/<guide id>.md (lib/guides.ts)
const guides = defineCollection({
  loader: glob({ pattern: "*/*.md", base: "./src/content/guides" }),
  schema: z.object({ title: z.string() }),
})

export const collections = { legal, guides }
