import { describe, expect, it } from "vitest";

import { dockerAppFromContainer } from "./docker-app-from-container";

const container = { name: "goal-state-goal-state-1", iconUrl: null };

describe("dockerAppFromContainer", () => {
  it("fills the app in from the container's labels", () => {
    expect(
      dockerAppFromContainer(
        {
          ...container,
          appName: "goal-state",
          appDescription: "Goals",
          appPingUrl: "https://home.example.com/healthz",
        },
        "https://home.example.com/admin",
      ),
    ).toEqual({
      name: "goal-state",
      iconUrl: null,
      description: "Goals",
      href: "https://home.example.com/admin",
      pingUrl: "https://home.example.com/healthz",
    });
  });

  it("uses the container's name and leaves the rest empty without labels", () => {
    expect(dockerAppFromContainer(container, null)).toEqual({
      name: "goal-state-goal-state-1",
      iconUrl: null,
      description: null,
      href: null,
      pingUrl: null,
    });
  });

  it("skips label values the app form would reject", () => {
    expect(
      dockerAppFromContainer({ ...container, appName: "x".repeat(65), appPingUrl: "javascript:alert(1)" }, null),
    ).toMatchObject({ name: "goal-state-goal-state-1", pingUrl: null });
  });
});
