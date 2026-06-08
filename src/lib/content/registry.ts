import type {
  ContactContent,
  PageContent,
  ProjectContent,
  WritingContent
} from "../schemas/content";

export type PageEntry = {
  id: string;
  data: PageContent;
};

export type ProjectEntry = {
  id: string;
  data: ProjectContent;
};

export type WritingEntry = {
  id: string;
  data: WritingContent;
};

export type ContactEntry = {
  id: string;
  data: ContactContent;
};

const pageModules = import.meta.glob("../../content/pages/*.json", {
  eager: true,
  import: "default"
}) as Record<string, PageContent>;

const projectModules = import.meta.glob("../../content/projects/*.json", {
  eager: true,
  import: "default"
}) as Record<string, ProjectContent>;

const writingModules = import.meta.glob("../../content/writings/*.json", {
  eager: true,
  import: "default"
}) as Record<string, WritingContent>;

const contactModules = import.meta.glob("../../content/contacts/*.json", {
  eager: true,
  import: "default"
}) as Record<string, ContactContent>;

const entryIdFromPath = (filePath: string) =>
  filePath.split("/").pop()?.replace(/\.json$/, "") ?? filePath;

const entriesFromModules = <TData>(
  modules: Record<string, TData>
): Array<{ id: string; data: TData }> =>
  Object.entries(modules).map(([filePath, data]) => ({
    id: entryIdFromPath(filePath),
    data
  }));

export const pageEntries: PageEntry[] = entriesFromModules(pageModules);

export const pageEntriesById = new Map(
  pageEntries.map((entry) => [entry.id, entry.data])
);

export const projectEntries: ProjectEntry[] = entriesFromModules(projectModules);

export const writingEntries: WritingEntry[] = entriesFromModules(writingModules);

export const contactEntries: ContactEntry[] = entriesFromModules(contactModules);
