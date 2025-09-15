// src/app/account/profile/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Pencil,
  Save,
  X,
  UserCircle2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Spinner from "@/components/ui/spinner";
import ErrorState from "@/components/ui/errorstate";
import {
  useGetMeQuery,
  useUpdateMeMutation,
} from "@/lib/redux/services/user.api";

export default function ProfilePage() {
  const { data: me, isLoading, error, refetch } = useGetMeQuery();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (me) {
      setForm({
        fullName: me.fullName || "",
        email: me.email || "",
        phoneNumber: me.phoneNumber || "",
        address: me.address || "",
        avatarUrl: me.avatarUrl || "",
      });
    }
  }, [me]);

  async function submit() {
    await updateMe({
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      address: form.address,
      avatarUrl: form.avatarUrl,
    })
      .unwrap()
      .catch(() => {});
    setEditing(false);
    refetch();
  }

  if (isLoading) return <Spinner />;
  if (error || !me) return <ErrorState />;

  return (
    <section className="bg-[#fefef8] min-h-screen">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#3c4f3d]">
            Profile
          </h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: avatar & role */}
            <div className="flex flex-col items-center md:items-start">
              <div className="relative w-28 h-28 rounded-full overflow-hidden bg-green-50">
                {me.avatarUrl ? (
                  <Image
                    src={me.avatarUrl}
                    alt={me.fullName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-green-700">
                    <UserCircle2 className="w-16 h-16" />
                  </div>
                )}
              </div>
              <div className="mt-3 text-center md:text-left">
                <div className="text-xl font-semibold text-gray-900">
                  {me.fullName}
                </div>
                <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 inline-block">
                  {me.role}
                </div>
              </div>
            </div>

            {/* Right: details / form */}
            {!editing ? (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={me.email}
                />
                <InfoRow
                  icon={<Phone className="w-4 h-4" />}
                  label="Phone"
                  value={me.phoneNumber || "—"}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Address"
                  value={me.address || "—"}
                />
              </div>
            ) : (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Full name"
                  value={form.fullName}
                  onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
                />
                <Field
                  label="Email"
                  value={form.email}
                  disabled
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  hint="Email is not editable"
                />
                <Field
                  label="Phone"
                  value={form.phoneNumber}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                />
                <Field
                  label="Address"
                  value={form.address}
                  onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                />
                <Field
                  label="Avatar URL"
                  value={form.avatarUrl}
                  onChange={(v) => setForm((f) => ({ ...f, avatarUrl: v }))}
                />

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        fullName: me.fullName || "",
                        email: me.email || "",
                        phoneNumber: me.phoneNumber || "",
                        address: me.address || "",
                        avatarUrl: me.avatarUrl || "",
                      });
                    }}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 inline mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
      <div className="text-xs text-gray-500 flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm text-gray-900">{value || "—"}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="mt-1 w-full border rounded-lg px-3 py-2 disabled:bg-gray-50"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
