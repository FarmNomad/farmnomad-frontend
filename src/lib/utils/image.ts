export function productImageSrc(raw?: string) {
  if (!raw) return "/images/placeholder.png";
  if (/^https?:\/\//i.test(raw)) return raw; // already absolute
  if (raw.startsWith("data:image")) return raw; // data URI

  // build absolute URL from env
  const api = process.env.NEXT_PUBLIC_API_URL || "";
  const fileBaseExplicit = process.env.NEXT_PUBLIC_FILE_BASE;
  const fileBase = fileBaseExplicit ?? api.replace(/\/api\/?$/, "");
  if (raw.startsWith("/")) return `${fileBase}${raw}`;
  return "/images/placeholder.png";
}

// // src/lib/utils/image.ts
// export function productImageSrc(raw?: string) {
//   if (!raw) return "/images/placeholder.png";

//   // already absolute?
//   if (/^https?:\/\//i.test(raw)) return raw;

//   // data URI?
//   if (raw.startsWith("data:image")) return raw;

//   // relative /uploads/... → prefix with backend base (strip "/api" from env)
//   const api = process.env.NEXT_PUBLIC_API_URL || ""; // e.g., http://localhost:9000/api
//   const fileBase = api.replace(/\/api\/?$/, ""); // → http://localhost:9000
//   if (raw.startsWith("/")) return `${fileBase}${raw}`; // → http://localhost:9000/uploads/...

//   // anything else → fallback
//   return "/images/placeholder.png";
// }
