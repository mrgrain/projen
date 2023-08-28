import { PullRequestLint } from "../../src/github/pull-request-lint";
import { NodeProject, NodeProjectOptions } from "../../src/javascript";
import { synthSnapshot } from "../util";

test("default", () => {
  // GIVEN
  const project = createProject();

  // WHEN
  new PullRequestLint(project.github!);

  // THEN
  const snapshot = synthSnapshot(project);
  expect(snapshot[".github/workflows/pull-request-lint.yml"]).toBeDefined();

  const workflow = snapshot[".github/workflows/pull-request-lint.yml"];
  expect(workflow).toMatchSnapshot();
  expect(workflow).toContain("Validate PR title");
  expect(workflow).not.toContain("Require Contributor Statement");
});

describe("semantic titles", () => {
  test("configure scopes", () => {
    // GIVEN
    const project = createProject();

    // WHEN
    new PullRequestLint(project.github!, {
      semanticTitle: true,
      semanticTitleOptions: {
        types: ["feat", "fix"],
      },
    });

    // THEN
    const snapshot = synthSnapshot(project);
    expect(
      snapshot[".github/workflows/pull-request-lint.yml"]
    ).toMatchSnapshot();
  });

  test("require scope", () => {
    // GIVEN
    const project = createProject();

    // WHEN
    new PullRequestLint(project.github!, {
      semanticTitle: true,
      semanticTitleOptions: {
        requireScope: true,
      },
    });

    // THEN
    const snapshot = synthSnapshot(project);
    expect(
      snapshot[".github/workflows/pull-request-lint.yml"]
    ).toMatchSnapshot();
  });
});

describe("contributor statement", () => {
  test("validates pull requests", () => {
    // GIVEN
    const project = createProject();

    // WHEN
    new PullRequestLint(project.github!, {
      contributorStatement: "Lorem ipsum dolor sit amet",
    });

    // THEN
    const snapshot = synthSnapshot(project);
    expect(
      snapshot[".github/workflows/pull-request-lint.yml"]
    ).toMatchSnapshot();
  });

  test("creates pull request template", () => {
    // GIVEN
    const project = createProject({
      pullRequestTemplate: false,
    });
    const contributorStatement = "Lorem ipsum dolor sit amet";

    // WHEN
    new PullRequestLint(project.github!, {
      contributorStatement,
    });

    // THEN
    const snapshot = synthSnapshot(project);
    expect(snapshot[".github/pull_request_template.md"]).toMatchSnapshot();
    expect(snapshot[".github/pull_request_template.md"]).toContain(
      contributorStatement
    );
  });

  test("appends to an existing request template", () => {
    // GIVEN
    const project = createProject({
      pullRequestTemplate: true,
      pullRequestTemplateContents: ["Foobar #"],
    });
    const contributorStatement = "Lorem ipsum dolor sit amet";

    // WHEN
    new PullRequestLint(project.github!, {
      contributorStatement,
    });

    // THEN
    const snapshot = synthSnapshot(project);
    expect(snapshot[".github/pull_request_template.md"]).toMatchSnapshot();
    expect(snapshot[".github/pull_request_template.md"]).toContain("Foobar #");
    expect(snapshot[".github/pull_request_template.md"]).toContain(
      contributorStatement
    );
  });
});

test("with custom runner", () => {
  // GIVEN
  const project = createProject();

  // WHEN
  new PullRequestLint(project.github!, {
    runsOn: ["self-hosted"],
  });

  // THEN
  const snapshot = synthSnapshot(project);
  expect(snapshot[".github/workflows/pull-request-lint.yml"]).toContain(
    "runs-on: self-hosted"
  );
});

test("with github base url", () => {
  // GIVEN
  const project = createProject();

  // WHEN
  new PullRequestLint(project.github!, {});

  // THEN
  const snapshot = synthSnapshot(project);
  expect(snapshot[".github/workflows/pull-request-lint.yml"]).toContain(
    "githubBaseUrl: ${{ github.api_url }}"
  );
});

type ProjectOptions = Omit<
  NodeProjectOptions,
  "outdir" | "defaultReleaseBranch" | "name"
>;
function createProject(options: ProjectOptions = {}): NodeProject {
  return new NodeProject({
    defaultReleaseBranch: "main",
    name: "node-project",
    githubOptions: {
      pullRequestLintOptions: {
        semanticTitle: false,
      },
    },
    ...options,
  });
}
