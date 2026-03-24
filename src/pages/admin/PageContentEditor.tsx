import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { Skeleton } from "../../components/Skeleton";
import { RichTextEditor } from "../../components/RichTextEditor";
import { THEME_OPTIONS, getThemeColors } from "../../lib/themePresets";
import { parseGoogleSpeechToText } from "../../lib/transcript";
import type {
  Post,
  Student,
  PageType,
  PageLabels,
  SectionVisibility,
  TranscriptWord,
} from "../../types";

const inputClass =
  "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClass = "block text-sm font-medium text-slate-600 mb-1";

const PAGE_TYPE_OPTIONS: { value: PageType; label: string }[] = [
  { value: "graduation", label: "Graduation" },
  { value: "wedding", label: "Wedding" },
  { value: "event", label: "Event" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "reunion", label: "Reunion" },
  { value: "retirement", label: "Retirement" },
  { value: "babyShower", label: "Baby shower" },
  { value: "farewell", label: "Farewell" },
  { value: "engagement", label: "Engagement" },
];

const DEFAULT_LABELS_BY_TYPE: Record<PageType, PageLabels> = {
  graduation: { themeLabel: 'Graduation Souvenir', titleLabel: 'Section', subtitleLabel: 'Batch', peopleLabel: 'Class Registry', peopleTagLabel: 'Honor', messageLabel: 'Words from your Teacher', messageAuthorLabel: 'Teacher' },
  wedding: { themeLabel: 'Wedding Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Guests', peopleTagLabel: 'VIP', messageLabel: 'From the Couple', messageAuthorLabel: 'Couple' },
  event: { themeLabel: 'Event Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Attendees', peopleTagLabel: 'VIP', messageLabel: 'Message from Host', messageAuthorLabel: 'Host' },
  birthday: { themeLabel: 'Birthday Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Guests', peopleTagLabel: 'VIP', messageLabel: 'Message from Host', messageAuthorLabel: 'Host' },
  anniversary: { themeLabel: 'Anniversary Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Guests', peopleTagLabel: 'VIP', messageLabel: 'From the Couple', messageAuthorLabel: 'Couple' },
  reunion: { themeLabel: 'Reunion Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Attendees', peopleTagLabel: 'VIP', messageLabel: 'Message from Host', messageAuthorLabel: 'Host' },
  retirement: { themeLabel: 'Retirement Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Colleagues', peopleTagLabel: 'VIP', messageLabel: 'Message for Honoree', messageAuthorLabel: 'Honoree' },
  babyShower: { themeLabel: 'Baby Shower Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Guests', peopleTagLabel: 'VIP', messageLabel: 'Message from Host', messageAuthorLabel: 'Host' },
  farewell: { themeLabel: 'Farewell Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Colleagues', peopleTagLabel: 'VIP', messageLabel: 'Message for Honoree', messageAuthorLabel: 'Honoree' },
  engagement: { themeLabel: 'Engagement Memories', titleLabel: 'Event', subtitleLabel: 'Date', peopleLabel: 'Guests', peopleTagLabel: 'VIP', messageLabel: 'From the Couple', messageAuthorLabel: 'Couple' },
};

const SECTION_OPTIONS: { key: keyof SectionVisibility; label: string }[] = [
  { key: "classPhoto", label: "Class / cover photo" },
  { key: "gallery", label: "Image gallery" },
  { key: "teacherMessage", label: "Message block" },
  { key: "teacherAudio", label: "Host voice recording (MP3)" },
  { key: "peopleList", label: "People list (attendees)" },
  { key: "studentPhotos", label: "Attendee profile photos" },
];

