import type { LayoutType } from "../lib/schemas/content";

export type NavigationItem = {
  id: string;
  num: string;
  label: string;
  path: string;
  order: number;
  layoutType: LayoutType;
  hidden: boolean;
  contentEntry: string;
};

export const navigationItems = [
  {
    id: "home",
    num: "00",
    label: "Home",
    path: "/",
    order: 0,
    layoutType: "profile",
    hidden: false,
    contentEntry: "home"
  },
  {
    id: "about",
    num: "01",
    label: "About",
    path: "/about",
    order: 1,
    layoutType: "profile",
    hidden: false,
    contentEntry: "about"
  },
  {
    id: "a1-firms",
    num: "02",
    label: "A1 Firms",
    path: "/A1-Firm",
    order: 2,
    layoutType: "product",
    hidden: false,
    contentEntry: "a1-firms"
  },
  {
    id: "projects",
    num: "03",
    label: "Projects",
    path: "/projects",
    order: 3,
    layoutType: "projectIndex",
    hidden: false,
    contentEntry: "projects"
  },
  {
    id: "contacts",
    num: "04",
    label: "Contacts",
    path: "/contacts",
    order: 4,
    layoutType: "contact",
    hidden: false,
    contentEntry: "contacts"
  }
] satisfies NavigationItem[];

export function visibleNavigationItems() {
  return navigationItems
    .filter((item) => !item.hidden)
    .sort((a, b) => a.order - b.order);
}
