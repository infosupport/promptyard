import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import fs from "node:fs/promises";
import { ClaudeDeployer } from "./claude";
import * as confirmModule from "../confirm";
import { Skill } from "../project/skills";
import { Agent } from "../project/agents";
import type { Repository } from "../project/repositories";

function makeRepository(skills: Skill[], agents: Agent[] = []): Repository {
	return { skills, agents } as unknown as Repository;
}

describe("ClaudeDeployer.deployRepository skills", () => {
	let accessSpy: ReturnType<typeof spyOn>;
	let confirmSpy: ReturnType<typeof spyOn>;
	let copyToSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		accessSpy = spyOn(fs, "access");
		confirmSpy = spyOn(confirmModule, "confirm");
		copyToSpy = spyOn(Skill.prototype, "copyTo").mockResolvedValue(undefined);
	});

	afterEach(() => {
		accessSpy.mockRestore();
		confirmSpy.mockRestore();
		copyToSpy.mockRestore();
	});

	it("copies without confirmation when target does not exist", async () => {
		accessSpy.mockRejectedValue(new Error("not found"));
		const skill = new Skill("my-skill", "/src/my-skill", "A description");
		const deployer = new ClaudeDeployer();

		await deployer.deployRepository(makeRepository([skill]), "/target", false);

		expect(confirmSpy).not.toHaveBeenCalled();
		expect(copyToSpy).toHaveBeenCalledWith("/target/.claude/skills/my-skill/");
	});

	it("copies without confirmation when force is true and target exists", async () => {
		accessSpy.mockResolvedValue(undefined);
		const skill = new Skill("my-skill", "/src/my-skill", "A description");
		const deployer = new ClaudeDeployer();

		await deployer.deployRepository(makeRepository([skill]), "/target", true);

		expect(confirmSpy).not.toHaveBeenCalled();
		expect(copyToSpy).toHaveBeenCalledWith("/target/.claude/skills/my-skill/");
	});

	it("asks for confirmation when target exists and force is false", async () => {
		accessSpy.mockResolvedValue(undefined);
		confirmSpy.mockResolvedValue(true);
		const skill = new Skill("my-skill", "/src/my-skill", "A description");
		const deployer = new ClaudeDeployer();

		await deployer.deployRepository(makeRepository([skill]), "/target", false);

		expect(confirmSpy).toHaveBeenCalledWith(
			'Skill "my-skill" already exists. Replace it?',
		);
		expect(copyToSpy).toHaveBeenCalledWith("/target/.claude/skills/my-skill/");
	});

	it("skips copying when confirmation is denied", async () => {
		accessSpy.mockResolvedValue(undefined);
		confirmSpy.mockResolvedValue(false);
		const skill = new Skill("my-skill", "/src/my-skill", "A description");
		const deployer = new ClaudeDeployer();

		await deployer.deployRepository(makeRepository([skill]), "/target", false);

		expect(confirmSpy).toHaveBeenCalled();
		expect(copyToSpy).not.toHaveBeenCalled();
	});
});

describe("ClaudeDeployer.deployRepository agents", () => {
	let copyToSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		copyToSpy = spyOn(Agent.prototype, "copyTo").mockResolvedValue(undefined);
	});

	afterEach(() => {
		copyToSpy.mockRestore();
	});

	it("copies agent without confirmation", async () => {
		const agent = new Agent("my-agent", "An agent", "/src/my-agent.md");
		const deployer = new ClaudeDeployer();

		await deployer.deployRepository(makeRepository([], [agent]), "/target", false);

		expect(copyToSpy).toHaveBeenCalledWith(
			"/target/.claude/agents/my-agent/",
			false,
		);
	});

	it("passes force flag to agent copyTo", async () => {
		const agent = new Agent("my-agent", "An agent", "/src/my-agent.md");
		const deployer = new ClaudeDeployer();

		await deployer.deployRepository(makeRepository([], [agent]), "/target", true);

		expect(copyToSpy).toHaveBeenCalledWith(
			"/target/.claude/agents/my-agent/",
			true,
		);
	});
});
