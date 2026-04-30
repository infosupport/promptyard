import { Command, Option } from "commander";
import { initializeProject } from "./commands/initialize-project";
import { addProjectRepository } from "./commands/add-repository";
import { updateProjectRepository } from "./commands/update-repository";
import { removeProjectRepository } from "./commands/remove-repository";
const program = new Command();

program
  .name("promptyard")
  .description("Quickly download agents, prompts, and skills")
  .version("0.1.0");

program
  .command("init")
  .description(
    "Initializes the local directory for downloading agents, prompts, and skills",
  )
  .addOption(
    new Option("--tool <tool>", "Which tool to use in the current directory")
      .choices(["copilot", "claude", "opencode", "codex"])
      .makeOptionMandatory(),
  )
  .option("--force", "Force re-initialization of the directory")
  .option("--global", "Initialize global config instead of the current project")
  .action(initializeProject);

program
  .command("add")
  .argument(
    "<name>",
    "Name used to reference the repository later when updating",
  )
  .argument(
    "<url>",
    "URL of the Git repository containing the agents, prompts, and skills",
  )
  .description(
    "Adds a new repository containing agents, prompts, and skills to the local directory",
  )
  .option("--force", "Overwrite existing agents, prompts, and skills")
  .option("--global", "Install into global config instead of the current project")
  .action(addProjectRepository);

program
  .command("update")
  .argument("[name]", "Name of the repository to update (optional)")
  .description(
    "Updates the specified repository or all repositories when the name is not provided",
  )
  .option("--force", "Overwrite existing agents, prompts, and skills")
  .option("--global", "Update repositories in global config instead of the current project")
  .action(updateProjectRepository);

program
  .command("remove")
  .argument("<name>", "Name of the repository to remove")
  .description("Removes the specified repository")
  .option("--global", "Remove from global config instead of the current project")
  .action(removeProjectRepository);

program.parse();
