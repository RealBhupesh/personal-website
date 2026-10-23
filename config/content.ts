import data from "@/data/site-content.json";
import { siteContentSchema } from "@/lib/cms/site-model";
/** Published data only. Private dashboard drafts never enter public rendering. */
export const content = siteContentSchema.parse(data);
