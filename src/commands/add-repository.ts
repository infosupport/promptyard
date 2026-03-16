import { createDeployer } from "../deployment";
import {
	loadRepositories,
	Repository,
	saveRepositories,
} from "../project/repositories";
import { loadProjectSettings } from "../project/settings";

interface AddProjectRepositoryOptions {
	name: string;
	url: string;
	force: boolean;
}

export async function addProjectRepository(
	options: AddProjectRepositoryOptions,
) {
	const settings = await loadProjectSettings();
	const repositorySettings = await loadRepositories();

	const repository = await Repository.fromDescription({
		name: options.name,
		url: options.url,
	});

	const deployer = createDeployer(settings.tool);
	await deployer.deployRepository(repository, process.cwd(), options.force);

	repositorySettings.repositories.push({
		name: repository.name,
		url: repository.url,
	});

	await saveRepositories(repositorySettings, false);
}
