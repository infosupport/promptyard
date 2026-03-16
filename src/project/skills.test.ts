import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { Skill, loadSkills } from "./skills";
import fs from "node:fs/promises";

function makeBunFile(content: string): ReturnType<typeof Bun.file> {
	return {
		text: () => Promise.resolve(content),
	} as unknown as ReturnType<typeof Bun.file>;
}

const originalBunFile = Bun.file.bind(Bun);

describe("Skill.fromDirectory", () => {
	beforeEach(() => {
		// @ts-expect-error
		Bun.file = (_path: string) => makeBunFile(fileContent);
	});

	afterEach(() => {
		Bun.file = originalBunFile;
	});

	let fileContent = "";

	it("reads name and description from frontmatter", async () => {
		fileContent =
			"---\nname: My Skill\ndescription: Does something useful\n---\nBody text";

		const skill = await Skill.fromDirectory("/some/path/my-skill");

		expect(skill.name).toBe("My Skill");
		expect(skill.description).toBe("Does something useful");
		expect(skill.path).toBe("/some/path/my-skill");
	});

	it("falls back to directory name when name is missing from frontmatter", async () => {
		fileContent = "---\ndescription: Does something useful\n---\nBody text";

		const skill = await Skill.fromDirectory("/some/path/my-skill");

		expect(skill.name).toBe("my-skill");
	});

	it("falls back to empty string when description is missing from frontmatter", async () => {
		fileContent = "---\nname: My Skill\n---\nBody text";

		const skill = await Skill.fromDirectory("/some/path/my-skill");

		expect(skill.description).toBe("");
	});

	it("falls back to directory name and empty description when frontmatter is absent", async () => {
		fileContent = "Just plain content without frontmatter";

		const skill = await Skill.fromDirectory("/some/path/my-skill");

		expect(skill.name).toBe("my-skill");
		expect(skill.description).toBe("");
	});
});

describe("Skill.copyTo", () => {
	let cpSpy: ReturnType<typeof spyOn>;
	let rmSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		cpSpy = spyOn(fs, "cp").mockResolvedValue(undefined);
		rmSpy = spyOn(fs, "rm").mockResolvedValue(undefined);
	});

	afterEach(() => {
		cpSpy.mockRestore();
		rmSpy.mockRestore();
	});

	it("removes the target directory before copying", async () => {
		const skill = new Skill("My Skill", "/src/my-skill", "A description");

		await skill.copyTo("/dest/my-skill");

		expect(rmSpy).toHaveBeenCalledWith("/dest/my-skill", {
			recursive: true,
			force: true,
		});
	});

	it("copies the directory to the target path recursively", async () => {
		const skill = new Skill("My Skill", "/src/my-skill", "A description");

		await skill.copyTo("/dest/my-skill");

		expect(cpSpy).toHaveBeenCalledWith("/src/my-skill", "/dest/my-skill", {
			recursive: true,
		});
	});
});

describe("loadSkills", () => {
	let readdirSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		readdirSpy = spyOn(fs, "readdir");

		// @ts-expect-error
		Bun.file = (_path: string) =>
			makeBunFile("---\nname: My Skill\ndescription: A description\n---\n");
	});

	afterEach(() => {
		readdirSpy.mockRestore();
		Bun.file = originalBunFile;
	});

	it("returns a skill for each entry in the directory", async () => {
		readdirSpy.mockResolvedValue(["skill-a", "skill-b"]);

		const skills = await loadSkills("/skills");

		expect(skills).toHaveLength(2);
		expect(skills[0]?.path).toBe("/skills/skill-a");
		expect(skills[1]?.path).toBe("/skills/skill-b");
	});

	it("returns an empty array when the directory is empty", async () => {
		readdirSpy.mockResolvedValue([]);

		const skills = await loadSkills("/skills");

		expect(skills).toEqual([]);
	});
});
