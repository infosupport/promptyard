import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { Agent, loadAgents } from "./agents";
import fs from "node:fs/promises";
import * as confirmModule from "../confirm";

function makeBunFile(content: string): ReturnType<typeof Bun.file> {
  return {
    text: () => Promise.resolve(content),
  } as unknown as ReturnType<typeof Bun.file>;
}

const originalBunFile = Bun.file.bind(Bun);

describe("Agent.fromFile", () => {
  let fileContent = "";

  beforeEach(() => {
    // @ts-expect-error
    Bun.file = (_path: string) => makeBunFile(fileContent);
  });

  afterEach(() => {
    Bun.file = originalBunFile;
  });

  it("reads name and description from frontmatter", async () => {
    fileContent =
      "---\nname: My Agent\ndescription: Does something useful\n---\nBody text";

    const agent = await Agent.fromFile("/some/path/my-agent.md");

    expect(agent.name).toBe("My Agent");
    expect(agent.description).toBe("Does something useful");
    expect(agent.filePath).toBe("/some/path/my-agent.md");
  });

  it("sets name to undefined when name is missing from frontmatter", async () => {
    fileContent = "---\ndescription: Does something useful\n---\nBody text";

    const agent = await Agent.fromFile("/some/path/my-agent.md");

    expect(agent.name).toBeUndefined();
  });

  it("sets description to undefined when description is missing from frontmatter", async () => {
    fileContent = "---\nname: My Agent\n---\nBody text";

    const agent = await Agent.fromFile("/some/path/my-agent.md");

    expect(agent.description).toBeUndefined();
  });

  it("sets name and description to undefined when frontmatter is absent", async () => {
    fileContent = "Just plain content without frontmatter";

    const agent = await Agent.fromFile("/some/path/my-agent.md");

    expect(agent.name).toBeUndefined();
    expect(agent.description).toBeUndefined();
  });
});

describe("Agent.copyTo", () => {
  let cpSpy: ReturnType<typeof spyOn>;
  let accessSpy: ReturnType<typeof spyOn>;
  let confirmSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    cpSpy = spyOn(fs, "cp").mockResolvedValue(undefined);
    accessSpy = spyOn(fs, "access").mockRejectedValue(new Error("not found"));
    confirmSpy = spyOn(confirmModule, "confirm");
  });

  afterEach(() => {
    cpSpy.mockRestore();
    accessSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  it("copies the file when target does not exist", async () => {
    const agent = new Agent("My Agent", "A description", "/src/my-agent.md");

    await agent.copyTo("/dest/my-agent.md", false);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(cpSpy).toHaveBeenCalledWith(
      "/src/my-agent.md",
      "/dest/my-agent.md",
      { force: false },
    );
  });

  it("copies without confirmation when force is true and target exists", async () => {
    accessSpy.mockResolvedValue(undefined);
    const agent = new Agent("My Agent", "A description", "/src/my-agent.md");

    await agent.copyTo("/dest/my-agent.md", true);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(cpSpy).toHaveBeenCalledWith(
      "/src/my-agent.md",
      "/dest/my-agent.md",
      { force: true },
    );
  });

  it("asks for confirmation when target exists and force is false", async () => {
    accessSpy.mockResolvedValue(undefined);
    confirmSpy.mockResolvedValue(true);
    const agent = new Agent("My Agent", "A description", "/src/my-agent.md");

    await agent.copyTo("/dest/my-agent.md", false);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Agent "My Agent" already exists. Replace it?',
    );
    expect(cpSpy).toHaveBeenCalled();
  });

  it("skips copying when confirmation is denied", async () => {
    accessSpy.mockResolvedValue(undefined);
    confirmSpy.mockResolvedValue(false);
    const agent = new Agent("My Agent", "A description", "/src/my-agent.md");

    await agent.copyTo("/dest/my-agent.md", false);

    expect(confirmSpy).toHaveBeenCalled();
    expect(cpSpy).not.toHaveBeenCalled();
  });
});

describe("loadAgents", () => {
  let readdirSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    readdirSpy = spyOn(fs, "readdir");

    // @ts-expect-error
    Bun.file = (_path: string) =>
      makeBunFile("---\nname: My Agent\ndescription: A description\n---\n");
  });

  afterEach(() => {
    readdirSpy.mockRestore();
    Bun.file = originalBunFile;
  });

  it("returns an agent for each entry in the directory", async () => {
    readdirSpy.mockResolvedValue(["agent-a.md", "agent-b.md"]);

    const agents = await loadAgents("/agents");

    expect(agents).toHaveLength(2);
    expect(agents[0]?.filePath).toBe("/agents/agent-a.md");
    expect(agents[1]?.filePath).toBe("/agents/agent-b.md");
  });

  it("returns an empty array when the directory is empty", async () => {
    readdirSpy.mockResolvedValue([]);

    const agents = await loadAgents("/agents");

    expect(agents).toEqual([]);
  });
});
