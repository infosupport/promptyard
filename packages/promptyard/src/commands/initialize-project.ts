import {
  saveRepositories,
  type RepositorySettings,
} from "../project/repositories";
import { saveProjectSettings, type ProjectSettings } from "../project/settings";

interface InitializeProjectOptions {
  tool: "claude" | "copilot" | "opencode";
  force: boolean;
}

export async function initializeProject(options: InitializeProjectOptions) {
  const settings: ProjectSettings = {
    tool: options.tool,
  };

  const repositories: RepositorySettings = { repositories: [] };

  await saveProjectSettings(settings, true);
  await saveRepositories(repositories, true);
}
