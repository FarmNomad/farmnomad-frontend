"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Check, X } from "@phosphor-icons/react/dist/ssr";
import { Field, input } from "@/components/app/ProductSheet";
import { Button } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { CERTIFICATIONS, FARM_TYPES, UK_POSTCODE, VEHICLE_TYPES, type Certification, type DriverProfile, type Farm, type FarmType, type Kitchen, type VehicleType } from "@/lib/types/profile";

/**
 * The three role profile forms. Each takes the saved values (if any) and an onSubmit, so the
 * onboarding step and the edit pages render exactly the same form. Only the fields marked
 * required block saving; everything else is optional and looks it.
 */

type FormProps<T> = { initial?: Partial<T> | null; onSubmit: (values: Partial<T>) => Promise<void>; submitLabel: string; footer?: ReactNode };

const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
const text = (v: string) => v.trim() || undefined;
const digits = (v: string) => v.replace(/[^\d]/g, "");

function Shell({ onSubmit, saving, submitLabel, footer, children }: { onSubmit: (e: FormEvent) => void; saving: boolean; submitLabel: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {children}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-line pt-4">
        <div className="text-ui-sm text-app-faint">{footer}</div>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Two({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Select<T extends string>({ value, onChange, options, placeholder, invalid }: { value: T | ""; onChange: (v: T | "") => void; options: [T, string][]; placeholder: string; invalid?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T | "")} aria-invalid={invalid || undefined} className={cn(input(!!invalid), !value && "text-app-faint")}>
      <option value="">{placeholder}</option>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** A required confirmation with its full wording: a legal condition of the work, not a formality. */
function Declaration({ checked, onChange, title, children, error }: { checked: boolean; onChange: (v: boolean) => void; title: string; children: ReactNode; error?: string }) {
  return (
    <div>
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl p-4 transition-shadow",
          error ? "shadow-[0_0_0_1px_var(--a-red),0_0_0_4px_var(--a-red-soft)]" : checked ? "bg-app-accent-soft shadow-[0_0_0_1.5px_var(--a-accent)]" : "shadow-[0_0_0_1px_var(--a-line-strong)]",
        )}
      >
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" aria-invalid={!!error || undefined} />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-[6px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-app-accent",
            checked ? "bg-app-accent text-white dark:text-black" : "bg-app-panel shadow-[inset_0_0_0_1.5px_var(--a-line-strong)]",
          )}
        >
          {checked && <Check weight="bold" className="size-3.5" />}
        </span>
        <span>
          <span className="block font-medium">
            {title} <span className="text-app-faint">*</span>
          </span>
          <span className="mt-1 block text-ui-sm text-app-muted">{children}</span>
        </span>
      </label>
      {error && <p className="mt-1.5 text-ui-sm text-app-red">{error}</p>}
    </div>
  );
}

