import { describe, it, expect } from "bun:test";
import { matter } from "./frontmatter";

describe("matter", () => {
	it("returns empty object and original content when no frontmatter", () => {
		const content = "just some body text";
		const [fm, body] = matter(content);
		expect(fm).toEqual({});
		expect(body).toBe(content);
	});

	it("parses frontmatter and body", () => {
		const content = "---\nname: test\nversion: 1\n---\nbody text";
		const [fm, body] = matter<{ name: string; version: number }>(content);
		expect(fm).toEqual({ name: "test", version: 1 });
		expect(body).toBe("body text");
	});

	it("handles CRLF line endings", () => {
		const content = "---\r\nname: test\r\n---\r\nbody text";
		const [fm, body] = matter<{ name: string }>(content);
		expect(fm).toEqual({ name: "test" });
		expect(body).toBe("body text");
	});

	it("returns empty body when nothing follows the closing delimiter", () => {
		const content = "---\nname: test\n---\n";
		const [fm, body] = matter<{ name: string }>(content);
		expect(fm).toEqual({ name: "test" });
		expect(body).toBe("");
	});
});
