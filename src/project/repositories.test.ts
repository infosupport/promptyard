import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { ProjectNotInitializedError } from "../errors";
import {
	RepositoriesParseError,
	Repository,
	loadRepositories,
	saveRepositories,
} from "./repositories";
import fs from "node:fs/promises";
import * as repositories from "./repositories";

function makeBunFile(
	content: string | null,
	onWrite?: (data: string) => void,
): ReturnType<typeof Bun.file> {
	return {
		exists: () => Promise.resolve(content !== null),
		text: () => Promise.resolve(content ?? ""),
		write: (data: string) => {
			if (onWrite) onWrite(data);
			return Promise.resolve();
		},
	} as unknown as ReturnType<typeof Bun.file>;
}

const originalBunFile = Bun.file.bind(Bun);

describe("loadRepositories", () => {
	let fileContent: string | null = null;

	beforeEach(() => {
		fileContent = null;

		// @ts-expect-error
		Bun.file = (_path: string) => makeBunFile(fileContent);
	});

	afterEach(() => {
		Bun.file = originalBunFile;
	});

	it("returns repositories when file is valid", async () => {
		fileContent = JSON.stringify({
			repositories: [{ name: "my-repo", url: "https://example.com/repo.git" }],
		});

		const result = await loadRepositories();

		expect(result.repositories).toEqual([
			{ name: "my-repo", url: "https://example.com/repo.git" },
		]);
	});

	it("throws ProjectNotInitializedError when file is missing", async () => {
		fileContent = null;

		expect(loadRepositories()).rejects.toThrow(ProjectNotInitializedError);
	});

	it("throws RepositoriesParseError when repositories array is empty", async () => {
		fileContent = JSON.stringify({ repositories: [] });

		expect(loadRepositories()).rejects.toThrow(RepositoriesParseError);
	});

	it("throws RepositoriesParseError when a repository has an invalid name", async () => {
		fileContent = JSON.stringify({
			repositories: [{ name: "-invalid", url: "https://example.com/repo.git" }],
		});

		expect(loadRepositories()).rejects.toThrow(RepositoriesParseError);
	});

	it("throws RepositoriesParseError when a repository has an invalid url", async () => {
		fileContent = JSON.stringify({
			repositories: [{ name: "my-repo", url: "not-a-url" }],
		});

		expect(loadRepositories()).rejects.toThrow(RepositoriesParseError);
	});

	it("throws RepositoriesParseError when repositories field is missing", async () => {
		fileContent = JSON.stringify({});

		expect(loadRepositories()).rejects.toThrow(RepositoriesParseError);
	});
});

describe("saveRepositories", () => {
	let fileExists = false;
	let writtenData: string | null = null;

	beforeEach(() => {
		fileExists = false;
		writtenData = null;

		// @ts-expect-error
		Bun.file = (_path: string) =>
			makeBunFile(fileExists ? "{}" : null, (data) => {
				writtenData = data;
			});
	});

	afterEach(() => {
		Bun.file = originalBunFile;
	});

	it("throws ProjectNotInitializedError when file is missing", async () => {
		fileExists = false;

		const settings = {
			repositories: [{ name: "my-repo", url: "https://example.com/repo.git" }],
		};

		expect(saveRepositories(settings)).rejects.toThrow(
			ProjectNotInitializedError,
		);
	});

	it("writes serialized settings to file", async () => {
		fileExists = true;

		const settings = {
			repositories: [{ name: "my-repo", url: "https://example.com/repo.git" }],
		};

		await saveRepositories(settings);

		expect(JSON.parse(writtenData ?? "")).toEqual(settings);
	});

	it("does not throw when file is missing and initialize is true", async () => {
		fileExists = false;

		const settings = {
			repositories: [{ name: "my-repo", url: "https://example.com/repo.git" }],
		};

		await saveRepositories(settings, true);

		expect(JSON.parse(writtenData ?? "")).toEqual(settings);
	});
});

describe("Repository.fromDescription", () => {
	let cloneSpy: ReturnType<typeof spyOn>;
	let accessSpy: ReturnType<typeof spyOn>;
	let readdirSpy: ReturnType<typeof spyOn>;

	const agentContent = "---\nname: My Agent\ndescription: Does things\n---\n";
	const skillContent = "---\nname: My Skill\ndescription: A skill\n---\n";

	beforeEach(() => {
		cloneSpy = spyOn(repositories, "cloneRepository").mockResolvedValue(
			undefined,
		);
		accessSpy = spyOn(fs, "access");
		readdirSpy = spyOn(fs, "readdir");

		// @ts-expect-error
		Bun.file = (_path: string) => {
			if (_path.includes("agents"))
				return { text: () => Promise.resolve(agentContent) } as ReturnType<
					typeof Bun.file
				>;
			return { text: () => Promise.resolve(skillContent) } as ReturnType<
				typeof Bun.file
			>;
		};
	});

	afterEach(() => {
		cloneSpy.mockRestore();
		accessSpy.mockRestore();
		readdirSpy.mockRestore();

		Bun.file = originalBunFile;
	});

	it("returns a repository with agents and skills when both directories exist", async () => {
		accessSpy.mockResolvedValue(undefined);

		readdirSpy.mockImplementation((dirPath: string) => {
			if (dirPath.includes("agents")) return Promise.resolve(["agent.md"]);
			return Promise.resolve(["my-skill"]);
		});

		const repo = await Repository.fromDescription({
			name: "my-repo",
			url: "https://example.com/repo.git",
		});

		expect(repo.name).toBe("my-repo");
		expect(repo.url).toBe("https://example.com/repo.git");
		expect(repo.agents).toHaveLength(1);
		expect(repo.skills).toHaveLength(1);
	});

	it("returns empty agents when agents directory does not exist", async () => {
		accessSpy.mockImplementation((dirPath: string) => {
			if (dirPath.includes("agents"))
				return Promise.reject(new Error("ENOENT"));
			return Promise.resolve(undefined);
		});

		readdirSpy.mockResolvedValue(["my-skill"]);

		const repo = await Repository.fromDescription({
			name: "my-repo",
			url: "https://example.com/repo.git",
		});

		expect(repo.agents).toEqual([]);
		expect(repo.skills).toHaveLength(1);
	});

	it("returns empty skills when skills directory does not exist", async () => {
		accessSpy.mockImplementation((dirPath: string) => {
			if (dirPath.includes("skills"))
				return Promise.reject(new Error("ENOENT"));
			return Promise.resolve(undefined);
		});

		readdirSpy.mockResolvedValue(["agent.md"]);

		const repo = await Repository.fromDescription({
			name: "my-repo",
			url: "https://example.com/repo.git",
		});

		expect(repo.skills).toEqual([]);
		expect(repo.agents).toHaveLength(1);
	});
});
