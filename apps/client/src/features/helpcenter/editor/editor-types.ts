export type EditorDocument = {
  kind: "article" | "update";
  id: string;
  group: string;
  parentId?: string | null;
  isDraft?: boolean;
  title: string;
  description: string;
  body: string;
  audience: string;
  outcome: string;
  tags: string[];
  slug: string;
  changes: {
    id: string;
    title: string;
    description: string;
    linkLabels: Record<string, string>;
  }[];
  highlights?: string[];
  revision: string;
  isNew: boolean;
  savedAt?: string;
};
export type EditorCatalog = {
  access?: { mode: "local" | "session"; capabilities: string[] };
  token: string;
  groups: { id: string; title: string }[];
  documents: {
    kind: "article" | "update";
    id: string;
    title: string;
    group: string;
    parentId?: string | null;
    isDraft?: boolean;
    date?: string;
    hasDraft: boolean;
    isNew?: boolean;
  }[];
};
export type HistoryEntry = { id: string; at: string; before: EditorDocument };
