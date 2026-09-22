import { existsSync } from "node:fs";
import { join } from "node:path";

export function resumePdfExists() {
  return existsSync(join(process.cwd(), "public", "resume.pdf"));
}
