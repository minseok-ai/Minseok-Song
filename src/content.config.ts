import { defineCollection } from "astro:content";
import {
  contactSchema,
  pageSchema,
  projectSchema
} from "./lib/schemas/content";

const pages = defineCollection({
  type: "data",
  schema: pageSchema
});

const projects = defineCollection({
  type: "data",
  schema: projectSchema
});

const contacts = defineCollection({
  type: "data",
  schema: contactSchema
});

export const collections = {
  pages,
  projects,
  contacts
};
