import { z } from "astro/zod";

export const statusSchema = z.enum(["draft", "published", "archived"]);

export const layoutTypeSchema = z.enum([
  "profile",
  "product",
  "projectIndex",
  "writingIndex",
  "contact",
  "blank"
]);

export const embedProviderSchema = z.enum([
  "canva",
  "googleSlides",
  "figma",
  "pdf",
  "generic"
]);

const blockBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  hidden: z.boolean().default(false)
});

export const textBlockSchema = blockBaseSchema.extend({
  type: z.literal("text"),
  body: z.string().default(""),
  variant: z.enum(["body", "lead", "small"]).default("body")
});

export const calloutBlockSchema = blockBaseSchema.extend({
  type: z.literal("callout"),
  body: z.string().default(""),
  tone: z.enum(["default", "quiet", "important"]).default("default")
});

export const timelineBlockSchema = blockBaseSchema.extend({
  type: z.literal("timeline"),
  events: z.array(
    z.object({
      date: z.string().min(1),
      title: z.string().min(1),
      body: z.string().default(""),
      href: z.string().url().optional()
    })
  ).default([])
});

export const deckEmbedBlockSchema = blockBaseSchema.extend({
  type: z.literal("deckEmbed"),
  provider: embedProviderSchema,
  src: z.string().url(),
  aspectRatio: z.string().regex(/^\d+\/\d+$/).default("16/9"),
  caption: z.string().optional(),
  fallbackUrl: z.string().url().optional(),
  allowFullscreen: z.boolean().default(true)
});

export const galleryBlockSchema = blockBaseSchema.extend({
  type: z.literal("gallery"),
  items: z.array(
    z.object({
      src: z.string().min(1),
      alt: z.string().default(""),
      caption: z.string().optional()
    })
  ).default([])
});

export const linkBlockSchema = blockBaseSchema.extend({
  type: z.literal("link"),
  links: z.array(
    z.object({
      label: z.string().min(1),
      href: z.string().url(),
      description: z.string().optional()
    })
  ).default([])
});

export const statsBlockSchema = blockBaseSchema.extend({
  type: z.literal("stats"),
  stats: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      description: z.string().optional()
    })
  ).default([])
});

export const aboutBlockSchema = z.discriminatedUnion("type", [
  textBlockSchema,
  calloutBlockSchema,
  timelineBlockSchema,
  deckEmbedBlockSchema,
  galleryBlockSchema,
  linkBlockSchema,
  statsBlockSchema
]);

export const pageSchema = z.object({
  title: z.string().min(1),
  navLabel: z.string().min(1),
  description: z.string().default(""),
  order: z.number().int().nonnegative(),
  path: z.string().startsWith("/"),
  layoutType: layoutTypeSchema,
  status: statusSchema.default("draft"),
  hidden: z.boolean().default(false),
  hero: z.object({
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    subtitle: z.string().default("")
  }).optional(),
  blocks: z.array(aboutBlockSchema).default([]),
  cta: z.object({
    label: z.string().min(1),
    href: z.string().min(1)
  }).optional()
});

export const projectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().default(""),
  order: z.number().int().nonnegative(),
  status: statusSchema.default("draft"),
  hidden: z.boolean().default(false),
  year: z.string().optional(),
  tags: z.array(z.string()).default([]),
  links: z.array(
    z.object({
      label: z.string().min(1),
      href: z.string().url()
    })
  ).default([]),
  visual: z.enum(["graph", "deck", "console", "paper", "blank"]).default("blank")
});

export const writingSchema = z.object({
  title: z.string().min(1),
  summary: z.string().default(""),
  order: z.number().int().nonnegative(),
  status: statusSchema.default("draft"),
  hidden: z.boolean().default(false),
  date: z.string().optional(),
  tags: z.array(z.string()).default([]),
  body: z.string().default("")
});

export const contactSchema = z.object({
  title: z.string().min(1),
  channels: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      href: z.string().url().optional(),
      copyable: z.boolean().default(false),
      visible: z.boolean().default(true)
    })
  ).default([])
});

export type Status = z.infer<typeof statusSchema>;
export type LayoutType = z.infer<typeof layoutTypeSchema>;
export type AboutBlock = z.infer<typeof aboutBlockSchema>;
export type PageContent = z.infer<typeof pageSchema>;
export type ProjectContent = z.infer<typeof projectSchema>;
export type WritingContent = z.infer<typeof writingSchema>;
export type ContactContent = z.infer<typeof contactSchema>;
