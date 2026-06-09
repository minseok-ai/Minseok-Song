import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Status = "draft" | "published" | "archived";
type EmbedProvider = "canva" | "googleSlides" | "figma" | "pdf" | "generic";
type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "code"
  | "embed"
  | "quote"
  | "divider";

type ParagraphBlock = {
  id: string;
  type: "paragraph";
  hidden?: boolean;
  body: string;
  variant: "body" | "lead" | "small";
};

type HeadingBlock = {
  id: string;
  type: "heading";
  hidden?: boolean;
  body: string;
  level: 2 | 3;
};

type ImageBlock = {
  id: string;
  type: "image";
  hidden?: boolean;
  src: string;
  alt: string;
  caption?: string;
};

type CodeBlock = {
  id: string;
  type: "code";
  hidden?: boolean;
  language: string;
  code: string;
};

type EmbedBlock = {
  id: string;
  type: "embed";
  hidden?: boolean;
  provider: EmbedProvider;
  src: string;
  aspectRatio: string;
  caption?: string;
  allowFullscreen: boolean;
};

type QuoteBlock = {
  id: string;
  type: "quote";
  hidden?: boolean;
  body: string;
  cite?: string;
};

type DividerBlock = {
  id: string;
  type: "divider";
  hidden?: boolean;
};

type WritingBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | CodeBlock
  | EmbedBlock
  | QuoteBlock
  | DividerBlock;

type WritingDraft = {
  title: string;
  summary: string;
  order: number;
  status: Status;
  hidden: boolean;
  date?: string;
  tags: string[];
  body: string;
  blocks: WritingBlock[];
};

type ExistingWriting = {
  id: string;
  data: Partial<WritingDraft>;
};

type SaveState = {
  type: "idle" | "saving" | "saved" | "error";
  message: string;
};

type Props = {
  initialWritings?: ExistingWriting[];
};

const STORAGE_KEY = "a1-writing-editor-draft-v1";

const blockLabels: Record<BlockType, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  code: "Code",
  embed: "Embed",
  quote: "Quote",
  divider: "Divider"
};

const blockOptions: Array<{ type: BlockType; label: string }> = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading", label: "Heading" },
  { type: "image", label: "Image" },
  { type: "code", label: "Code" },
  { type: "embed", label: "Embed" },
  { type: "quote", label: "Quote" },
  { type: "divider", label: "Divider" }
];

const embedProviders: EmbedProvider[] = [
  "generic",
  "canva",
  "googleSlides",
  "figma",
  "pdf"
];

const today = () => new Date().toISOString().slice(0, 10);

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

const createBlock = (type: BlockType): WritingBlock => {
  const id = createId(type);

  if (type === "paragraph") {
    return {
      id,
      type,
      body: "",
      variant: "body"
    };
  }

  if (type === "heading") {
    return {
      id,
      type,
      body: "",
      level: 2
    };
  }

  if (type === "image") {
    return {
      id,
      type,
      src: "",
      alt: "",
      caption: ""
    };
  }

  if (type === "code") {
    return {
      id,
      type,
      language: "tsx",
      code: ""
    };
  }

  if (type === "embed") {
    return {
      id,
      type,
      provider: "generic",
      src: "",
      aspectRatio: "16/9",
      caption: "",
      allowFullscreen: true
    };
  }

  if (type === "quote") {
    return {
      id,
      type,
      body: "",
      cite: ""
    };
  }

  return {
    id,
    type: "divider"
  };
};

const createDefaultDraft = (): WritingDraft => ({
  title: "Untitled writing",
  summary: "",
  order: 10,
  status: "draft",
  hidden: false,
  date: today(),
  tags: [],
  body: "",
  blocks: [
    {
      id: "lead",
      type: "paragraph",
      body: "",
      variant: "lead"
    }
  ]
});

