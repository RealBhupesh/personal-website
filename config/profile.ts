import { content } from "./content";
export const profile = content.profile;
export const getFaqs = (mergedPrCount: number, mergedProjectCount: number) =>
  content.faqs.map((f) => ({
    ...f,
    answer: f.answer.replace(
      /\{(mergedPrCount|mergedProjectCount|location|email)\}/g,
      (_, key: string) =>
        String(
          (
            {
              mergedPrCount,
              mergedProjectCount,
              location: profile.location,
              email: content.site.email,
            } as Record<string, string | number>
          )[key],
        ),
    ),
  }));
