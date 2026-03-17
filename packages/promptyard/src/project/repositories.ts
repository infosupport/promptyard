import { z } from "zod";
import { ProjectNotInitializedError } from "../errors";
import { JSON5, $ } from "bun";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { loadAgents, type Agent } from "./agents";
import { loadSkills, type Skill } from "./skills";

export class RepositoriesParseError extends Error {
  errors: string[];
  constructor(message: string, errors: string[]) {
    super(message);
    this.errors = errors;
  }
}

const repositorySettingsSchema = z.object({
  repositories: z
    .array(
      z.object({
        name: z
          .string()
          .regex(/^(?![0-9]+$)(?!-)[a-zA-Z0-9-]{0,63}(?<!-)$/i)
          .nonempty(),
        url: z.url(),
      }),
    )
    .nonempty(),
});

export type RepositorySettings = z.infer<typeof repositorySettingsSchema>;

export type RepositoryDescription = {
  name: string;
  url: string;
};

export async function loadRepositories(): Promise<RepositorySettings> {
  const repositoriesFile = Bun.file(".promptyard/repositories.json");

  if (!(await repositoriesFile.exists())) {
    throw new ProjectNotInitializedError(
      "No local repository settings found. Run the `init` command to configure the project.",
    );
  }

  const fileContent = await repositoriesFile.text();

  const parseResult = repositorySettingsSchema.safeParse(
    JSON5.parse(fileContent),
  );

  if (!parseResult.success) {
    throw new RepositoriesParseError(
      "Failed to parse repositories file.",
      z.treeifyError(parseResult.error).errors,
    );
  }

  return parseResult.data;
}

export async function saveRepositories(
  settings: RepositorySettings,
  initialize: boolean = false,
) {
  const repositoriesFile = Bun.file(".promptyard/repositories.json");

  if (!initialize && !(await repositoriesFile.exists())) {
    throw new ProjectNotInitializedError(
      "No local repository settings found. Run the `init` command to configure the project.",
    );
  }

  await repositoriesFile.write(JSON.stringify(settings, null, 2));
}

export async function cloneRepository(
  url: string,
  repositoryPath: string,
): Promise<void> {
  await $`git clone ${url} ${repositoryPath}`.quiet();
}

export class Repository {
  name: string;
  url: string;
  repositoryPath: string;
  skills: Skill[];
  agents: Agent[];

  constructor(
    name: string,
    url: string,
    repositoryPath: string,
    skills: Skill[],
    agents: Agent[],
  ) {
    this.name = name;
    this.url = url;
    this.repositoryPath = repositoryPath;
    this.skills = skills;
    this.agents = agents;
  }

  static async fromDescription(
    description: RepositoryDescription,
  ): Promise<Repository> {
    const repositoryPath = path.join(
      os.tmpdir(),
      `promptyard-${description.name}-${Date.now()}`,
    );

    await cloneRepository(description.url, repositoryPath);

    const agentsPath = path.join(repositoryPath, "agents");
    const skillsPath = path.join(repositoryPath, "skills");

    const [agents, skills] = await Promise.all([
      fs
        .access(agentsPath)
        .then(() => loadAgents(agentsPath))
        .catch(() => [] as Agent[]),
      fs
        .access(skillsPath)
        .then(() => loadSkills(skillsPath))
        .catch(() => [] as Skill[]),
    ]);

    return new Repository(
      description.name,
      description.url,
      repositoryPath,
      skills,
      agents,
    );
  }
}
