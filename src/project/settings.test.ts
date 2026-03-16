import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ProjectNotInitializedError } from "../errors";
import {
  SettingsParseError,
  loadProjectSettings,
  saveProjectSettings,
} from "./settings";

function makeBunFile(
  content: string | null,
  onWrite?: (data: string) => void,
): ReturnType<typeof Bun.file> {
  return {
    exists: () => Promise.resolve(content !== null),
    text: () => Promise.resolve(content ?? ""),
    write: (data: string) => {
      if (onWrite) onWrite(data);
      return Promise.resolve();
    },
  } as unknown as ReturnType<typeof Bun.file>;
}

const originalBunFile = Bun.file.bind(Bun);

describe("loadProjectSettings", () => {
  let globalFileContent: string | null = null;
  let localFileContent: string | null = null;

  beforeEach(() => {
    globalFileContent = null;
    localFileContent = null;

    // @ts-expect-error
    Bun.file = (path: string) => {
      const isLocal =
        path === ".promptyard/settings.json" ||
        path.endsWith("/.promptyard/settings.json");
      return isLocal
        ? makeBunFile(localFileContent)
        : makeBunFile(globalFileContent);
    };
  });

  afterEach(() => {
    Bun.file = originalBunFile;
  });

  it("returns local settings when no global settings exist", async () => {
    localFileContent = JSON.stringify({ tool: "claude" });

    const settings = await loadProjectSettings();

    expect(settings).toEqual({ tool: "claude" });
  });

  it("merges global and local settings, local takes precedence", async () => {
    globalFileContent = JSON.stringify({ tool: "copilot" });
    localFileContent = JSON.stringify({ tool: "claude" });

    const settings = await loadProjectSettings();

    expect(settings).toEqual({ tool: "claude" });
  });

  it("uses global settings when global and local agree", async () => {
    globalFileContent = JSON.stringify({ tool: "opencode" });
    localFileContent = JSON.stringify({ tool: "opencode" });

    const settings = await loadProjectSettings();

    expect(settings.tool).toBe("opencode");
  });

  it("throws ProjectNotInitializedError when local settings file is missing", async () => {
    localFileContent = null;

    expect(loadProjectSettings()).rejects.toThrow(ProjectNotInitializedError);
  });

  it("throws SettingsParseError when local settings file has invalid tool value", async () => {
    localFileContent = JSON.stringify({ tool: "unknown-tool" });

    expect(loadProjectSettings()).rejects.toThrow(SettingsParseError);
  });

  it("throws SettingsParseError when local settings file is missing required fields", async () => {
    localFileContent = JSON.stringify({});

    expect(loadProjectSettings()).rejects.toThrow(SettingsParseError);
  });
});

describe("saveProjectSettings", () => {
  let fileExists = false;
  let writtenData: string | null = null;

  beforeEach(() => {
    fileExists = false;
    writtenData = null;

    // @ts-expect-error
    Bun.file = (_path: string) =>
      makeBunFile(fileExists ? "{}" : null, (data) => {
        writtenData = data;
      });
  });

  afterEach(() => {
    Bun.file = originalBunFile;
  });

  it("throws ProjectNotInitializedError when file is missing", async () => {
    fileExists = false;

    expect(saveProjectSettings({ tool: "claude" })).rejects.toThrow(
      ProjectNotInitializedError,
    );
  });

  it("writes serialized settings to file", async () => {
    fileExists = true;

    await saveProjectSettings({ tool: "claude" });

    expect(JSON.parse(writtenData ?? "")).toEqual({ tool: "claude" });
  });

  it("does not throw when file is missing and initialize is true", async () => {
    fileExists = false;

    await saveProjectSettings({ tool: "claude" }, true);

    expect(JSON.parse(writtenData ?? "")).toEqual({ tool: "claude" });
  });
});
