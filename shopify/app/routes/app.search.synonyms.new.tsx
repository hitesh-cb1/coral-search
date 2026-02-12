import { useEffect, useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRouteError, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ROUTES } from "../constants/routes";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {};
};

export default function SynonymsNewPage() {
  useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editKey = searchParams.get("edit");

  const [synInput, setSynInput] = useState("");
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [showMinSynonymsError, setShowMinSynonymsError] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(editKey || null);
  const isEditing = !!editKey;

  const canSave = synonyms.length >= 1 && title.trim().length > 0;

  const addSynonym = () => {
    const t = synInput.trim();
    if (!t) return;
    if (t.length > 50) return;
    if (synonyms.includes(t)) {
      setSynInput("");
      return;
    }
    setSynonyms([...synonyms, t]);
    setSynInput("");
    setIsDirty(true);
  };

  const removeSynonym = (t: string) => {
    setSynonyms(synonyms.filter((x) => x !== t));
    setIsDirty(true);
  };

  useEffect(() => {
    if (synonyms.length >= 2) setShowMinSynonymsError(false);
  }, [synonyms.length]);

  // Load existing data when editing
  useEffect(() => {
    if (editKey) {
      try {
        const saved = sessionStorage.getItem(editKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setTitle(parsed.title || "");
          setSynonyms(parsed.synonyms || []);
          setHasSaved(true);
          setIsDirty(false);
          setCurrentKey(editKey);
        }
      } catch {
        // ignore invalid data
      }
    }
  }, [editKey]);

  // Auto-generate title from synonyms if user hasn't typed one yet (only for new items)
  useEffect(() => {
    if (isEditing) return; // Don't auto-generate when editing
    if (title.trim().length > 0) return;
    if (synonyms.length === 0) return;
    const suggested = synonyms[0] ?? "";
    if (suggested) setTitle(suggested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synonyms, isEditing]);

  const titleCount = title.length;
  const synCount = synInput.length;

  const save = () => {
    if (synonyms.length < 2) {
      setShowMinSynonymsError(true);
      return;
    }
    // Use existing key if editing, otherwise create new one
    const key = currentKey || `synonym_group_${Date.now()}`;
    const payload = { 
      title: title.trim(), 
      synonyms, 
      isNew: !isEditing // Only mark as new if it's a new item
    };
    sessionStorage.setItem(key, JSON.stringify(payload));
    setHasSaved(true);
    setIsDirty(false);
    setCurrentKey(key);
  };

  const chips = useMemo(() => synonyms, [synonyms]);
  const deleteGroup = () => {
    if (currentKey) {
      sessionStorage.removeItem(currentKey);
    }
    setSynonyms([]);
    setTitle("");
    setSynInput("");
    setHasSaved(false);
    setIsDirty(false);
    setCurrentKey(null);
    navigate(ROUTES.SYNONYMS);
  };

  return (
    <s-page>
      <s-box paddingBlockEnd="base">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(ROUTES.SYNONYMS)}
            aria-label="Back"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 8,
              borderRadius: 8,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="#202223"
            >
              <path d="M7.707 14.707a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 1 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l2.293 2.293a1 1 0 0 1 0 1.414Z" />
            </svg>
          </button>
          <s-heading>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#202223" }}>
              {isEditing ? "Edit synonym group" : "Create synonym group"}
            </span>
          </s-heading>
        </div>
      </s-box>

      <s-box paddingBlockEnd="base">
        <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 12 }}>
          {/* Add list of synonyms */}
          <div
            style={{
              background: "white",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Add list of synonyms</div>
            <div style={{ color: "#6d7175", fontSize: 13, marginBottom: 12 }}>
              Synonyms tell the search engine which words should be related to display even
              more relevant results.
            </div>

            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              Synonym words
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "nowrap",
              }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  value={synInput}
                  onChange={(e) => setSynInput(e.target.value)}
                  placeholder="Eg. Cap"
                  maxLength={50}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: "1px solid #c9cccf",
                    borderRadius: 8,
                    padding: "10px 54px 10px 10px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6d7175",
                    fontSize: 12,
                  }}
                >
                  {synCount}/50
                </div>
              </div>
              <button
                type="button"
                onClick={addSynonym}
                style={{
                  border: "1px solid #c9cccf",
                  borderRadius: 8,
                  padding: "9px 12px",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                Add
              </button>
            </div>

            <div
              style={{
                marginTop: 8,
                color: showMinSynonymsError ? "#d72c0d" : "#6d7175",
                fontSize: 12,
              }}
            >
              {showMinSynonymsError
                ? "Enter a minimum of 2 synonyms."
                : "Enter at least 1 synonym."}
            </div>

            {isDirty || chips.length > 0 ? (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {/* Unsaved indicator chip (matches the boosts UI pattern) */}
                {hasSaved && isDirty ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "2px 10px",
                      borderRadius: 999,
                      border: "1px solid #e1e3e5",
                      background: "#f6f6f7",
                      color: "#202223",
                      fontWeight: 700,
                      fontSize: 12,
                      lineHeight: "20px",
                    }}
                  >
                    New
                    <button
                      type="button"
                      onClick={() => setIsDirty(false)}
                      aria-label="Dismiss new changes indicator"
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#6d7175",
                        fontWeight: 900,
                        lineHeight: "20px",
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ) : null}

                {chips.map((t) => (
                  <span
                    key={t}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "2px 10px",
                      borderRadius: 999,
                      border: "1px solid #e1e3e5",
                      background: "#f6f6f7",
                      color: "#202223",
                      fontWeight: 700,
                      fontSize: 12,
                      lineHeight: "20px",
                    }}
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeSynonym(t)}
                      aria-label={`Remove ${t}`}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#6d7175",
                        fontWeight: 900,
                        lineHeight: "20px",
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Title */}
          <div
            style={{
              background: "white",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Enter synonym group title</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Title</div>
            <div style={{ position: "relative" }}>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (isEditing) setIsDirty(true);
                }}
                placeholder="Eg. Hat"
                maxLength={50}
                style={{
                  width: "90%",
                  border: "1px solid #c9cccf",
                  borderRadius: 8,
                  padding: "10px 70px 10px 10px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6d7175",
                  fontSize: 12,
                }}
              >
                {titleCount}/50
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {hasSaved && !isDirty ? (
              <button
                type="button"
                onClick={deleteGroup}
                style={{
                  border: "1px solid #d72c0d",
                  borderRadius: 10,
                  padding: "8px 14px",
                  background: "#d72c0d",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={save}
              disabled={!canSave || (!isDirty && !isEditing)}
              style={{
                border: "1px solid #c9cccf",
                borderRadius: 10,
                padding: "8px 14px",
                background: canSave && (isDirty || isEditing) ? "#202223" : "#f1f2f3",
                color: canSave && (isDirty || isEditing) ? "white" : "#6d7175",
                cursor: canSave && (isDirty || isEditing) ? "pointer" : "not-allowed",
                fontWeight: 700,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </s-box>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};


