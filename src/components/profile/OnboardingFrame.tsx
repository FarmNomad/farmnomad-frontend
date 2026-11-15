"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { cn } from "@/lib/cn";

const STEPS = ["Your details", "Payouts"];

/** Welcome frame for the steps after first login: progress, a heading that names the job, and a way to skip. */
export function OnboardingFrame({ step, heading, sub, skipHref, children }: { step: 1 | 2; heading: string; sub?: string; skipHref: string; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-app-bg">
      <header className="mx-auto flex max-w-[720px] items-center justify-between px-5 py-5">
        <Link href="/" aria-label="FarmNomad home">
          <Image src="/logo-on-light-tight.svg" alt="FarmNomad" width={178} height={36} className="h-6 w-auto dark:hidden" />
          <Image src="/logo-on-dark-tight.svg" alt="FarmNomad" width={178} height={36} className="hidden h-6 w-auto dark:block" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-[720px] px-5 pb-16 pt-4">
        <p className="text-ui-sm font-medium text-app-accent">
          Step {step} of {STEPS.length}
        </p>
        <ol aria-label="Progress" className="mt-2 flex gap-1.5">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <span className={cn("block h-1 rounded-full", i < step ? "bg-app-accent" : "bg-app-hover")} />
              <span className={cn("mt-1.5 block text-ui-sm", i + 1 === step ? "font-medium text-app-text" : "text-app-faint")}>{label}</span>
            </li>
          ))}
        </ol>

        <h1 className="mt-8 font-display text-[28px] font-medium leading-tight tracking-[-0.03em]">{heading}</h1>
        {sub && <p className="mt-2 max-w-[56ch] text-app-muted">{sub}</p>}

        <div className="mt-8 rounded-2xl p-5 shadow-[0_0_0_1px_var(--a-line)] sm:p-7">{children}</div>

        <Link href={skipHref} className="mt-6 inline-block text-app-faint underline-offset-2 hover:text-app-muted hover:underline">
          Skip for now
        </Link>
      </main>
    </div>
  );
}