/** Checkbox group with the real UK scheme names. */
export function CertificationPicker({ value, onChange }: { value: Certification[]; onChange: (v: Certification[]) => void }) {
  return (
    <div role="group" aria-label="Certifications" className="grid gap-2 sm:grid-cols-2">
      {CERTIFICATIONS.map(([id, label]) => {
        const on = value.includes(id);
        return (
          <label key={id} className={cn("flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2 transition-shadow", on ? "bg-app-accent-soft shadow-[0_0_0_1px_var(--a-accent)]" : "shadow-[0_0_0_1px_var(--a-line-strong)] hover:bg-app-hover")}>
            <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== id) : [...value, id])} className="peer sr-only" />
            <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-[5px] peer-focus-visible:ring-2 peer-focus-visible:ring-app-accent", on ? "bg-app-accent text-white dark:text-black" : "shadow-[inset_0_0_0_1.5px_var(--a-line-strong)]")}>
              {on && <Check weight="bold" className="size-3" />}
            </span>
            <span>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Farmer ───────────────────────── */

export function FarmForm({ initial, onSubmit, submitLabel, footer }: FormProps<Farm>) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    postcode: initial?.postcode ?? "",
    county: initial?.county ?? "",
    farmType: (initial?.farmType ?? "") as FarmType | "",
    sizeAcres: initial?.sizeAcres?.toString() ?? "",
    establishedYear: initial?.establishedYear?.toString() ?? "",
    certifications: initial?.certifications ?? [],
  });
  const [errors, setErrors] = useState<Partial<Record<"name" | "address" | "postcode" | "establishedYear", string>>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: typeof errors = {};
    if (!f.name.trim()) er.name = "Add your farm's name.";
    if (!f.address.trim()) er.address = "Add the farm's address.";
    if (!UK_POSTCODE.test(f.postcode.trim())) er.postcode = "Enter a UK postcode, like PR3 3XB.";
    const year = num(f.establishedYear);
    if (year !== undefined && (year < 1000 || year > new Date().getFullYear())) er.establishedYear = "Enter a year, like 1952.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      await onSubmit({
        name: f.name.trim(),
        description: text(f.description),
        address: f.address.trim(),
        city: text(f.city),
        postcode: f.postcode.trim().toUpperCase(),
        county: text(f.county),
        farmType: f.farmType || undefined,
        sizeAcres: num(f.sizeAcres),
        establishedYear: year,
        certifications: f.certifications,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell onSubmit={submit} saving={saving} submitLabel={submitLabel} footer={footer}>
      <Field label="Farm name" required error={errors.name} hint="Public. It appears on every listing.">
        <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Rowan Hill Farm" aria-invalid={!!errors.name || undefined} className={input(!!errors.name)} autoComplete="organization" />
      </Field>
      <Field label="Description" hint="Shown on your public farm page.">
        <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What you grow or rear, and how." className={cn(input(false), "h-auto resize-none py-2")} />
      </Field>
      <Field label="Farm address" required error={errors.address} hint="This is where buyers and drivers will collect. You can set a different pickup point per listing later.">
        <input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="House or farm name and road" aria-invalid={!!errors.address || undefined} className={input(!!errors.address)} autoComplete="street-address" />
      </Field>
      <Two>
        <Field label="Town or city">
          <input value={f.city} onChange={(e) => set("city", e.target.value)} className={input(false)} autoComplete="address-level2" />
        </Field>
        <Field label="Postcode" required error={errors.postcode}>
          <input value={f.postcode} onChange={(e) => set("postcode", e.target.value.toUpperCase())} placeholder="PR3 3XB" aria-invalid={!!errors.postcode || undefined} className={cn(input(!!errors.postcode), "uppercase placeholder:normal-case")} autoComplete="postal-code" />
        </Field>
        <Field label="County">
          <input value={f.county} onChange={(e) => set("county", e.target.value)} placeholder="e.g. Lancashire" className={input(false)} />
        </Field>
        <Field label="Farm type">
          <Select value={f.farmType} onChange={(v) => set("farmType", v)} options={FARM_TYPES} placeholder="Choose a type" />
        </Field>
        <Field label="Size (acres)">
          <input inputMode="decimal" value={f.sizeAcres} onChange={(e) => set("sizeAcres", e.target.value.replace(/[^\d.]/g, ""))} className={cn(input(false), "num")} />
        </Field>
        <Field label="Established" error={errors.establishedYear} hint="The year the farm started.">
          <input inputMode="numeric" maxLength={4} value={f.establishedYear} onChange={(e) => set("establishedYear", digits(e.target.value))} placeholder="1952" aria-invalid={!!errors.establishedYear || undefined} className={cn(input(!!errors.establishedYear), "num")} />
        </Field>
      </Two>
      <div className="grid gap-2">
        <p className="font-medium">Certifications</p>
        <CertificationPicker value={f.certifications} onChange={(v) => set("certifications", v)} />
      </div>
    </Shell>
  );
}

/* ───────────────────────── Driver ───────────────────────── */

