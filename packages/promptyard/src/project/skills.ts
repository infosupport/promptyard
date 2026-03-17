import path from "node:path";
import fs from "node:fs/promises";
import { matter } from "../frontmatter";

interface SkillMetadata {
  name: string;
  description: string;
}

export class Skill {
  name: string;
  path: string;
  description: string;

  constructor(name: string, path: string, description: string) {
    this.name = name;
    this.path = path;
    this.description = description;
  }

  static async fromDirectory(skillPath: string): Promise<Skill> {
    const skillName = skillPath.split("/").at(-1) ?? skillPath;

    const [skillMetadata] = matter<SkillMetadata>(
      await Bun.file(path.join(skillPath, "SKILL.md")).text(),
    );

    return new Skill(
      skillMetadata.name ?? skillName,
      skillPath,
      skillMetadata.description ?? "",
    );
  }

  async copyTo(targetPath: string): Promise<void> {
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.cp(this.path, targetPath, { recursive: true });
  }
}

export async function loadSkills(skillsPath: string): Promise<Skill[]> {
  const skillPaths = await fs.readdir(skillsPath);

  const skills = await Promise.all(
    skillPaths.map((skillPath: string) =>
      Skill.fromDirectory(path.join(skillsPath, skillPath)),
    ),
  );

  return skills;
}
