import type { Repository } from "../project/repositories";

export interface Deployer {
	deployRepository(
		repository: Repository,
		targetDirectoryPath: string,
		force: boolean,
	): Promise<void>;
}