export function DriverProfileForm({ initial, onSubmit, submitLabel, footer }: FormProps<DriverProfile>) {
  const [f, setF] = useState({
    vehicleType: (initial?.vehicleType ?? "") as VehicleType | "",
    vehicleRegistration: initial?.vehicleRegistration ?? "",
    vehicleMake: initial?.vehicleMake ?? "",
    vehicleModel: initial?.vehicleModel ?? "",
    capacityKg: initial?.capacityKg?.toString() ?? "",
    refrigerated: initial?.refrigerated ?? false,
    maxRadiusKm: initial?.maxRadiusKm?.toString() ?? "25",
    licenceNumber: initial?.licenceNumber ?? "",
    hasHireRewardInsurance: initial?.hasHireRewardInsurance ?? false,
    insuranceExpiry: initial?.insuranceExpiry ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<"vehicleType" | "vehicleRegistration" | "hasHireRewardInsurance", string>>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: typeof errors = {};
    if (!f.vehicleType) er.vehicleType = "Choose what you drive.";
    if (!f.vehicleRegistration.trim()) er.vehicleRegistration = "Add the registration plate.";
    if (!f.hasHireRewardInsurance) er.hasHireRewardInsurance = "You need hire and reward insurance to deliver on FarmNomad.";
    setErrors(er);
    if (Object.keys(er).length || !f.vehicleType) return;
    setSaving(true);
    try {
      await onSubmit({
        vehicleType: f.vehicleType,
        vehicleRegistration: f.vehicleRegistration.toUpperCase().replace(/\s+/g, ""),
        vehicleMake: text(f.vehicleMake),
        vehicleModel: text(f.vehicleModel),
        capacityKg: num(f.capacityKg),
        refrigerated: f.refrigerated,
        maxRadiusKm: num(f.maxRadiusKm),
        licenceNumber: text(f.licenceNumber),
        hasHireRewardInsurance: f.hasHireRewardInsurance,
        insuranceExpiry: f.insuranceExpiry || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell onSubmit={submit} saving={saving} submitLabel={submitLabel} footer={footer}>
      <Declaration checked={f.hasHireRewardInsurance} onChange={(v) => set("hasHireRewardInsurance", v)} title="I hold valid hire and reward insurance." error={errors.hasHireRewardInsurance}>
        Carrying goods for payment is not covered by ordinary private car insurance. You will need hire and reward or courier cover to deliver on FarmNomad.
      </Declaration>
      <Two>
        <Field label="Vehicle type" required error={errors.vehicleType}>
          <Select
            value={f.vehicleType}
            // A refrigerated van is refrigerated: tick it for them.
            onChange={(v) => setF((s) => ({ ...s, vehicleType: v, refrigerated: v === "REFRIGERATED_VAN" ? true : s.refrigerated }))}
            options={VEHICLE_TYPES}
            placeholder="Choose a vehicle"
            invalid={!!errors.vehicleType}
          />
        </Field>
        <Field label="Registration" required error={errors.vehicleRegistration}>
          <input
            value={f.vehicleRegistration}
            onChange={(e) => set("vehicleRegistration", e.target.value)}
            onBlur={() => set("vehicleRegistration", f.vehicleRegistration.toUpperCase().replace(/\s+/g, ""))}
            placeholder="AB12CDE"
            aria-invalid={!!errors.vehicleRegistration || undefined}
            className={cn(input(!!errors.vehicleRegistration), "uppercase placeholder:normal-case")}
          />
        </Field>
        <Field label="Make">
          <input value={f.vehicleMake} onChange={(e) => set("vehicleMake", e.target.value)} placeholder="e.g. Ford" className={input(false)} />
        </Field>
        <Field label="Model">
          <input value={f.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} placeholder="e.g. Transit" className={input(false)} />
        </Field>
        <Field label="Capacity (kg)">
          <input inputMode="numeric" value={f.capacityKg} onChange={(e) => set("capacityKg", digits(e.target.value))} className={cn(input(false), "num")} />
        </Field>
        <Field label="Max delivery radius (km)">
          <input inputMode="numeric" value={f.maxRadiusKm} onChange={(e) => set("maxRadiusKm", digits(e.target.value))} className={cn(input(false), "num")} />
        </Field>
        <Field label="Licence number">
          <input value={f.licenceNumber} onChange={(e) => set("licenceNumber", e.target.value)} className={input(false)} />
        </Field>
        <Field label="Insurance expiry" hint="We'll remind you before it lapses.">
          <input type="date" value={f.insuranceExpiry} onChange={(e) => set("insuranceExpiry", e.target.value)} className={cn(input(false), "num")} />
        </Field>
      </Two>
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line-strong)]">
        <span>
          <span className="block font-medium">Refrigerated</span>
          <span className="block text-ui-sm text-app-faint">The vehicle can keep chilled produce cold.</span>
        </span>
        <input type="checkbox" role="switch" checked={f.refrigerated} onChange={(e) => set("refrigerated", e.target.checked)} className="peer sr-only" />
        <span aria-hidden className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-app-accent", f.refrigerated ? "bg-app-accent" : "bg-app-hover shadow-[inset_0_0_0_1px_var(--a-line-strong)]")}>
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", f.refrigerated ? "translate-x-[18px]" : "translate-x-0.5")} />
        </span>
      </label>
    </Shell>
  );
}

/* ───────────────────────── Kitchen ───────────────────────── */

const HYGIENE: [string, string][] = [
  ["5", "5 – Very good"],
  ["4", "4 – Good"],
  ["3", "3 – Generally satisfactory"],
  ["2", "2 – Improvement necessary"],
  ["1", "1 – Major improvement necessary"],
  ["0", "0 – Urgent improvement necessary"],
];
const CUISINE_IDEAS = ["British", "Indian", "Italian", "Caribbean", "West African", "Vegan", "Bakery"];

export function KitchenForm({ initial, onSubmit, submitLabel, footer }: FormProps<Kitchen>) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    postcode: initial?.postcode ?? "",
    cuisines: initial?.cuisines ?? [],
    hygieneRating: initial?.hygieneRating?.toString() ?? "",
    fsaRegistered: initial?.fsaRegistered ?? false,
    localAuthority: initial?.localAuthority ?? "",
  });
  const [draft, setDraft] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"name" | "address" | "postcode" | "fsaRegistered", string>>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const addCuisine = (c: string) => {
    const t = c.trim();
    if (t && !f.cuisines.some((x) => x.toLowerCase() === t.toLowerCase())) set("cuisines", [...f.cuisines, t]);
    setDraft("");
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: typeof errors = {};
    if (!f.name.trim()) er.name = "Add your kitchen's name.";
    if (!f.address.trim()) er.address = "Add the kitchen's address.";
    if (!UK_POSTCODE.test(f.postcode.trim())) er.postcode = "Enter a UK postcode, like PR1 8JA.";
    if (!f.fsaRegistered) er.fsaRegistered = "You need to be registered with your local authority to sell food.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      await onSubmit({
        name: f.name.trim(),
        description: text(f.description),
        address: f.address.trim(),
        city: text(f.city),
        postcode: f.postcode.trim().toUpperCase(),
        cuisines: f.cuisines,
        hygieneRating: num(f.hygieneRating), // "Awaiting inspection" sends none
        fsaRegistered: f.fsaRegistered,
        localAuthority: text(f.localAuthority),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell onSubmit={submit} saving={saving} submitLabel={submitLabel} footer={footer}>
      <Declaration checked={f.fsaRegistered} onChange={(v) => set("fsaRegistered", v)} title="I am registered as a food business with my local authority." error={errors.fsaRegistered}>
        UK law requires food businesses to register with their council, usually at least 28 days before trading.
      </Declaration>
      <Field label="Kitchen name" required error={errors.name} hint="Public. It appears on your NomadEat listings.">
        <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Fishergate Kitchen" aria-invalid={!!errors.name || undefined} className={input(!!errors.name)} autoComplete="organization" />
      </Field>
      <Field label="Description">
        <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What you cook and who for." className={cn(input(false), "h-auto resize-none py-2")} />
      </Field>
      <Field label="Address" required error={errors.address}>
        <input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Building and street" aria-invalid={!!errors.address || undefined} className={input(!!errors.address)} autoComplete="street-address" />
      </Field>
      <Two>
        <Field label="Town or city">
          <input value={f.city} onChange={(e) => set("city", e.target.value)} className={input(false)} autoComplete="address-level2" />
        </Field>
        <Field label="Postcode" required error={errors.postcode}>
          <input value={f.postcode} onChange={(e) => set("postcode", e.target.value.toUpperCase())} placeholder="PR1 8JA" aria-invalid={!!errors.postcode || undefined} className={cn(input(!!errors.postcode), "uppercase placeholder:normal-case")} autoComplete="postal-code" />
        </Field>
        <Field label="Food hygiene rating">
          <Select value={f.hygieneRating} onChange={(v) => set("hygieneRating", v)} options={HYGIENE} placeholder="Awaiting inspection" />
        </Field>
        <Field label="Local authority" hint="The council you registered with.">
          <input value={f.localAuthority} onChange={(e) => set("localAuthority", e.target.value)} placeholder="e.g. Preston City Council" className={input(false)} />
        </Field>
      </Two>
      <div className="grid gap-2">
        <p className="font-medium">Cuisines</p>
        <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[7px] bg-app-panel px-1.5 py-1 shadow-[0_0_0_1px_var(--a-line-strong)] focus-within:shadow-[0_0_0_1px_var(--a-accent),0_0_0_4px_var(--a-accent-soft)]">
          {f.cuisines.map((c) => (
            <span key={c} className="inline-flex h-6 items-center gap-1 rounded-[5px] bg-app-hover pl-2 pr-1 text-ui-sm">
              {c}
              <button type="button" aria-label={`Remove ${c}`} onClick={() => set("cuisines", f.cuisines.filter((x) => x !== c))} className="grid size-4 place-items-center rounded text-app-faint hover:text-app-text">
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addCuisine(draft);
              } else if (e.key === "Backspace" && !draft && f.cuisines.length) set("cuisines", f.cuisines.slice(0, -1));
            }}
            onBlur={() => addCuisine(draft)}
            aria-label="Add a cuisine"
            placeholder={f.cuisines.length ? "" : "Type one and press Enter"}
            className="h-6 min-w-[10ch] flex-1 bg-transparent px-1 outline-none placeholder:text-app-faint"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CUISINE_IDEAS.filter((c) => !f.cuisines.includes(c)).map((c) => (
            <button key={c} type="button" onClick={() => addCuisine(c)} className="h-6 rounded-full px-2.5 text-ui-sm text-app-muted shadow-[0_0_0_1px_var(--a-line-strong)] transition-colors hover:bg-app-hover hover:text-app-text">
              + {c}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}
