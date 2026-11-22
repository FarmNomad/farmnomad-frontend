import type { CropScan, ScanSeverity, UploadResult } from "@/lib/types/api";
import { shrinkImage } from "@/lib/images/shrink";
import { UPLOAD_TIMEOUT_MS, api, asList, readAs } from "./farmnomad";

type ApiScan = Omit<CropScan, "createdAt" | "severity"> & { scannedAt?: string; createdAt?: string; severity?: string | null };
const SEVERITIES: ScanSeverity[] = ["NONE", "LOW", "MODERATE", "HIGH"];
/**
 * The API types severity as free text: match it in any case, and drop one the app doesn't know.
 * Without a `healthy` flag, only the word "healthy" counts: not "unhealthy" or "not healthy".
 */
function toScan({ scannedAt, createdAt, severity, ...s }: ApiScan): CropScan {
  const level = severity?.toUpperCase();
  const diagnosis = s.diagnosis ?? "No diagnosis";
  return {
    ...s,
    diagnosis,
    confidence: s.confidence ?? 0,
    healthy: s.healthy ?? (/\bhealthy\b/i.test(diagnosis) && !/\bnot healthy\b/i.test(diagnosis)),
    severity: SEVERITIES.find((known) => known === level),
    createdAt: scannedAt ?? createdAt ?? new Date().toISOString(),
  };
}
const readScans = (data: unknown) => asList<ApiScan>(data)?.map(toScan) ?? null;

/**
 * Crop scanner (spec §7.14), all through the Spring Boot API:
 *   1. POST /uploads          multipart `file`  → { url }   (Cloudinary; the prerequisite)
 *   2. POST /crop-scans/diagnose { imageUrl }   → CropScan  (backend calls farmnomad-ai and saves it)
 *   3. GET  /crop-scans/my                      → CropScan[]
 *   4. DELETE /crop-scans/{id}            (FARMER own, ADMIN any)
 *   5. GET /crop-scans?farmerId=           (ADMIN)
 */
const cropScanApi = api.enhanceEndpoints({ addTagTypes: ["CropScan"] }).injectEndpoints({
  endpoints: (b) => ({
    uploadImage: b.mutation<UploadResult, File>({
      queryFn: async (file, _api, _extra, fetch) => {
        const body = new FormData();
        body.append("file", await shrinkImage(file));
        const res = await fetch({ url: "/uploads", method: "POST", body, timeout: UPLOAD_TIMEOUT_MS });
        return res.error ? { error: res.error } : { data: res.data as UploadResult };
      },
    }),
    diagnose: b.mutation<CropScan, { imageUrl: string }>({
      queryFn: (body, _api, _extra, fetch) =>
        readAs(fetch, { url: "/crop-scans/diagnose", method: "POST", body }, (data) => {
          const scan = data as ApiScan | null;
          return scan?.diagnosis ? toScan({ ...scan, imageUrl: scan.imageUrl ?? body.imageUrl }) : null;
        }),
      invalidatesTags: ["CropScan"],
    }),
    myCropScans: b.query<CropScan[], void>({
      queryFn: (_arg, _api, _extra, fetch) => readAs(fetch, "/crop-scans/my", readScans),
      providesTags: ["CropScan"],
    }),
    deleteCropScan: b.mutation<void, number>({ query: (id) => ({ url: `/crop-scans/${id}`, method: "DELETE" }), invalidatesTags: ["CropScan"] }),
    // ADMIN: everyone's scans, or one farmer's.
    allCropScans: b.query<CropScan[], { farmerId?: number } | void>({
      queryFn: (a, _api, _extra, fetch) => readAs(fetch, { url: "/crop-scans", params: a?.farmerId ? { farmerId: a.farmerId } : undefined }, readScans),
      providesTags: ["CropScan"],
    }),
  }),
});

export const { useUploadImageMutation, useDiagnoseMutation, useMyCropScansQuery, useDeleteCropScanMutation, useAllCropScansQuery } = cropScanApi;

/** Confidence as 0–100, whichever scale the backend sends (spec §10 Q6). */
export const confidencePct = (c: number) => Math.round(c <= 1 ? c * 100 : c);
