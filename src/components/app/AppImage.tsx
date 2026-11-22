import Image, { type ImageProps } from "next/image";

const OPTIMISED_HOSTS = new Set(["res.cloudinary.com", "farmnomad-backend.onrender.com"]);

/**
 * next/image throws, taking the whole page down, for a host that isn't in next.config. Photo
 * URLs come from the API and can point anywhere, so those are shown unoptimised instead.
 */
export default function AppImage(props: ImageProps) {
  const { src, unoptimized } = props;
  let plain = !!unoptimized;
  if (!plain && typeof src === "string" && !/^\/(?!\/)/.test(src)) {
    try {
      const url = new URL(src);
      plain = url.protocol !== "https:" || !OPTIMISED_HOSTS.has(url.hostname);
    } catch {
      plain = true;
    }
  }
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is required by ImageProps and passed through
  return <Image {...props} unoptimized={plain} />;
}
