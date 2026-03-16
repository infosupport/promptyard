import { JSON5 } from "bun";
import { z } from "zod";
import { ProjectNotInitializedError } from "../errors";

export class SettingsParseError extends Error {
	errors: string[];
	constructor(message: string, errors: string[]) {
		super(message);
		this.errors = errors;
	}
}

export const projectSettingsSchema = z.object({
	tool: z.enum(["claude", "copilot", "opencode"]).nonoptional(),
});

export type ProjectSettings = z.infer<typeof projectSettingsSchema>;

export async function loadProjectSettings(): Promise<ProjectSettings> {
	const globalProjectSettings = await loadGlobalProjectSettings();
	const localProjectSettings = await loadLocalProjectSettings();

	if (globalProjectSettings) {
		return { ...globalProjectSettings, ...localProjectSettings };
	}

	return localProjectSettings;
}

export async function saveProjectSettings(
	settings: ProjectSettings,
	initialize: boolean = false,
) {
	const settingsFile = Bun.file(".promptyard/settings.json");

	if (!initialize && !(await settingsFile.exists())) {
		throw new ProjectNotInitializedError(
			"No local settings found. Run the `init` command to configure the project.",
		);
	}

	await settingsFile.write(JSON.stringify(settings, null, 2));
}

async function loadGlobalProjectSettings(): Promise<
	ProjectSettings | undefined
> {
	const projectSettingsPath =
		process.platform === "linux" || process.platform === "darwin"
			? "~/.config/promptyard/settings.json"
			: "~/.promptyard/settings.json";

	const globalSettingsFile = Bun.file(projectSettingsPath);

	if (!(await globalSettingsFile.exists())) {
		return undefined;
	}

	const settingsFileContent = await globalSettingsFile.text();

	const parseSettingsResult = projectSettingsSchema.safeParse(
		JSON5.parse(settingsFileContent),
	);

	if (!parseSettingsResult.success) {
		throw new SettingsParseError(
			"Failed to parse settings file",
			z.treeifyError(parseSettingsResult.error).errors,
		);
	}

	return parseSettingsResult.data;
}

async function loadLocalProjectSettings(): Promise<ProjectSettings> {
	const localSettingsFile = Bun.file(".promptyard/settings.json");

	if (!(await localSettingsFile.exists())) {
		throw new ProjectNotInitializedError(
			"No local project settings found. Run the `init` command to create a settings file.",
		);
	}

	const settingsFileContent = await localSettingsFile.text();

	const parseSettingsResult = projectSettingsSchema.safeParse(
		JSON5.parse(settingsFileContent),
	);

	if (!parseSettingsResult.success) {
		throw new SettingsParseError(
			"Failed to parse settings file",
			z.treeifyError(parseSettingsResult.error).errors,
		);
	}

	return parseSettingsResult.data;
}
