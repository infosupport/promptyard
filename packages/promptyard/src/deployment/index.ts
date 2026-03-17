import type { Deployer } from "./base";
import { ClaudeDeployer } from "./claude";
import { CopilotDeployer } from "./copilot";
import { OpenCodeDeployer } from "./opencode";

export function createDeployer(
  tool: "copilot" | "opencode" | "claude",
): Deployer {
  switch (tool) {
    case "copilot":
      return new CopilotDeployer();
    case "opencode":
      return new OpenCodeDeployer();
    case "claude":
      return new ClaudeDeployer();
    default:
      throw new Error(`Unsupported tool: ${tool}`);
  }
}
