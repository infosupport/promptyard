import { describe, expect, it } from "bun:test";
import { createDeployer } from "./index";
import { ClaudeDeployer } from "./claude";
import { CopilotDeployer } from "./copilot";
import { OpenCodeDeployer } from "./opencode";

describe("createDeployer", () => {
	it("returns a CopilotDeployer for copilot", () => {
		expect(createDeployer("copilot")).toBeInstanceOf(CopilotDeployer);
	});

	it("returns an OpenCodeDeployer for opencode", () => {
		expect(createDeployer("opencode")).toBeInstanceOf(OpenCodeDeployer);
	});

	it("returns a ClaudeDeployer for claude", () => {
		expect(createDeployer("claude")).toBeInstanceOf(ClaudeDeployer);
	});
});
