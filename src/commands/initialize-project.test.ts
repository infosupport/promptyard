import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { initializeProject } from "./initialize-project";

const originalBunFile = Bun.file.bind(Bun);

function makeBunFile(
	onWrite?: (data: string) => void,
): ReturnType<typeof Bun.file> {
	return {
		exists: () => Promise.resolve(false),
		text: () => Promise.resolve(""),
		write: (data: string) => {
			if (onWrite) onWrite(data);
			return Promise.resolve();
		},
	} as unknown as ReturnType<typeof Bun.file>;
}

describe("initializeProject", () => {
	let writtenFiles: Record<string, string> = {};

	beforeEach(() => {
		writtenFiles = {};

		// @ts-expect-error
		Bun.file = (path: string) =>
			makeBunFile((data) => {
				writtenFiles[path] = data;
			});
	});

	afterEach(() => {
		Bun.file = originalBunFile;
	});

	it("writes settings file with the provided tool", async () => {
		await initializeProject({ tool: "claude", force: false });

		const settings = JSON.parse(
			writtenFiles[".promptyard/settings.json"] ?? "",
		);
		expect(settings.tool).toBe("claude");
	});

	it("writes an empty repositories file", async () => {
		await initializeProject({ tool: "claude", force: false });

		const repos = JSON.parse(
			writtenFiles[".promptyard/repositories.json"] ?? "",
		);
		expect(repos.repositories).toEqual([]);
	});
});
