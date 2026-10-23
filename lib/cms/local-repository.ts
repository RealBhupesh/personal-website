import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  open,
  unlink,
} from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { CmsError, digest } from "./model.ts";
import {
  checkPath,
  type Repository,
  type Change,
  type Revision,
} from "./repository.ts";

// Explicit development workspace. It is never used in production.
export class LocalRepository implements Repository {
  readonly root: string;
  constructor(root: string) {
    this.root = root;
  }
  async read(path: string, ref?: string) {
    checkPath(path);
    try {
      const content = await readFile(
        ref
          ? join(this.root, ".history", ref, Buffer.from(path).toString("hex"))
          : join(this.root, path),
        "utf8",
      );
      return { content, sha: digest(content) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  async list(prefix: string) {
    checkPath(prefix);
    async function walk(root: string, rel: string): Promise<string[]> {
      try {
        const entries = await readdir(join(root, rel), { withFileTypes: true });
        return (
          await Promise.all(
            entries.map((e) =>
              e.isDirectory()
                ? walk(root, `${rel}/${e.name}`)
                : Promise.resolve([`${rel}/${e.name}`]),
            ),
          )
        ).flat();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw error;
      }
    }
    return walk(this.root, prefix);
  }
  async lock<T>(action: () => Promise<T>): Promise<T> {
    await mkdir(this.root, { recursive: true });
    let lock;
    try {
      lock = await open(join(this.root, ".lock"), "wx");
    } catch {
      throw new CmsError("Another save is in progress. Please retry.", 409);
    }
    try {
      return await action();
    } finally {
      await lock.close();
      await unlink(join(this.root, ".lock"));
    }
  }
  async write(
    path: string,
    content: string,
    expected: string | null,
    message: string,
  ) {
    checkPath(path);
    return this.lock(async () => {
      const current = await this.read(path);
      if ((current?.sha ?? null) !== expected)
        throw new CmsError(
          "This draft changed in another window. Reload the saved version or export your text.",
          409,
        );
      const id = randomUUID();
      const date = new Date().toISOString();
      const historyDir = join(this.root, ".history", id);
      await mkdir(historyDir, { recursive: true });
      await writeFile(
        join(historyDir, Buffer.from(path).toString("hex")),
        content,
      );
      await writeFile(
        join(historyDir, "meta.json"),
        JSON.stringify({ id, date, message, path }),
      );
      await mkdir(join(this.root, path, ".."), { recursive: true });
      await writeFile(join(this.root, path), content);
      return digest(content);
    });
  }
  async history(path: string): Promise<Revision[]> {
    checkPath(path);
    try {
      const dirs = await readdir(join(this.root, ".history"));
      const records = await Promise.all(
        dirs.map(async (id) =>
          JSON.parse(
            await readFile(
              join(this.root, ".history", id, "meta.json"),
              "utf8",
            ),
          ),
        ),
      );
      return records
        .filter((r) => r.path === path)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
  async head() {
    return "local";
  }
  async publish(changes: Change[]) {
    // Local publication updates the checkout, not GitHub. The UI states this explicitly.
    for (const change of changes) {
      checkPath(change.path);
      await mkdir(join(this.root, change.path, ".."), { recursive: true });
      if (change.content === null) {
        await unlink(join(this.root, change.path)).catch((e) => {
          if (e.code !== "ENOENT") throw e;
        });
      } else
        await writeFile(
          join(this.root, change.path),
          Buffer.from(
            change.content,
            change.encoding === "base64" ? "base64" : "utf8",
          ),
        );
    }
    return "local";
  }
  async status() {
    return { state: "local" };
  }
}
