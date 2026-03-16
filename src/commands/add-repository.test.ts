import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { addProjectRepository } from "./add-repository";
import * as settingsModule from "../project/settings";
import * as repositoriesModule from "../project/repositories";
import { Repository } from "../project/repositories";
import * as deploymentModule from "../deployment";

const fakeRepository = new Repository(
	"my-repo",
	"https://example.com/repo.git",
	"/tmp/my-repo",
	[],
	[],
);

const fakeSettings = { tool: "opencode" as const };

const fakeRepositorySettings = {
	repositories: [{ name: "existing", url: "https://example.com/existing.git" }],
};

describe("addProjectRepository", () => {
	let loadSettingsSpy: ReturnType<typeof spyOn>;
	let loadRepositoriesSpy: ReturnType<typeof spyOn>;
	let saveRepositoriesSpy: ReturnType<typeof spyOn>;
	let fromDescriptionSpy: ReturnType<typeof spyOn>;
	let createDeployerSpy: ReturnType<typeof spyOn>;

	const fakeDeployer = {
		deployRepository: async () => {},
	};

	beforeEach(() => {
		loadSettingsSpy = spyOn(
			settingsModule,
			"loadProjectSettings",
		).mockResolvedValue(fakeSettings);
		loadRepositoriesSpy = spyOn(
			repositoriesModule,
			"loadRepositories",
		).mockResolvedValue(
			structuredClone(fakeRepositorySettings) as typeof fakeRepositorySettings,
		);
		saveRepositoriesSpy = spyOn(
			repositoriesModule,
			"saveRepositories",
		).mockResolvedValue(undefined);
		fromDescriptionSpy = spyOn(Repository, "fromDescription").mockResolvedValue(
			fakeRepository,
		);
		createDeployerSpy = spyOn(
			deploymentModule,
			"createDeployer",
		).mockReturnValue(fakeDeployer);
		spyOn(fakeDeployer, "deployRepository").mockResolvedValue(undefined);
	});

	afterEach(() => {
		loadSettingsSpy.mockRestore();
		loadRepositoriesSpy.mockRestore();
		saveRepositoriesSpy.mockRestore();
		fromDescriptionSpy.mockRestore();
		createDeployerSpy.mockRestore();
	});

	it("creates a deployer for the configured tool", async () => {
		await addProjectRepository({
			name: "my-repo",
			url: "https://example.com/repo.git",
			force: false,
		});

		expect(createDeployerSpy).toHaveBeenCalledWith("opencode");
	});

	it("clones the repository from the provided URL", async () => {
		await addProjectRepository({
			name: "my-repo",
			url: "https://example.com/repo.git",
			force: false,
		});

		expect(fromDescriptionSpy).toHaveBeenCalledWith({
			name: "my-repo",
			url: "https://example.com/repo.git",
		});
	});

	it("deploys the repository passing the force flag", async () => {
		await addProjectRepository({
			name: "my-repo",
			url: "https://example.com/repo.git",
			force: true,
		});

		expect(fakeDeployer.deployRepository).toHaveBeenCalledWith(
			fakeRepository,
			process.cwd(),
			true,
		);
	});

	it("adds the repository to the saved settings", async () => {
		await addProjectRepository({
			name: "my-repo",
			url: "https://example.com/repo.git",
			force: false,
		});

		const [savedSettings] = saveRepositoriesSpy.mock.calls[0] as [
			typeof fakeRepositorySettings,
		];
		expect(savedSettings.repositories).toContainEqual({
			name: "my-repo",
			url: "https://example.com/repo.git",
		});
	});

	it("preserves existing repositories when adding a new one", async () => {
		await addProjectRepository({
			name: "my-repo",
			url: "https://example.com/repo.git",
			force: false,
		});

		const [savedSettings] = saveRepositoriesSpy.mock.calls[0] as [
			typeof fakeRepositorySettings,
		];
		expect(savedSettings.repositories).toContainEqual({
			name: "existing",
			url: "https://example.com/existing.git",
		});
	});
});
