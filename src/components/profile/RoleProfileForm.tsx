"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  useCreateDriverProfileMutation,
  useCreateFarmMutation,
  useCreateKitchenMutation,
  useGetMyProfileQuery,
  useUpdateDriverProfileMutation,
  useUpdateFarmMutation,
  useUpdateKitchenMutation,
} from "@/lib/api/farmnomad";
import { apiError } from "@/lib/api/errors";
import { Skeleton } from "@/components/app/ui";
import type { DriverProfile, Farm, Kitchen, ProfileRole } from "@/lib/types/profile";
import { DriverProfileForm, FarmForm, KitchenForm } from "./forms";

/**
 * The profile form for a role, wired to the API: it loads what is saved, creates the profile the
 * first time and updates it after that. Used as-is by the onboarding step and the edit pages.
 * The owner is never sent; the backend takes it from the session.
 */
export function RoleProfileForm({ role, submitLabel, footer, onSaved }: { role: ProfileRole; submitLabel: string; footer?: ReactNode; onSaved?: () => void }) {
  const { data: status, isLoading } = useGetMyProfileQuery();
  const [createFarm] = useCreateFarmMutation();
  const [updateFarm] = useUpdateFarmMutation();
  const [createDriver] = useCreateDriverProfileMutation();
  const [updateDriver] = useUpdateDriverProfileMutation();
  const [createKitchen] = useCreateKitchenMutation();
  const [updateKitchen] = useUpdateKitchenMutation();

  if (isLoading)
    return (
      <div className="grid gap-4" aria-busy="true">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    );

  const saved = status?.role === role ? status.profile : null;

  async function run(save: () => Promise<unknown>) {
    try {
      await save();
      toast.success("Details saved");
      onSaved?.();
    } catch (err) {
      toast.error("That didn't save", { description: apiError(err, "Check your connection and try again.") });
    }
  }

  if (role === "FARMER") {
    const farm = saved as Farm | null;
    return <FarmForm initial={farm} submitLabel={submitLabel} footer={footer} onSubmit={(body) => run(() => (farm ? updateFarm({ id: farm.id, body }) : createFarm(body)).unwrap())} />;
  }
  if (role === "DRIVER") {
    const driver = saved as DriverProfile | null;
    return <DriverProfileForm initial={driver} submitLabel={submitLabel} footer={footer} onSubmit={(body) => run(() => (driver ? updateDriver(body) : createDriver(body)).unwrap())} />;
  }
  const kitchen = saved as Kitchen | null;
  return <KitchenForm initial={kitchen} submitLabel={submitLabel} footer={footer} onSubmit={(body) => run(() => (kitchen ? updateKitchen({ id: kitchen.id, body }) : createKitchen(body)).unwrap())} />;
}
