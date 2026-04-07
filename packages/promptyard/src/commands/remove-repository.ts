import { confirm } from "../confirm";
import { RepositoryNotFoundError } from "../errors";
import {
  loadRepositories,
  loadGlobalRepositories,
  saveRepositories,
  saveGlobalRepositories,
} from "../project/repositories";

interface RemoveProjectRepositoryOptions {
  global: boolean;
}

export async function removeProjectRepository(
  name: string,
  options: RemoveProjectRepositoryOptions,
) {
  const repositorySettings = options.global
    ? await loadGlobalRepositories()
    : await loadRepositories();

  const saveSettings = options.global
    ? saveGlobalRepositories
    : (s: typeof repositorySettings) => saveRepositories(s, false);

  const exists = repositorySettings.repositories.some((r) => r.name === name);

  if (!exists) {
    throw new RepositoryNotFoundError(
      `Repository "${name}" is not registered in this project.`,
    );
  }

  const confirmed = await confirm(
    `Remove repository "${name}" from the project? Any deployed content will be left behind.`,
  );

  if (!confirmed) {
    return;
  }

  const updated = repositorySettings.repositories.filter(
    (r) => r.name !== name,
  );

  const updatedSettings = {
    ...repositorySettings,
    repositories: updated,
  } as typeof repositorySettings;

  await saveSettings(updatedSettings);
}
