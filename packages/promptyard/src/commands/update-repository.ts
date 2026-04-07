import os from "node:os";
import { createDeployer } from "../deployment";
import {
  loadRepositories,
  loadGlobalRepositories,
  Repository,
} from "../project/repositories";
import { loadProjectSettings, loadGlobalSettings } from "../project/settings";
import { RepositoryNotFoundError, ProjectNotInitializedError } from "../errors";

interface UpdateProjectRepositoryOptions {
  force: boolean;
  global: boolean;
}

export async function updateProjectRepository(
  name: string | undefined,
  options: UpdateProjectRepositoryOptions,
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
  const deployer = createDeployer(settings.tool);

  const targets = name
    ? repositorySettings.repositories.filter((r) => r.name === name)
    : repositorySettings.repositories;

  if (name && targets.length === 0) {
    throw new RepositoryNotFoundError(`Repository "${name}" not found`);
  }

  for (const entry of targets) {
    const repository = await Repository.fromDescription({
      name: entry.name,
      url: entry.url,
    });
    await deployer.deployRepository(repository, targetDirectory, options.force ?? false);
  }
}
