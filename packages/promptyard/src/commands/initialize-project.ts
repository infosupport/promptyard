import {
  saveRepositories,
  saveGlobalRepositories,
  type RepositorySettings,
} from "../project/repositories";
import {
  saveProjectSettings,
  saveGlobalSettings,
  getGlobalConfigDir,
  type ProjectSettings,
} from "../project/settings";
import path from "node:path";

interface InitializeProjectOptions {
  tool: "claude" | "copilot" | "opencode";
  force: boolean;
  global: boolean;
}

export async function initializeProject(options: InitializeProjectOptions) {
  const settings: ProjectSettings = {
    tool: options.tool,
  };

  const repositories: RepositorySettings = { repositories: [] } as unknown as RepositorySettings;

  if (options.global) {
    await saveGlobalSettings(settings);
    await saveGlobalRepositories(repositories);
    console.log(`Initialized global config for ${options.tool} in ${getGlobalConfigDir()}`);
  } else {
    await saveProjectSettings(settings, true);
    await saveRepositories(repositories, true);
    console.log(`Initialized project for ${options.tool} in ${path.join(process.cwd(), ".promptyard")}`);
  }
}
