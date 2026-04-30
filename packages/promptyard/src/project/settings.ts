import { JSON5 } from "bun";
import { z } from "zod";
import { ProjectNotInitializedError } from "../errors";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export class SettingsParseError extends Error {
  errors: string[];
  constructor(message: string, errors: string[]) {
    super(message);
    this.errors = errors;
  }
}

export const projectSettingsSchema = z.object({
  tool: z.enum(["claude", "copilot", "opencode", "codex"]).nonoptional(),
});

export type ProjectSettings = z.infer<typeof projectSettingsSchema>;

export function getGlobalConfigDir(): string {
  const home = os.homedir();
  return process.platform === "win32"
    ? path.join(home, ".promptyard")
    : path.join(home, ".config", "promptyard");
}

export async function loadProjectSettings(): Promise<ProjectSettings> {
  const globalProjectSettings = await loadGlobalProjectSettings();
  const localProjectSettings = await loadLocalProjectSettings();

  if (globalProjectSettings) {
    return { ...globalProjectSettings, ...localProjectSettings };
  }

  return localProjectSettings;
}

export async function saveProjectSettings(
  settings: ProjectSettings,
  initialize: boolean = false,
) {
  const settingsFile = Bun.file(".promptyard/settings.json");

  if (!initialize && !(await settingsFile.exists())) {
    throw new ProjectNotInitializedError(
      "No local settings found. Run the `init` command to configure the project.",
    );
  }

  await settingsFile.write(JSON.stringify(settings, null, 2));
}

export async function loadGlobalSettings(): Promise<ProjectSettings | undefined> {
  return loadGlobalProjectSettings();
}

export async function saveGlobalSettings(settings: ProjectSettings): Promise<void> {
  const configDir = getGlobalConfigDir();
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(path.join(configDir, "settings.json"), JSON.stringify(settings, null, 2));
}

async function loadGlobalProjectSettings(): Promise<
  ProjectSettings | undefined
> {
  const globalSettingsFile = Bun.file(
    path.join(getGlobalConfigDir(), "settings.json"),
  );

  if (!(await globalSettingsFile.exists())) {
    return undefined;
  }

  const settingsFileContent = await globalSettingsFile.text();

  const parseSettingsResult = projectSettingsSchema.safeParse(
    JSON5.parse(settingsFileContent),
  );

  if (!parseSettingsResult.success) {
    throw new SettingsParseError(
      "Failed to parse settings file",
      z.treeifyError(parseSettingsResult.error).errors,
    );
  }

  return parseSettingsResult.data;
}

async function loadLocalProjectSettings(): Promise<ProjectSettings> {
  const localSettingsFile = Bun.file(".promptyard/settings.json");

  if (!(await localSettingsFile.exists())) {
    throw new ProjectNotInitializedError(
      "No local project settings found. Run the `init` command to create a settings file.",
    );
  }

  const settingsFileContent = await localSettingsFile.text();

  const parseSettingsResult = projectSettingsSchema.safeParse(
    JSON5.parse(settingsFileContent),
  );

  if (!parseSettingsResult.success) {
    throw new SettingsParseError(
      "Failed to parse settings file",
      z.treeifyError(parseSettingsResult.error).errors,
    );
  }

  return parseSettingsResult.data;
}
