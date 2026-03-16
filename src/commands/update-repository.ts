import { createDeployer } from "../deployment";
import { loadRepositories, Repository } from "../project/repositories";
import { loadProjectSettings } from "../project/settings";
import { RepositoryNotFoundError } from "../errors";

interface UpdateProjectRepositoryOptions {
	name?: string;
	force: boolean;
}

export async function updateProjectRepository(
	options: UpdateProjectRepositoryOptions,
) {
	const settings = await loadProjectSettings();
	const repositorySettings = await loadRepositories();
	const deployer = createDeployer(settings.tool);

	const targets = options.name
		? repositorySettings.repositories.filter((r) => r.name === options.name)
		: repositorySettings.repositories;

	if (options.name && targets.length === 0) {
		throw new RepositoryNotFoundError(`Repository "${options.name}" not found`);
	}

	for (const entry of targets) {
		const repository = await Repository.fromDescription({
			name: entry.name,
			url: entry.url,
		});
		await deployer.deployRepository(
			repository,
			process.cwd(),
			options.force ?? false,
		);
	}
}
