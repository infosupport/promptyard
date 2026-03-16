import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { updateProjectRepository } from "./update-repository";
import * as settingsModule from "../project/settings";
import * as repositoriesModule from "../project/repositories";
import { Repository } from "../project/repositories";
import * as deploymentModule from "../deployment";
import { RepositoryNotFoundError } from "../errors";

const fakeRepository = new Repository(
	"my-repo",
	"https://example.com/repo.git",
	"/tmp/my-repo",
	[],
	[],
);

const fakeSettings = { tool: "opencode" as const };

const fakeRepositorySettings = {
	repositories: [
		{ name: "my-repo", url: "https://example.com/repo.git" },
		{ name: "other-repo", url: "https://example.com/other.git" },
	],
};

describe("updateProjectRepository", () => {
	let loadSettingsSpy: ReturnType<typeof spyOn>;
	let loadRepositoriesSpy: ReturnType<typeof spyOn>;
	let saveRepositoriesSpy: ReturnType<typeof spyOn>;
	let fromDescriptionSpy: ReturnType<typeof spyOn>;
	let createDeployerSpy: ReturnType<typeof spyOn>;
	let deployRepositorySpy: ReturnType<typeof spyOn>;

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
		deployRepositorySpy = spyOn(
			fakeDeployer,
			"deployRepository",
		).mockResolvedValue(undefined);
	});

	afterEach(() => {
		loadSettingsSpy.mockRestore();
		loadRepositoriesSpy.mockRestore();
		saveRepositoriesSpy.mockRestore();
		fromDescriptionSpy.mockRestore();
		createDeployerSpy.mockRestore();
		deployRepositorySpy.mockRestore();
	});

	it("throws RepositoryNotFoundError when named repo doesn't exist", async () => {
		await expect(
			updateProjectRepository({ name: "nonexistent", force: false }),
		).rejects.toThrow(RepositoryNotFoundError);
	});

	it("deploys the named repository with force=true when --force is passed", async () => {
		await updateProjectRepository({ name: "my-repo", force: true });

		expect(deployRepositorySpy).toHaveBeenCalledWith(
			fakeRepository,
			process.cwd(),
			true,
		);
	});

	it("deploys the named repository with force=false when --force is not passed", async () => {
		await updateProjectRepository({ name: "my-repo", force: false });

		expect(deployRepositorySpy).toHaveBeenCalledWith(
			fakeRepository,
			process.cwd(),
			false,
		);
	});

	it("deploys all repositories when no name is provided", async () => {
		await updateProjectRepository({ force: false });

		expect(deployRepositorySpy).toHaveBeenCalledTimes(2);
	});

	it("does not call saveRepositories", async () => {
		await updateProjectRepository({ name: "my-repo", force: false });

		expect(saveRepositoriesSpy).not.toHaveBeenCalled();
	});
});
