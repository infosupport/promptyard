import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { removeProjectRepository } from "./remove-repository";
import * as repositoriesModule from "../project/repositories";
import * as confirmModule from "../confirm";
import { RepositoryNotFoundError } from "../errors";

const fakeRepositorySettings = {
  repositories: [
    { name: "my-repo", url: "https://example.com/my-repo.git" },
    { name: "other-repo", url: "https://example.com/other-repo.git" },
  ],
};

describe("removeProjectRepository", () => {
  let loadRepositoriesSpy: ReturnType<typeof spyOn>;
  let saveRepositoriesSpy: ReturnType<typeof spyOn>;
  let confirmSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    loadRepositoriesSpy = spyOn(
      repositoriesModule,
      "loadRepositories",
    ).mockResolvedValue(
      structuredClone(fakeRepositorySettings) as typeof fakeRepositorySettings,
    );
    saveRepositoriesSpy = spyOn(
      repositoriesModule,
      "saveRepositories",
    ).mockResolvedValue(undefined);
    confirmSpy = spyOn(confirmModule, "confirm").mockResolvedValue(true);
  });

  afterEach(() => {
    loadRepositoriesSpy.mockRestore();
    saveRepositoriesSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  it("throws RepositoryNotFoundError when repo name doesn't exist", async () => {
    await expect(
      removeProjectRepository({ name: "nonexistent" }),
    ).rejects.toBeInstanceOf(RepositoryNotFoundError);
  });

  it("calls confirm with a message including the repo name", async () => {
    await removeProjectRepository({ name: "my-repo" });

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("my-repo"));
  });

  it("does not save when user declines confirmation", async () => {
    confirmSpy.mockResolvedValue(false);

    await removeProjectRepository({ name: "my-repo" });

    expect(saveRepositoriesSpy).not.toHaveBeenCalled();
  });

  it("removes the named repo from saved settings when confirmed", async () => {
    await removeProjectRepository({ name: "my-repo" });

    const [savedSettings] = saveRepositoriesSpy.mock.calls[0] as [
      typeof fakeRepositorySettings,
    ];
    expect(savedSettings.repositories).not.toContainEqual(
      expect.objectContaining({ name: "my-repo" }),
    );
  });

  it("preserves other repositories when removing one", async () => {
    await removeProjectRepository({ name: "my-repo" });

    const [savedSettings] = saveRepositoriesSpy.mock.calls[0] as [
      typeof fakeRepositorySettings,
    ];
    expect(savedSettings.repositories).toContainEqual({
      name: "other-repo",
      url: "https://example.com/other-repo.git",
    });
  });
});
