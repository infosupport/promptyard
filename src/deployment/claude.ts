import fs from "node:fs/promises";
import type { Agent } from "../project/agents";
import type { Repository } from "../project/repositories";
import type { Skill } from "../project/skills";
import type { Deployer } from "./base";
import { confirm } from "../confirm";

export class ClaudeDeployer implements Deployer {
  async deployRepository(
    repo: Repository,
    targetDirectory: string,
    force: boolean,
  ): Promise<void> {
    await Promise.all([
      this.deploySkills(targetDirectory, repo.skills, force),
      this.deployAgents(targetDirectory, repo.agents, force),
    ]);
  }

  private async deploySkills(
    targetDirectory: string,
    skills: Skill[],
    force: boolean,
  ): Promise<void> {
    const outputSkillsDirectory = `${targetDirectory}/.claude/skills/`;

    for (const skill of skills) {
      const outputSkillPath = `${outputSkillsDirectory}${skill.name}/`;

      const exists = await fs
        .access(outputSkillPath)
        .then(() => true)
        .catch(() => false);

      if (exists && !force) {
        const confirmed = await confirm(
          `Skill "${skill.name}" already exists. Replace it?`,
        );
        if (!confirmed) continue;
      }

      await skill.copyTo(outputSkillPath);
    }
  }

  private async deployAgents(
    targetDirectory: string,
    agents: Agent[],
    force: boolean,
  ): Promise<void> {
    const outputAgentsDirectory = `${targetDirectory}/.claude/agents/`;

    for (const agent of agents) {
      const outputAgentPath = `${outputAgentsDirectory}${agent.name}/`;
      await agent.copyTo(outputAgentPath, force);
    }
  }
}
