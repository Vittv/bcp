// the preview flag is stripped before the simulated crash, so Refresh returns
// to the app instead of looping back into the fallback
const PARAM = "preview";
const VALUE = "error";

export function isErrorPreview(search: string): boolean {
  return new URLSearchParams(search).get(PARAM) === VALUE;
}

export function clearErrorPreview(href: string): string {
  const url = new URL(href);
  url.searchParams.delete(PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function ErrorPreviewCrash(): never {
  throw new Error("Preview: simulated render failure");
}
