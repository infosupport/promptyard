import type { Deployer } from "./base";
import { ClaudeDeployer } from "./claude";
import { CodexDeployer } from "./codex";
import { CopilotDeployer } from "./copilot";
import { OpenCodeDeployer } from "./opencode";

export function createDeployer(
  tool: "copilot" | "opencode" | "claude" | "codex",
): Deployer {
  switch (tool) {
    case "copilot":
      return new CopilotDeployer();
    case "opencode":
      return new OpenCodeDeployer();
    case "claude":
      return new ClaudeDeployer();
    case "codex":
      return new CodexDeployer();
    default:
      throw new Error(`Unsupported tool: ${tool}`);
  }
}
