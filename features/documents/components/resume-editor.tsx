"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Plus, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/components/ui/toast";
import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import type { ResumeDesignSelection } from "@/lib/resume-design";
import { saveEditedResumeAction } from "../actions/resume-edit-actions";
import { ResumeLivePreview } from "./resume-live-preview";

const SAVE_DEBOUNCE_MS = 1_200;

type SaveState = "idle" | "pending" | "saved" | "conflict" | "error";

type Updater = (resume: ImprovedResume) => ImprovedResume;

function clone(resume: ImprovedResume): ImprovedResume {
  return JSON.parse(JSON.stringify(resume)) as ImprovedResume;
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-system font-medium uppercase text-text-muted">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="compact"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <X className="size-3.5" aria-hidden />
    </Button>
  );
}

function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="outline" size="compact" onClick={onClick}>
      <Plus className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}

function BulletList({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {bullets.map((bullet, index) => (
        <div key={index} className="flex items-start gap-2">
          <Textarea
            value={bullet}
            rows={2}
            aria-label={`Bullet ${index + 1}`}
            onChange={(event) => {
              const next = [...bullets];

              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <RemoveButton
            label={`Remove bullet ${index + 1}`}
            onClick={() => onChange(bullets.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <AddButton label="Add bullet" onClick={() => onChange([...bullets, ""])} />
    </div>
  );
}

function SaveStatus({ state, message }: { state: SaveState; message: string }) {
  if (state === "pending") {
    return (
      <span className="flex items-center gap-1.5 text-label text-text-muted">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Saving
      </span>
    );
  }

  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-label text-text-muted">
        <Check className="size-3" aria-hidden />
        Saved
      </span>
    );
  }

  if (state === "conflict" || state === "error") {
    return (
      <span className="flex items-center gap-1.5 text-label text-danger">
        <TriangleAlert className="size-3" aria-hidden />
        {message}
      </span>
    );
  }

  return null;
}

export function ResumeEditor({
  publicId,
  initialResume,
  initialVersion,
  selection,
}: {
  publicId: string;
  initialResume: ImprovedResume;
  initialVersion: number;
  selection: ResumeDesignSelection;
}) {
  const [resume, setResume] = useState<ImprovedResume>(initialResume);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const versionRef = useRef(initialVersion);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(resume);

  latestRef.current = resume;

  const flush = useCallback(async () => {
    if (!dirtyRef.current) {
      return;
    }

    dirtyRef.current = false;
    setState("pending");

    const result = await saveEditedResumeAction({
      publicId,
      resume: latestRef.current,
      expectedVersion: versionRef.current,
    });

    if (result.status === "saved") {
      versionRef.current = result.version;
      setState("saved");
      setMessage("");
      return;
    }

    if (result.status === "conflict") {
      versionRef.current = result.version;
      setState("conflict");
      setMessage(result.message);
      notify.error(result.message);
      return;
    }

    setState("error");
    setMessage(result.message);
  }, [publicId]);

  const update = useCallback(
    (updater: Updater) => {
      setResume((current) => updater(clone(current)));
      dirtyRef.current = true;
      setState("pending");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onLeave() {
      if (dirtyRef.current) {
        void flush();
      }
    }

    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, [flush]);

  const header = resume.header;
  const preview = useMemo(() => resume, [resume]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-meta text-text-secondary">
            Edits save automatically and cost no AI usage.
          </p>
          <SaveStatus state={state} message={message} />
        </div>

        <Section title="Header">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Name"
              value={header.name}
              onChange={(name) =>
                update((draft) => {
                  draft.header.name = name;
                  return draft;
                })
              }
            />
            <Field
              label="Headline"
              value={header.headline}
              onChange={(headline) =>
                update((draft) => {
                  draft.header.headline = headline;
                  return draft;
                })
              }
            />
            <Field
              label="Email"
              value={header.email ?? ""}
              onChange={(email) =>
                update((draft) => {
                  draft.header.email = email || null;
                  return draft;
                })
              }
            />
            <Field
              label="Phone"
              value={header.phone ?? ""}
              onChange={(phone) =>
                update((draft) => {
                  draft.header.phone = phone || null;
                  return draft;
                })
              }
            />
            <Field
              label="Location"
              value={header.location ?? ""}
              onChange={(location) =>
                update((draft) => {
                  draft.header.location = location || null;
                  return draft;
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Links</Label>
            {header.links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={link}
                  aria-label={`Link ${index + 1}`}
                  onChange={(event) =>
                    update((draft) => {
                      draft.header.links[index] = event.target.value;
                      return draft;
                    })
                  }
                />
                <RemoveButton
                  label={`Remove link ${index + 1}`}
                  onClick={() =>
                    update((draft) => {
                      draft.header.links.splice(index, 1);
                      return draft;
                    })
                  }
                />
              </div>
            ))}
            <AddButton
              label="Add link"
              onClick={() =>
                update((draft) => {
                  draft.header.links.push("");
                  return draft;
                })
              }
            />
          </div>
        </Section>

        <Section title="Summary">
          <Textarea
            value={resume.professionalSummary}
            rows={4}
            aria-label="Professional summary"
            onChange={(event) =>
              update((draft) => {
                draft.professionalSummary = event.target.value;
                return draft;
              })
            }
          />
        </Section>

        <Section
          title="Skills"
          action={
            <AddButton
              label="Add group"
              onClick={() =>
                update((draft) => {
                  draft.skills.push({ category: "", items: [] });
                  return draft;
                })
              }
            />
          }
        >
          {resume.skills.map((group, index) => (
            <div
              key={index}
              className="space-y-2 rounded-card border border-border p-3"
            >
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Field
                    label="Category"
                    value={group.category}
                    onChange={(category) =>
                      update((draft) => {
                        draft.skills[index].category = category;
                        return draft;
                      })
                    }
                  />
                </div>
                <RemoveButton
                  label={`Remove ${group.category || "group"}`}
                  onClick={() =>
                    update((draft) => {
                      draft.skills.splice(index, 1);
                      return draft;
                    })
                  }
                />
              </div>
              <Field
                label="Items, comma separated"
                value={group.items.join(", ")}
                onChange={(value) =>
                  update((draft) => {
                    draft.skills[index].items = value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean);
                    return draft;
                  })
                }
              />
            </div>
          ))}
        </Section>

        <Section
          title="Experience"
          action={
            <AddButton
              label="Add role"
              onClick={() =>
                update((draft) => {
                  draft.experience.push({
                    company: "",
                    title: "",
                    location: null,
                    startDate: "",
                    endDate: "",
                    bullets: [],
                  });
                  return draft;
                })
              }
            />
          }
        >
          {resume.experience.map((entry, index) => (
            <div
              key={index}
              className="space-y-3 rounded-card border border-border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-label font-medium text-text-primary">
                  {entry.title || "New role"}
                </p>
                <RemoveButton
                  label={`Remove ${entry.title || "role"}`}
                  onClick={() =>
                    update((draft) => {
                      draft.experience.splice(index, 1);
                      return draft;
                    })
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Title"
                  value={entry.title}
                  onChange={(title) =>
                    update((draft) => {
                      draft.experience[index].title = title;
                      return draft;
                    })
                  }
                />
                <Field
                  label="Company"
                  value={entry.company}
                  onChange={(company) =>
                    update((draft) => {
                      draft.experience[index].company = company;
                      return draft;
                    })
                  }
                />
                <Field
                  label="Location"
                  value={entry.location ?? ""}
                  onChange={(location) =>
                    update((draft) => {
                      draft.experience[index].location = location || null;
                      return draft;
                    })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Start"
                    value={entry.startDate}
                    onChange={(startDate) =>
                      update((draft) => {
                        draft.experience[index].startDate = startDate;
                        return draft;
                      })
                    }
                  />
                  <Field
                    label="End"
                    value={entry.endDate}
                    placeholder="Present"
                    onChange={(endDate) =>
                      update((draft) => {
                        draft.experience[index].endDate = endDate;
                        return draft;
                      })
                    }
                  />
                </div>
              </div>

              <BulletList
                bullets={entry.bullets}
                onChange={(bullets) =>
                  update((draft) => {
                    draft.experience[index].bullets = bullets;
                    return draft;
                  })
                }
              />
            </div>
          ))}
        </Section>

        <Section
          title="Education"
          action={
            <AddButton
              label="Add education"
              onClick={() =>
                update((draft) => {
                  draft.education.push({
                    qualification: "",
                    institution: "",
                    date: null,
                  });
                  return draft;
                })
              }
            />
          }
        >
          {resume.education.map((entry, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-card border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Field
                label="Qualification"
                value={entry.qualification}
                onChange={(qualification) =>
                  update((draft) => {
                    draft.education[index].qualification = qualification;
                    return draft;
                  })
                }
              />
              <Field
                label="Institution"
                value={entry.institution}
                onChange={(institution) =>
                  update((draft) => {
                    draft.education[index].institution = institution;
                    return draft;
                  })
                }
              />
              <div className="flex items-end gap-2">
                <Field
                  label="Date"
                  value={entry.date ?? ""}
                  onChange={(date) =>
                    update((draft) => {
                      draft.education[index].date = date || null;
                      return draft;
                    })
                  }
                />
                <RemoveButton
                  label="Remove education entry"
                  onClick={() =>
                    update((draft) => {
                      draft.education.splice(index, 1);
                      return draft;
                    })
                  }
                />
              </div>
            </div>
          ))}
        </Section>
      </div>

      <div className="min-w-0 lg:sticky lg:top-4">
        <p className="mb-2 font-mono text-system font-medium uppercase text-text-muted">
          Live preview
        </p>
        <ResumeLivePreview resume={preview} selection={selection} />
      </div>
    </div>
  );
}