function getSectionLabel(key: keyof SectionVisibility, labels: PageLabels): string {
  const author = labels?.messageAuthorLabel ?? "Host";
  const people = labels?.peopleLabel ?? "Attendees";
  const peopleSingular = people.endsWith("s") ? people.slice(0, -1) : "Person";
  switch (key) {
    case "teacherAudio": return `${author} voice recording (MP3)`;
    case "peopleList": return `People list (${people.toLowerCase()})`;
    case "studentPhotos": return `${peopleSingular} profile photos`;
    default: return SECTION_OPTIONS.find((o) => o.key === key)!.label;
  }
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function ImagePreview({
  src,
  alt,
  size = "md",
  className = "",
}: {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "fill";
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const sizeClass =
    size === "fill"
      ? "aspect-square w-full min-w-0"
      : size === "lg"
        ? "w-24 h-24"
        : size === "sm"
          ? "w-12 h-12"
          : "w-14 h-14";
  const shrinkClass = size === "fill" ? "" : "shrink-0";
  if (!src?.trim()) return null;
  return (
    <div
      className={`rounded-lg overflow-hidden border border-slate-200 bg-slate-50 ${sizeClass} ${shrinkClass} ${className}`}
    >
      {errored ? (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
          ?
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

function AudioUploadSlot({
  src,
  onRemove,
  onFileChange,
  label,
  uploading,
  inputRef,
  error: slotError,
}: {
  src: string;
  onRemove: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  error?: string;
}) {
  const hasAudio = !!src?.trim();
  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      {slotError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {slotError}
        </div>
      )}
      <p className="text-xs text-slate-500">
        MP3 only, max 3 minutes, max 5MB. Autoplays on the memory page.
      </p>
      <div className="flex items-center gap-4">
        {hasAudio ? (
          <div className="flex items-center gap-3">
            <audio src={src} controls className="h-10 max-w-[240px]" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="text-sm py-1.5 px-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={uploading}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                aria-label="Remove audio"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm"
          >
            {uploading ? "Uploading…" : "Upload MP3"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,.mp3"
          className="hidden"
          aria-label={`Upload ${label}`}
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}

function TranscriptSlot({
  transcript,
  onSetTranscript,
  onClear,
  disabled,
}: {
  transcript: TranscriptWord[] | undefined;
  onSetTranscript: (t: TranscriptWord[]) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        const words = parseGoogleSpeechToText(json);
        if (words.length > 0) {
          onSetTranscript(words);
        }
      } catch (_) {
        // ignore
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePaste = () => {
    const raw = textareaRef.current?.value?.trim();
    if (!raw) return;
    try {
      const json = JSON.parse(raw);
      const words = parseGoogleSpeechToText(json);
      if (words.length > 0) {
        onSetTranscript(words);
      }
    } catch (_) {
      // ignore
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-slate-200">
      <label className={labelClass}>Transcription (optional)</label>
      <p className="text-xs text-slate-500">
        Upload or paste Google Speech-to-Text JSON for synchronized captions during playback.
      </p>
      {transcript && transcript.length > 0 ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            {transcript.length} words loaded
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Clear transcript
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="text-sm py-1.5 px-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
          >
            Upload JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Upload transcript JSON file"
          />
          <div className="flex-1 min-w-0 flex gap-2">
            <textarea
              ref={textareaRef}
              id="transcript-json-paste"
              placeholder="Paste Google Speech-to-Text JSON here…"
              className={`${inputClass} text-sm h-20`}
              disabled={disabled}
              aria-label="Paste transcript JSON"
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={disabled}
              className="text-sm py-1.5 px-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 shrink-0 self-end"
            >
              Parse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageUploadSlot({
  src,
  onRemove,
  onFileChange,
  label,
  uploading,
  inputRef,
  size = "md",
  required,
}: {
  src: string;
  onRemove: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  size?: "sm" | "md" | "lg";
  required?: boolean;
}) {
  const hasImage = !!src?.trim();
  return (
    <div className="space-y-2">
      <label className={labelClass}>
        {label}
        {required && " *"}
      </label>
      <div className="flex items-start gap-4">
        {hasImage ? (
          <div className="relative group">
            <ImagePreview src={src} alt={label} size={size} />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove"
            >
              <TrashIcon />
            </button>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 ${size === "lg" ? "w-24 h-24" : size === "sm" ? "w-12 h-12" : "w-14 h-14"}`}
          >
            <span className="text-xs">No image</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          aria-label={`Upload ${label}`}
          onChange={onFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm"
        >
          {uploading ? "Uploading…" : hasImage ? "Replace" : "Upload photo"}
        </button>
      </div>
    </div>
  );
}

export function PageContentEditor() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [pageType, setPageType] = useState<PageType>("event");
  const [labels, setLabels] = useState<PageLabels | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(
    {
      classPhoto: true,
      gallery: true,
      teacherMessage: true,
      peopleList: true,
      studentPhotos: false,
    },
  );
  const [colorTheme, setColorTheme] = useState<string>("default");
  const [showCustomLabels, setShowCustomLabels] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const errorBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorBannerRef.current?.focus();
  }, [error]);

  const [saving, setSaving] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioError, setAudioError] = useState("");
  const classPhotoInputRef = useRef<HTMLInputElement>(null);
  const teacherPhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const studentPhotoInputRef = useRef<HTMLInputElement>(null);
  const studentPhotoTargetRef = useRef<number | null>(null);
  const teacherAudioInputRef = useRef<HTMLInputElement>(null);

  const displayLabels = useMemo(() => {
    const defaults = DEFAULT_LABELS_BY_TYPE[pageType] ?? DEFAULT_LABELS_BY_TYPE.event;
    if (!labels) return defaults;
    return {
      themeLabel: (labels.themeLabel ?? "").trim() || defaults.themeLabel,
      titleLabel: (labels.titleLabel ?? "").trim() || defaults.titleLabel,
      subtitleLabel: (labels.subtitleLabel ?? "").trim() || defaults.subtitleLabel,
      peopleLabel: (labels.peopleLabel ?? "").trim() || defaults.peopleLabel,
      peopleTagLabel: (labels.peopleTagLabel ?? "").trim() || defaults.peopleTagLabel,
      messageLabel: (labels.messageLabel ?? "").trim() || defaults.messageLabel,
      messageAuthorLabel: (labels.messageAuthorLabel ?? "").trim() || defaults.messageAuthorLabel,
    };
  }, [pageType, labels]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiFetch(`/api/admin/pages/${id}/content`).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg =
            data?.error ||
            (r.status === 401
              ? "Please log in"
              : r.status === 403
                ? "Access denied to this page"
                : r.status === 404
                  ? "Content not found"
                  : "Failed to load");
          throw new Error(msg);
        }
        return data;
      }),
      apiFetch(`/api/admin/pages/${id}/meta`).then(async (r) => {
        if (!r.ok) return { type: "event" as PageType, labels: null };
        return r.json();
      }),
    ])
      .then(([contentData, metaData]) => {
        setPost(contentData);
        setPageType(metaData?.type ?? "event");
        setLabels(metaData?.labels ?? null);
        setSectionVisibility((prev) => ({
          ...prev,
          ...metaData?.sectionVisibility,
        }));
        setColorTheme(metaData?.colorTheme ?? "default");
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  function update<K extends keyof Post>(key: K, value: Post[K]) {
    setPost((p) => (p ? { ...p, [key]: value } : null));
  }

  function addStudent() {
    setPost((p) =>
      p ? { ...p, students: [{ name: "" }, ...p.students] } : null,
    );
  }

  function removeStudent(idx: number) {
    setPost((p) =>
      p ? { ...p, students: p.students.filter((_, i) => i !== idx) } : null,
    );
  }

  function reorderStudent(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    setPost((p) => {
      if (!p) return null;
      const students = [...p.students];
      const [removed] = students.splice(fromIdx, 1);
      students.splice(toIdx, 0, removed);
      return { ...p, students };
    });
  }

  function updateStudent(
    idx: number,
    field: keyof Student,
    value: string | boolean,
  ) {
    setPost((p) => {
      if (!p) return null;
      const next = [...p.students];
      next[idx] = { ...next[idx], [field]: value };
      return { ...p, students: next };
    });
  }

  function uncheckAllHonor() {
    setPost((p) =>
      p
        ? {
            ...p,
            students: p.students.map((s) => ({ ...s, honor: false })),
          }
        : null,
    );
  }

  function removeGalleryUrl(idx: number) {
    setPost((p) =>
      p ? { ...p, gallery: p.gallery.filter((_, i) => i !== idx) } : null,
    );
  }

  function addGalleryUrlsBulk(paths: string[]) {
    const trimmed = paths.map((p) => p.trim()).filter(Boolean);
    if (trimmed.length === 0) return;
    setPost((p) => (p ? { ...p, gallery: [...p.gallery, ...trimmed] } : null));
  }

  const MAX_IMAGE_DIMENSION_CLIENT = 8000;

  async function checkImageDimensions(file: File): Promise<void> {
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > MAX_IMAGE_DIMENSION_CLIENT || bitmap.height > MAX_IMAGE_DIMENSION_CLIENT) {
        bitmap.close();
        throw new Error(
          `Image is too large (${bitmap.width}×${bitmap.height}). Maximum ${MAX_IMAGE_DIMENSION_CLIENT}×${MAX_IMAGE_DIMENSION_CLIENT} pixels.`
        );
      }
      bitmap.close();
    } catch (err) {
      if (err instanceof Error && err.message.includes('too large')) throw err;
      // createImageBitmap may fail for some formats; let server validate
    }
  }

  async function uploadImage(file: File): Promise<string> {
    await checkImageDimensions(file);
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetch(`/api/admin/pages/${id}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    return data.path as string;
  }

  async function uploadAudio(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetch(`/api/admin/pages/${id}/upload-audio`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = `Upload failed (${res.status})`;
      try {
        const data = JSON.parse(text);
        if (typeof data?.error === "string") msg = data.error;
      } catch {
        if (text) msg = text;
      }
      throw new Error(msg);
    }
    const data = await res.json();
    return data.path as string;
  }

  async function handleClassPhotoUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !post || !id) return;
    input.value = "";
    setUploading(true);
    setError("");
    try {
      const path = await uploadImage(file);
      update("classPhoto", path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleTeacherPhotoUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !post || !id) return;
    input.value = "";
    setUploading(true);
    setError("");
    try {
      const path = await uploadImage(file);
      update("teacherPhoto", path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const fileList = input.files;
    if (!fileList?.length || !post || !id) return;
    const files = Array.from(fileList);
    input.value = "";
    setUploading(true);
    setError("");
    try {
      const paths: string[] = [];
      for (const file of files) {
        const path = await uploadImage(file);
        paths.push(path);
      }
      addGalleryUrlsBulk(paths);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleStudentPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    const idx = studentPhotoTargetRef.current;
    if (!file || idx == null || !post || !id) return;
    input.value = "";
    studentPhotoTargetRef.current = null;
    setUploading(true);
    setError("");
    try {
      const path = await uploadImage(file);
      updateStudent(idx, "photo", path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleTeacherAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !post || !id) return;
    input.value = "";
    setUploading(true);
    setError("");
    setAudioError("");
    try {
      const path = await uploadAudio(file);
      update("teacherAudio", path);
      setAudioError("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      setAudioError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveTeacherAudio() {
    if (!id) return;
    setUploading(true);
    setError("");
    setAudioError("");
    try {
      const res = await apiFetch(`/api/admin/pages/${id}/audio`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to remove audio");
      }
      const data = await res.json();
      setPost(data);
      setAudioError("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove audio";
      setError(msg);
      setAudioError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function saveMetaSettings() {
    if (!id) return;
    setMetaSaving(true);
    setError("");
    setMetaSaved(false);
    try {
      const res = await apiFetch(`/api/admin/pages/${id}/meta`, {
        method: "PUT",
        body: JSON.stringify({
          type: pageType,
          labels: labels || undefined,
          sectionVisibility,
          colorTheme,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to save (${res.status})`);
      }
      setMetaSaved(true);
      setTimeout(() => setMetaSaved(false), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      const isParseError =
        msg.includes("JSON") ||
        msg.includes("Unexpected token") ||
        msg.toLowerCase().includes("fetch");
      setError(
        isParseError
          ? "Network error. Is the API server running? Try: npm run dev:server"
          : msg,
      );
    } finally {
      setMetaSaving(false);
    }
  }

  function updateLabel<K extends keyof PageLabels>(key: K, value: string) {
    setLabels((l) => ({ ...(l || ({} as PageLabels)), [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!post || !id) return;
    if (sectionVisibility.classPhoto !== false && !post.classPhoto?.trim()) {
      setError("Please upload a class photo.");
      return;
    }
    const msgText = post.teacherMessage?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
    if (sectionVisibility.teacherMessage !== false && !msgText) {
      setError(
        "Please enter message text. Formatting (bold, headings, links, etc.) is allowed, but the message must contain actual text—empty paragraphs or whitespace only are not valid."
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Save both content and page settings (type, labels, section visibility)
      const [contentRes, metaRes] = await Promise.all([
        apiFetch(`/api/admin/pages/${id}/content`, {
          method: "PUT",
          body: JSON.stringify(post),
        }),
        apiFetch(`/api/admin/pages/${id}/meta`, {
          method: "PUT",
          body: JSON.stringify({
            type: pageType,
            labels: labels || undefined,
            sectionVisibility,
            colorTheme,
          }),
        }),
      ]);
      if (!contentRes.ok) {
        const data = await contentRes.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save content");
      }
      if (!metaRes.ok) {
        const data = await metaRes.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save page settings");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
  if (error && !post) {
    const isNetworkError =
      error.toLowerCase().includes("fetch") ||
      error.toLowerCase().includes("network");
    return (
      <div className="space-y-4">
        <p className="text-red-500">{error}</p>
        {isNetworkError && (
          <p className="text-sm text-slate-500">
            Make sure the API server is running:{" "}
            <code className="bg-slate-100 px-1 rounded">
              npm run dev:server
            </code>
          </p>
        )}
        <div className="flex gap-4">
          <Link to="/admin/content" className="text-blue-600 hover:underline">
            ← Back to content
          </Link>
          {(error.toLowerCase().includes("log in") ||
            error.toLowerCase().includes("unauthorized")) && (
            <Link to="/admin/login" className="text-blue-600 hover:underline">
              Go to login
            </Link>
          )}
        </div>
      </div>
    );
  }
  if (!post) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/admin/content"
          className="text-slate-600 hover:text-slate-800"
        >
          ← Back to content
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">
          Edit: {post?.sectionName?.trim() ? `${post.sectionName} (${id})` : id}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        {error && (
          <div
            ref={errorBannerRef}
            tabIndex={-1}
            role="alert"
            className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 animate-slide-up outline-none focus:ring-2 focus:ring-red-400"
          >
            <p className="font-medium">{error}</p>
            {error.toLowerCase().includes("fetch") && (
              <p className="text-sm mt-1">
                Make sure the API server is running:{" "}
                <code className="bg-red-100 px-1 rounded">
                  npm run dev:server
                </code>
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">
            Page type & visible sections
          </h2>
          <p className="text-sm text-slate-500">
            Choose how labels appear and which sections to show on the public
            page.
          </p>
          <div>
            <label className={labelClass}>Visible sections</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {SECTION_OPTIONS.map(({ key }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={sectionVisibility[key] !== false}
                    onChange={(e) =>
                      setSectionVisibility((v) => ({
                        ...v,
                        [key]: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{getSectionLabel(key, displayLabels)}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Uncheck to hide a section from the public page. Click
              &quot;Save&quot; at the bottom to save everything, or &quot;Save
              page settings&quot; to save only these options.
            </p>
          </div>
          <div>
            <label className={labelClass}>Color theme</label>
            <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1 pb-2 mt-2 scroll-smooth">
              <div className="grid grid-flow-col grid-rows-4 auto-cols-[minmax(5.5rem,5.5rem)] gap-3 w-max">
                {THEME_OPTIONS.map(({ value, label }) => {
                  const colors = getThemeColors(value);
                  const isSelected = colorTheme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setColorTheme(value)}
                      className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg border-2 transition-smooth ${
                        isSelected
                          ? "border-slate-800 ring-2 ring-slate-300"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded flex items-center justify-end pr-1"
                        style={{
                          background: `linear-gradient(90deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: colors.accent }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
            <div className="w-full sm:flex-1 min-w-0">
              <label htmlFor="pageType" className={labelClass}>
                Type
              </label>
              <select
                id="pageType"
                value={pageType}
                onChange={(e) => {
                  const newType = e.target.value as PageType;
                  setPageType(newType);
                  const newDefaults = DEFAULT_LABELS_BY_TYPE[newType] ?? DEFAULT_LABELS_BY_TYPE.event;
                  const currentDefaults = DEFAULT_LABELS_BY_TYPE[pageType] ?? DEFAULT_LABELS_BY_TYPE.event;
                  const keys: (keyof PageLabels)[] = ['themeLabel', 'titleLabel', 'subtitleLabel', 'peopleLabel', 'peopleTagLabel', 'messageLabel', 'messageAuthorLabel'];
                  const labelsMatchCurrentDefaults = !labels || keys.every((k) => (labels[k] ?? "").trim() === "" || labels[k] === currentDefaults[k]);
                  if (labelsMatchCurrentDefaults) {
                    setLabels(newDefaults);
                  }
                }}
                className={inputClass}
              >
                {PAGE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto sm:shrink-0 sm:self-end">
              <button
                type="button"
                onClick={() => setShowCustomLabels(!showCustomLabels)}
                className="text-sm py-1.5 px-3 sm:py-2 sm:px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {showCustomLabels ? "Hide custom labels" : "Custom labels..."}
              </button>
              <button
                type="button"
                onClick={saveMetaSettings}
                disabled={metaSaving}
                className="text-sm py-1.5 px-3 sm:py-2 sm:px-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {metaSaving ? (
                  "Saving..."
                ) : metaSaved ? (
                  "Saved!"
                ) : (
                  <>
                    <span className="sm:hidden">Save</span>
                    <span className="hidden sm:inline">Save page settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {showCustomLabels && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-fade-in">
              <p className="text-sm text-slate-500">
                Override labels shown on the page. Leave blank to use defaults for the selected type ({pageType}).
              </p>
              {(
                [
                  { key: "themeLabel" as const, label: "Theme label" },
                  { key: "titleLabel" as const, label: "Title label" },
                  { key: "subtitleLabel" as const, label: "Subtitle label" },
                  { key: "peopleLabel" as const, label: "People label" },
                  { key: "peopleTagLabel" as const, label: "People tag label" },
                  { key: "messageLabel" as const, label: "Message label" },
                  { key: "messageAuthorLabel" as const, label: "Message author label" },
                ]
              ).map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={key} className={labelClass}>
                    {label}
                  </label>
                  <textarea
                    id={key}
                    value={labels?.[key] ?? ""}
                    onChange={(e) => updateLabel(key, e.target.value)}
                    placeholder={displayLabels[key]}
                    className={inputClass}
                    rows={2}
                  />
                  <p className="text-xs text-slate-400 mt-0.5">Default: {displayLabels[key]} — Enter for line break</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Section & basic info</h2>
          <div>
            <label htmlFor="sectionName" className={labelClass}>
              Section name
            </label>
            <textarea
              id="sectionName"
              value={post.sectionName}
              onChange={(e) => update("sectionName", e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Press Enter for a line break"
              required
            />
          </div>
          {sectionVisibility.classPhoto !== false && (
            <>
              <div>
                <label htmlFor="batch" className={labelClass}>
                  Batch
                </label>
                <textarea
                  id="batch"
                  value={post.batch}
                  onChange={(e) => update("batch", e.target.value)}
                  className={inputClass}
                  rows={2}
                  placeholder="Press Enter for a line break"
                  required
                />
              </div>
              <div>
                <label htmlFor="location" className={labelClass}>
                  Location
                </label>
                <textarea
                  id="location"
                  value={post.location}
                  onChange={(e) => update("location", e.target.value)}
                  className={inputClass}
                  rows={2}
                  placeholder="Press Enter for a line break"
                  required
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="quote" className={labelClass}>
              Quote
            </label>
            <textarea
              id="quote"
              value={post.quote}
              onChange={(e) => update("quote", e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Press Enter for a line break"
              required
            />
          </div>
        </div>

        {(sectionVisibility.classPhoto !== false ||
          sectionVisibility.gallery !== false) && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Images</h2>
              {uploading && (
                <span className="text-sm text-amber-600 font-medium">
                  Uploading…
                </span>
              )}
            </div>
            {sectionVisibility.classPhoto !== false && (
              <ImageUploadSlot
                src={post.classPhoto}
                onRemove={() => update("classPhoto", "")}
                onFileChange={handleClassPhotoUpload}
                label="Class photo"
                uploading={uploading}
                inputRef={classPhotoInputRef}
                size="lg"
                required
              />
            )}
            {sectionVisibility.gallery !== false && (
              <div className="space-y-3">
                <label className={labelClass}>Gallery</label>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    aria-label="Upload gallery images"
                    onChange={handleGalleryUpload}
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploading}
                    className="text-sm py-1.5 px-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : "Upload images"}
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {post.gallery.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center min-h-[3.5rem] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 text-xs">
                      No images yet
                    </div>
                  ) : (
                    post.gallery.map((url, idx) => (
                      <div key={idx} className="relative group w-full min-w-0">
                        <ImagePreview
                          src={url}
                          alt={`Gallery ${idx + 1}`}
                          size="fill"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryUrl(idx)}
                          className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {sectionVisibility.teacherMessage !== false && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">{displayLabels.messageAuthorLabel}</h2>
            <div>
              <label htmlFor="teacherName" className={labelClass}>
                {displayLabels.messageAuthorLabel} name
              </label>
              <input
                id="teacherName"
                type="text"
                value={post.teacherName}
                onChange={(e) => update("teacherName", e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="teacherTitle" className={labelClass}>
                {displayLabels.messageAuthorLabel} title
              </label>
              <input
                id="teacherTitle"
                type="text"
                value={post.teacherTitle}
                onChange={(e) => update("teacherTitle", e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <ImageUploadSlot
              src={post.teacherPhoto || ""}
              onRemove={() => update("teacherPhoto", "")}
              onFileChange={handleTeacherPhotoUpload}
              label={`${displayLabels.messageAuthorLabel} photo`}
              uploading={uploading}
              inputRef={teacherPhotoInputRef}
              size="lg"
            />
            <div>
              <label htmlFor="teacherMessage" className={labelClass}>
                {displayLabels.messageLabel}
              </label>
              <p className="text-xs text-slate-500 mb-1.5">
                Use the toolbar for bold, italic, headings, and lists.
              </p>
              <RichTextEditor
                key={id}
                id="teacherMessage"
                value={post.teacherMessage ?? ""}
                onChange={(html) => update("teacherMessage", html)}
                required
                aria-label={displayLabels.messageLabel}
              />
            </div>
            {sectionVisibility.teacherAudio !== false && (
              <div className="space-y-2">
                <AudioUploadSlot
                  src={post.teacherAudio || ""}
                  onRemove={handleRemoveTeacherAudio}
                  onFileChange={handleTeacherAudioUpload}
                  label={`${displayLabels.messageAuthorLabel} voice recording`}
                  uploading={uploading}
                  inputRef={teacherAudioInputRef}
                  error={audioError}
                />
                {post.teacherAudio && (
                  <TranscriptSlot
                    transcript={post.teacherAudioTranscript}
                    onSetTranscript={(t) => update("teacherAudioTranscript", t)}
                    onClear={() => update("teacherAudioTranscript", undefined)}
                    disabled={saving}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {sectionVisibility.peopleList !== false && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">{displayLabels.peopleLabel}</h2>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <span className="text-sm text-slate-500">
                Add {displayLabels.peopleLabel.toLowerCase()} with optional {displayLabels.peopleTagLabel.toLowerCase()} flag. Drag the grip to reorder.
              </span>
              <div className="flex gap-3">
                {post.students.some((s) => s.honor) && (
                  <button
                    type="button"
                    onClick={uncheckAllHonor}
                    className="text-sm text-slate-600 hover:text-slate-800"
                  >
                    Uncheck all {displayLabels.peopleTagLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={addStudent}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add {(displayLabels.peopleLabel.endsWith("s") ? displayLabels.peopleLabel.slice(0, -1) : "person")}
                </button>
              </div>
            </div>
            {sectionVisibility.studentPhotos && (
              <input
                ref={studentPhotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                aria-label="Upload student photo"
                onChange={handleStudentPhotoUpload}
              />
            )}
            {post.students.map((s, idx) => (
              <div
                key={idx}
                className="flex gap-2 items-center group/row rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromStr = e.dataTransfer.getData("text/plain");
                  if (fromStr === "") return;
                  const fromIdx = parseInt(fromStr, 10);
                  if (!Number.isNaN(fromIdx) && fromIdx !== idx) reorderStudent(fromIdx, idx);
                }}
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", String(idx));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="shrink-0 p-1.5 -ml-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 rounded touch-none"
                  aria-label={`Drag to reorder ${s.name || "attendee"}`}
                  title="Drag to reorder"
                >
                  <GripIcon />
                </div>
                {sectionVisibility.studentPhotos && (
                  <div className="relative group shrink-0">
                    {s.photo ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            studentPhotoTargetRef.current = idx;
                            studentPhotoInputRef.current?.click();
                          }}
                          className="block rounded-full overflow-hidden w-10 h-10 border border-slate-200 focus:ring-2 focus:ring-blue-500"
                          aria-label="Replace photo"
                        >
                          <ImagePreview src={s.photo} alt="" size="sm" className="!w-10 !h-10 !rounded-full" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStudent(idx, "photo", "")}
                          className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove photo"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          studentPhotoTargetRef.current = idx;
                          studentPhotoInputRef.current?.click();
                        }}
                        disabled={uploading}
                        className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 flex items-center justify-center hover:border-slate-400 disabled:opacity-50"
                        aria-label={`Upload photo for ${s.name || "student"}`}
                      >
                        <span className="text-xs">+</span>
                      </button>
                    )}
                  </div>
                )}
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => updateStudent(idx, "name", e.target.value)}
                  placeholder={`${displayLabels.peopleLabel.endsWith("s") ? displayLabels.peopleLabel.slice(0, -1) : "Person"} name`}
                  aria-label={`${displayLabels.peopleLabel} ${idx + 1} name`}
                  className={inputClass}
                />
                <label className="flex items-center gap-2 shrink-0">
                  <input
                    type="checkbox"
                    checked={!!s.honor}
                    onChange={(e) =>
                      updateStudent(idx, "honor", e.target.checked)
                    }
                  />
                  <span className="text-sm text-slate-600">{displayLabels.peopleTagLabel}</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeStudent(idx)}
                  className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                  aria-label="Remove"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
            <div>
              <label className={labelClass}>Together since</label>
              <input
                type="text"
                value={post.togetherSince}
                onChange={(e) => update("togetherSince", e.target.value)}
                placeholder="June 2025"
                className={inputClass}
                required
              />
            </div>
          </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 mt-6 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center gap-3">
          {saved && (
            <span className="text-green-700 font-medium text-sm animate-slide-up">Saved successfully.</span>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-smooth btn-press"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
          <Link
            to="/admin/content"
            className="py-2 px-6 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-smooth"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
