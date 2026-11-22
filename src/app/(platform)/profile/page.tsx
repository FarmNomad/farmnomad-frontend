"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Camera, CaretRight, CircleNotch, SignOut } from "@phosphor-icons/react/dist/ssr";
import { useChangePasswordMutation, useGetConnectDashboardLinkMutation, useGetEarningsSummaryQuery, useLogoutMutation, useMeQuery, useUpdateMeMutation, useUploadAvatarMutation } from "@/lib/api/farmnomad";
import { apiError } from "@/lib/api/errors";
import { PROFILE_META, hasProfileStep } from "@/lib/types/profile";
import { clearSession, getSession } from "@/lib/auth/session";
import { ROLE_META } from "@/lib/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Field, input } from "@/components/app/ProductSheet";
import { Avatar, Button, Skeleton } from "@/components/app/ui";

/** Profile & settings: user fields from spec §2 (PUT /users/{id}) and change password (POST /auth/change-password). */
export default function ProfilePage() {
  const { data: me } = useMeQuery();
  const [logout, { isLoading: signingOut }] = useLogoutMutation();
  const [update, { isLoading: saving }] = useUpdateMeMutation();
  const [changePw, { isLoading: changing }] = useChangePasswordMutation();
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [openStripe, { isLoading: openingStripe }] = useGetConnectDashboardLinkMutation();
  const earns = me?.role === "FARMER" || me?.role === "KITCHEN" || me?.role === "DRIVER";
  const { data: earnings } = useGetEarningsSummaryQuery(undefined, { skip: !earns });
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Choose an image file", { description: "JPG, PNG or WebP." });
    if (file.size > 5 * 1024 * 1024) return void toast.error("That photo is too large", { description: "Choose one under 5 MB." });
    try {
      await uploadAvatar(file).unwrap();
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error("Couldn't update your picture", { description: apiError(err, "Try again.") });
    }
  }

  async function managePayouts() {
    try {
      const { url } = await openStripe().unwrap();
      window.location.href = url; // Stripe's site, so a full navigation
    } catch (err) {
      toast.error("Couldn't open your payout details", { description: apiError(err, "Try again.") });
    }
  }
  const [f, setF] = useState({ fullName: "", phoneNumber: "", address: "", city: "", postcode: "", country: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (me)
      setF({ fullName: me.fullName, phoneNumber: me.phoneNumber ?? "", address: me.address ?? "", city: me.city ?? "", postcode: me.postcode ?? "", country: me.country ?? "United Kingdom" });
  }, [me]);

  const dirty = !!me && (Object.keys(f) as (keyof typeof f)[]).some((k) => (me[k] ?? "") !== f[k] && !(k === "country" && !me.country && f.country === "United Kingdom"));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!me || !f.fullName.trim()) return;
    try {
      await update({ id: me.id, profilePictureUrl: me.profilePictureUrl, ...f }).unwrap();
      toast.success("Profile saved");
    } catch {
      toast.error("Couldn't save your profile");
    }
  }

  async function savePw(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pw.newPassword.length < 8) return setPwError("Use at least 8 characters.");
    try {
      await changePw(pw).unwrap();
      setPw({ currentPassword: "", newPassword: "" });
      toast.success("Password changed");
    } catch (err) {
      setPwError((err as { data?: { message?: string } })?.data?.message ?? "Couldn't change your password.");
    }
  }

  return (
    <div className="mx-auto max-w-[720px] pb-16">
      <PageHeader title="Profile" description="Your details, used for deliveries and receipts." />
      <div className="grid gap-4 px-4 md:px-8">
        <form onSubmit={save} className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-label="Personal details">
          <div className="flex items-center gap-4 border-b border-app-line p-5">
            {me ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label={me.profilePictureUrl ? "Change profile picture" : "Add a profile picture"}
                className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
              >
                <Avatar name={me.fullName} src={me.profilePictureUrl} className="size-16 text-[18px]" />
                <span className={"absolute inset-0 grid place-items-center rounded-full bg-black/55 text-white transition-opacity duration-150 " + (uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
                  {uploading ? <CircleNotch className="size-5 animate-spin" /> : <Camera weight="fill" className="size-5" />}
                </span>
              </button>
            ) : (
              <Skeleton className="size-16 rounded-full" />
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => (pickPhoto(e.target.files?.[0]), (e.target.value = ""))} />
            <div className="min-w-0">
              <p className="truncate font-medium">{me?.fullName ?? " "}</p>
              <p className="truncate text-app-faint">{me?.email}</p>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || !me} className="mt-1 text-ui-sm font-medium text-app-accent hover:underline disabled:opacity-60">
                {uploading ? "Uploading…" : me?.profilePictureUrl ? "Change photo" : "Add a photo"}
              </button>
            </div>
            <span className="ml-auto rounded-full bg-app-accent-soft px-2 py-0.5 text-ui-sm font-medium text-app-accent">{me ? ROLE_META[me.role].label : ""}</span>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Full name" required error={me && !f.fullName.trim() ? "Add your name." : undefined}>
                <input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} className={input(!!me && !f.fullName.trim())} autoComplete="name" />
              </Field>
            </div>
            <Field label="Email" hint="Contact support to change your email">
              <input value={me?.email ?? ""} readOnly disabled className={input(false) + " opacity-60"} />
            </Field>
            <Field label="Phone">
              <input value={f.phoneNumber} onChange={(e) => setF({ ...f, phoneNumber: e.target.value })} className={input(false)} autoComplete="tel" inputMode="tel" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={input(false)} autoComplete="street-address" />
              </Field>
            </div>
            <Field label="Town or city">
              <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className={input(false)} autoComplete="address-level2" />
            </Field>
            <Field label="Postcode">
              <input value={f.postcode} onChange={(e) => setF({ ...f, postcode: e.target.value.toUpperCase() })} className={input(false) + " uppercase"} autoComplete="postal-code" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-app-line px-5 py-3">
            <Button type="submit" variant="primary" disabled={!dirty || saving}>Save changes</Button>
          </div>
        </form>

        {hasProfileStep(me?.role) && (
          <Link href={PROFILE_META[me.role].href} className="group flex items-center justify-between gap-4 rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)] transition-colors hover:bg-app-hover">
            <div>
              <p className="font-medium capitalize">{PROFILE_META[me.role].noun}</p>
              <p className="text-app-faint">What buyers and drivers see about you, and where they collect from.</p>
            </div>
            <CaretRight className="size-4 shrink-0 text-app-faint transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        {earns && earnings?.onboarded && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]">
            <div>
              <p className="font-medium">Payout details</p>
              <p className="text-app-faint">Your bank details, tax documents and identity checks are kept by Stripe.</p>
            </div>
            <Button onClick={managePayouts} disabled={openingStripe}>
              Manage payout details
            </Button>
          </div>
        )}

        <form onSubmit={savePw} className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-label="Password">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <p className="font-medium sm:col-span-2">Password</p>
            <Field label="Current password">
              <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className={input(false)} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 8 characters" error={pwError ?? undefined}>
              <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className={input(!!pwError)} autoComplete="new-password" />
            </Field>
          </div>
          <div className="flex justify-end border-t border-app-line px-5 py-3">
            <Button type="submit" disabled={!pw.currentPassword || !pw.newPassword || changing}>Change password</Button>
          </div>
        </form>

        <div className="flex items-center justify-between rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]">
          <div>
            <p className="font-medium">Sign out</p>
            <p className="text-app-faint">You&apos;ll need your email and password to get back in.</p>
          </div>
          <Button
            disabled={signingOut}
            onClick={async () => {
              // Tell the server first (it revokes the refresh token), then forget the session here
              // whether or not that call worked.
              try {
                await logout({ refreshToken: getSession()?.refreshToken }).unwrap();
              } catch {}
              clearSession();
              // A full page load on purpose: Next keeps earlier pages alive in memory, so a soft
              // navigation would bring back the previous user and their cached data.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/login");
            }}
          >
            <SignOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
