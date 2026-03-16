import { matter } from "../frontmatter";
import path from "node:path";
import fs from "node:fs/promises";
import { confirm } from "../confirm";

interface AgentMetadata {
  name: string;
  description: string;
}

export class Agent {
  name: string;
  description: string;
  filePath: string;

  constructor(name: string, description: string, filePath: string) {
    this.name = name;
    this.description = description;
    this.filePath = filePath;
  }

  static async fromFile(filePath: string): Promise<Agent> {
    const [agentMetadata] = matter<AgentMetadata>(
      await Bun.file(filePath).text(),
    );

    return new Agent(agentMetadata.name, agentMetadata.description, filePath);
  }

  async copyTo(targetPath: string, force: boolean): Promise<void> {
    const exists = await fs
      .access(targetPath)
      .then(() => true)
      .catch(() => false);

    if (exists && !force) {
      const confirmed = await confirm(
        `Agent "${this.name}" already exists. Replace it?`,
      );
      if (!confirmed) return;
    }

    await fs.cp(this.filePath, targetPath, { force });
  }
}

export async function loadAgents(agentsPath: string): Promise<Agent[]> {
  const agentPaths = await fs.readdir(agentsPath);

  const agents = await Promise.all(
    agentPaths.map((agentPath: string) =>
      Agent.fromFile(path.join(agentsPath, agentPath)),
    ),
  );

  return agents;
}
