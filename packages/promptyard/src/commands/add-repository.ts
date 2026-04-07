import os from "node:os";
import { createDeployer } from "../deployment";
import {
  loadRepositories,
  loadGlobalRepositories,
  saveRepositories,
  saveGlobalRepositories,
  Repository,
} from "../project/repositories";
import { loadProjectSettings, loadGlobalSettings } from "../project/settings";
import { ProjectNotInitializedError } from "../errors";

interface AddProjectRepositoryOptions {
  force: boolean;
  global: boolean;
}

export async function addProjectRepository(
  name: string,
  url: string,
  options: AddProjectRepositoryOptions,
) {
  const settings = options.global
    ? await loadGlobalSettings()
    : await loadProjectSettings();

  if (!settings) {
    throw new ProjectNotInitializedError(
      "No global settings found. Run 'promptyard init --global --tool <tool>' first.",
    );
  }

  const repositorySettings = options.global
    ? await loadGlobalRepositories()
    : await loadRepositories();

  const targetDirectory = options.global ? os.homedir() : process.cwd();
  const saveSettings = options.global ? saveGlobalRepositories : (s: typeof repositorySettings) => saveRepositories(s, false);

  const repository = await Repository.fromDescription({ name, url });
  const deployer = createDeployer(settings.tool);
  await deployer.deployRepository(repository, targetDirectory, options.force);

  repositorySettings.repositories.push({ name: repository.name, url: repository.url });

  await saveSettings(repositorySettings);
}
