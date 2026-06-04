import { defineCollection } from "astro:content";
import {
  contactSchema,
  pageSchema,
  projectSchema,
  writingSchema
} from "./lib/schemas/content";

const pages = defineCollection({
  type: "data",
  schema: pageSchema
});

const projects = defineCollection({
  type: "data",
  schema: projectSchema
});

const writings = defineCollection({
  type: "data",
  schema: writingSchema
});

const contacts = defineCollection({
  type: "data",
  schema: contactSchema
});

export const collections = {
  pages,
  projects,
  writings,
  contacts
};
