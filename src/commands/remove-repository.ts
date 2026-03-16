import { confirm } from "../confirm";
import { RepositoryNotFoundError } from "../errors";
import { loadRepositories, saveRepositories } from "../project/repositories";

interface RemoveProjectRepositoryOptions {
  name: string;
}

export async function removeProjectRepository(
  options: RemoveProjectRepositoryOptions,
) {
  const repositorySettings = await loadRepositories();

  const exists = repositorySettings.repositories.some(
    (r) => r.name === options.name,
  );

  if (!exists) {
    throw new RepositoryNotFoundError(
      `Repository "${options.name}" is not registered in this project.`,
    );
  }

  const confirmed = await confirm(
    `Remove repository "${options.name}" from the project? Any deployed content will be left behind.`,
  );

  if (!confirmed) {
    return;
  }

  const updated = repositorySettings.repositories.filter(
    (r) => r.name !== options.name,
  );

  await saveRepositories(
    {
      ...repositorySettings,
      repositories: updated,
    } as typeof repositorySettings,
    false,
  );
}