const normalizeDraft = (value?: Partial<WritingDraft>): WritingDraft => {
  const base = createDefaultDraft();

  return {
    ...base,
    ...value,
    title: value?.title || base.title,
    summary: value?.summary ?? base.summary,
    order: Number.isInteger(value?.order) ? Number(value?.order) : base.order,
    status: value?.status ?? base.status,
    hidden: Boolean(value?.hidden),
    date: value?.date || base.date,
    tags: Array.isArray(value?.tags) ? value.tags : base.tags,
    body: value?.body ?? base.body,
    blocks: Array.isArray(value?.blocks) ? value.blocks : base.blocks
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

const tagsFromInput = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export default function WritingEditor({ initialWritings = [] }: Props) {
  const [draft, setDraft] = useState<WritingDraft>(() => createDefaultDraft());
  const [slug, setSlug] = useState("untitled-writing");
  const [isReady, setIsReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({
    type: "idle",
    message: "Local draft ready."
  });

  const serializedDraft = useMemo(
    () => JSON.stringify(draft, null, 2),
    [draft]
  );

  const downloadHref = useMemo(
    () =>
      `data:application/json;charset=utf-8,${encodeURIComponent(serializedDraft)}`,
    [serializedDraft]
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          slug?: string;
          draft?: Partial<WritingDraft>;
        };

        setDraft(normalizeDraft(parsed.draft));
        setSlug(parsed.slug || slugify(parsed.draft?.title ?? "") || "untitled-writing");
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        slug,
        draft
      })
    );
  }, [draft, isReady, slug]);

  const setDraftField = <TKey extends keyof WritingDraft>(
    key: TKey,
    value: WritingDraft[TKey]
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value
    }));
  };

  const updateBlock = (id: string, patch: Partial<WritingBlock>) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? ({ ...block, ...patch } as WritingBlock) : block
      )
    }));
  };

  const addBlock = (type: BlockType) => {
    setDraft((current) => ({
      ...current,
      blocks: [...current.blocks, createBlock(type)]
    }));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.blocks.length) {
        return current;
      }

      const blocks = [...current.blocks];
      const [block] = blocks.splice(index, 1);
      blocks.splice(nextIndex, 0, block);

      return {
        ...current,
        blocks
      };
    });
  };

  const duplicateBlock = (index: number) => {
    setDraft((current) => {
      const block = current.blocks[index];
      if (!block) return current;

      const copy = {
        ...block,
        id: createId(block.type)
      } as WritingBlock;

      const blocks = [...current.blocks];
      blocks.splice(index + 1, 0, copy);

      return {
        ...current,
        blocks
      };
    });
  };

  const removeBlock = (index: number) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index)
    }));
  };

  const resetDraft = () => {
    const nextDraft = createDefaultDraft();
    setDraft(nextDraft);
    setSlug(slugify(nextDraft.title) || "untitled-writing");
    setSaveState({
      type: "idle",
      message: "New draft started."
    });
  };

  const loadExisting = (event: ChangeEvent<HTMLSelectElement>) => {
    const entry = initialWritings.find((writing) => writing.id === event.target.value);

    if (!entry) return;

    setDraft(normalizeDraft(entry.data));
    setSlug(entry.id);
    setSaveState({
      type: "idle",
      message: `${entry.id}.json loaded.`
    });
  };

  const handleTitleChange = (value: string) => {
    setDraftField("title", value);

    if (!slug || slug === "untitled-writing") {
      setSlug(slugify(value) || "untitled-writing");
    }
  };

  const copyJson = async () => {
    if (!navigator.clipboard) {
      setSaveState({
        type: "error",
        message: "Clipboard is unavailable in this browser."
      });
      return;
    }

    await navigator.clipboard.writeText(serializedDraft);
    setSaveState({
      type: "saved",
      message: "JSON copied."
    });
  };

  const saveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState({
      type: "saving",
      message: "Saving..."
    });

    try {
      const response = await fetch("/api/admin/writings", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          slug,
          writing: draft
        })
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        path?: string;
        slug?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Save failed.");
      }

      if (result.slug) {
        setSlug(result.slug);
      }

      setSaveState({
        type: "saved",
        message: result.path ? `Saved to ${result.path}.` : "Saved."
      });
    } catch (error) {
      setSaveState({
        type: "error",
        message: error instanceof Error ? error.message : "Save failed."
      });
    }
  };

  return (
    <form className="admin-editor" onSubmit={saveDraft}>
      <div className="admin-commandbar">
        <label>
          <span>Load</span>
          <select defaultValue="" onChange={loadExisting}>
            <option value="" disabled>
              Existing writing
            </option>
            {initialWritings.map((writing) => (
              <option key={writing.id} value={writing.id}>
                {writing.id}
              </option>
            ))}
          </select>
        </label>

        <div className="command-buttons">
          <button type="button" onClick={resetDraft}>
            New
          </button>
          <button type="button" onClick={copyJson}>
            Copy JSON
          </button>
          <a download={`${slug || "writing"}.json`} href={downloadHref}>
            Download
          </a>
          <button type="submit" disabled={saveState.type === "saving"}>
            Save
          </button>
        </div>
      </div>

      <div className="admin-status" data-state={saveState.type}>
        {saveState.message}
      </div>

      <div className="editor-layout">
        <section className="editor-pane" aria-label="Writing editor">
          <div className="field-grid">
            <label className="field-full">
              <span>Title</span>
              <input
                value={draft.title}
                onChange={(event) => handleTitleChange(event.target.value)}
              />
            </label>

            <label>
              <span>Slug</span>
              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
              />
            </label>

            <label>
              <span>Date</span>
              <input
                type="date"
                value={draft.date ?? ""}
                onChange={(event) => setDraftField("date", event.target.value)}
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraftField("status", event.target.value as Status)
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label>
              <span>Order</span>
              <input
                type="number"
                min="0"
                value={draft.order}
                onChange={(event) =>
                  setDraftField("order", Number.parseInt(event.target.value, 10) || 0)
                }
              />
            </label>

            <label className="field-full">
              <span>Summary</span>
              <textarea
                rows={3}
                value={draft.summary}
                onChange={(event) => setDraftField("summary", event.target.value)}
              />
            </label>

            <div className="field-full tags-field-container">
              <label>
                <span>Tags (comma separated)</span>
                <input
                  value={(draft.tags || []).join(", ")}
                  onChange={(event) =>
                    setDraftField("tags", tagsFromInput(event.target.value))
                  }
                  placeholder="AI, Strategy, Review"
                />
              </label>
              {(draft.tags || []).length > 0 && (
                <div className="admin-tag-pills">
                  {(draft.tags || []).map(tag => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <label className="check-field">
              <input
                type="checkbox"
                checked={draft.hidden}
                onChange={(event) => setDraftField("hidden", event.target.checked)}
              />
              <span>Hide from public lists</span>
            </label>
          </div>

          <div className="block-adders" aria-label="Add content blocks">
            {blockOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => addBlock(option.type)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="block-stack">
            {draft.blocks.map((block, index) => (
              <BlockEditor
                key={block.id}
                block={block}
                index={index}
                total={draft.blocks.length}
                onChange={(patch) => updateBlock(block.id, patch)}
                onDuplicate={() => duplicateBlock(index)}
                onMove={(direction) => moveBlock(index, direction)}
                onRemove={() => removeBlock(index)}
              />
            ))}
          </div>
        </section>

        <aside className="preview-pane" aria-label="Writing preview">
          <WritingPreview draft={draft} />
        </aside>
      </div>
    </form>
  );
}

function BlockEditor({
  block,
  index,
  total,
  onChange,
  onDuplicate,
  onMove,
  onRemove
}: {
  block: WritingBlock;
  index: number;
  total: number;
  onChange: (patch: Partial<WritingBlock>) => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const readImage = (event: ChangeEvent<HTMLInputElement>) => {
    if (block.type !== "image") return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      onChange({ src: String(reader.result ?? "") } as Partial<WritingBlock>);
    });
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  };

  return (
    <article className="block-editor">
      <header className="block-toolbar">
        <div>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{blockLabels[block.type]}</strong>
        </div>
        <div className="block-actions">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} title="Move Up">
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title="Move Down"
          >
            ↓
          </button>
          <button type="button" onClick={onDuplicate} title="Duplicate">
            ⧉
          </button>
          <button type="button" onClick={onRemove} title="Delete">
            ✕
          </button>
        </div>
      </header>

      <label className="check-field compact">
        <input
          type="checkbox"
          checked={Boolean(block.hidden)}
          onChange={(event) => onChange({ hidden: event.target.checked })}
        />
        <span>Hidden block</span>
      </label>

      {block.type === "paragraph" && (
        <div className="block-fields">
          <label>
            <span>Variant</span>
            <select
              value={block.variant}
              onChange={(event) =>
                onChange({ variant: event.target.value as ParagraphBlock["variant"] })
              }
            >
              <option value="lead">Lead</option>
              <option value="body">Body</option>
              <option value="small">Small</option>
            </select>
          </label>
          <label className="field-full">
            <span>Text</span>
            <textarea
              rows={7}
              value={block.body}
              onChange={(event) => onChange({ body: event.target.value })}
            />
          </label>
        </div>
      )}

      {block.type === "heading" && (
        <div className="block-fields">
          <label>
            <span>Level</span>
            <select
              value={block.level}
              onChange={(event) =>
                onChange({ level: Number(event.target.value) as HeadingBlock["level"] })
              }
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </label>
          <label className="field-full">
            <span>Heading</span>
            <input
              value={block.body}
              onChange={(event) => onChange({ body: event.target.value })}
            />
          </label>
        </div>
      )}

      {block.type === "image" && (
        <div className="block-fields">
          <label className="field-full">
            <span>Image URL</span>
            <input
              value={block.src}
              onChange={(event) => onChange({ src: event.target.value })}
              placeholder="/static/example.png"
            />
          </label>
          <label>
            <span>Upload</span>
            <input type="file" accept="image/*" onChange={readImage} />
          </label>
          <label>
            <span>Alt text</span>
            <input
              value={block.alt}
              onChange={(event) => onChange({ alt: event.target.value })}
            />
          </label>
          <label className="field-full">
            <span>Caption</span>
            <input
              value={block.caption ?? ""}
              onChange={(event) => onChange({ caption: event.target.value })}
            />
          </label>
        </div>
      )}

      {block.type === "code" && (
        <div className="block-fields">
          <label>
            <span>Language</span>
            <input
              value={block.language}
              onChange={(event) => onChange({ language: event.target.value })}
            />
          </label>
          <label className="field-full">
            <span>Code</span>
            <textarea
              rows={10}
              value={block.code}
              onChange={(event) => onChange({ code: event.target.value })}
            />
          </label>
        </div>
      )}

      {block.type === "embed" && (
        <div className="block-fields">
          <label>
            <span>Provider</span>
            <select
              value={block.provider}
              onChange={(event) =>
                onChange({ provider: event.target.value as EmbedProvider })
              }
            >
              {embedProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Ratio</span>
            <input
              value={block.aspectRatio}
              onChange={(event) => onChange({ aspectRatio: event.target.value })}
            />
          </label>
          <label className="field-full">
            <span>Embed URL</span>
            <input
              value={block.src}
              onChange={(event) => onChange({ src: event.target.value })}
              placeholder="https://..."
            />
          </label>
          <label className="field-full">
            <span>Caption</span>
            <input
              value={block.caption ?? ""}
              onChange={(event) => onChange({ caption: event.target.value })}
            />
          </label>
          <label className="check-field compact">
            <input
              type="checkbox"
              checked={block.allowFullscreen}
              onChange={(event) => onChange({ allowFullscreen: event.target.checked })}
            />
            <span>Allow fullscreen</span>
          </label>
        </div>
      )}

      {block.type === "quote" && (
        <div className="block-fields">
          <label className="field-full">
            <span>Quote</span>
            <textarea
              rows={5}
              value={block.body}
              onChange={(event) => onChange({ body: event.target.value })}
            />
          </label>
          <label className="field-full">
            <span>Citation</span>
            <input
              value={block.cite ?? ""}
              onChange={(event) => onChange({ cite: event.target.value })}
            />
          </label>
        </div>
      )}
    </article>
  );
}

function WritingPreview({ draft }: { draft: WritingDraft }) {
  const blocks = draft.blocks.filter((block) => !block.hidden);

  return (
    <article className="writing-preview">
      <header>
        <div className="preview-meta">
          <span>{draft.date || "Draft"}</span>
          <span>{draft.status}</span>
        </div>
        <h2>{draft.title}</h2>
        {draft.summary && <p>{draft.summary}</p>}
        {draft.tags.length > 0 && (
          <div className="preview-tags">
            {draft.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </header>

      <div className="preview-body">
        {blocks.length > 0 ? (
          blocks.map((block) => <PreviewBlock key={block.id} block={block} />)
        ) : (
          <p className="preview-empty">No public blocks.</p>
        )}
      </div>
    </article>
  );
}

function PreviewBlock({ block }: { block: WritingBlock }) {
  if (block.type === "paragraph") {
    return <p className={`preview-paragraph ${block.variant}`}>{block.body}</p>;
  }

  if (block.type === "heading") {
    return block.level === 2 ? <h3>{block.body}</h3> : <h4>{block.body}</h4>;
  }

  if (block.type === "image") {
    return (
      <figure>
        {block.src ? <img src={block.src} alt={block.alt} /> : <div />}
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === "code") {
    return (
      <pre>
        <code>{block.code}</code>
      </pre>
    );
  }

  if (block.type === "embed") {
    return (
      <div>
        {block.src ? (
          <iframe
            src={block.src}
            title={`${block.provider} embed preview`}
            style={{ aspectRatio: block.aspectRatio.replace("/", " / ") }}
            allowFullScreen={block.allowFullscreen}
          />
        ) : (
          <div className="embed-placeholder" />
        )}
        {block.caption && <p className="preview-caption">{block.caption}</p>}
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote>
        <p>{block.body}</p>
        {block.cite && <cite>{block.cite}</cite>}
      </blockquote>
    );
  }

  return <hr />;
}
