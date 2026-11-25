import type { z } from "zod/v4";

import { appManageSchema } from "@homarr/validation/app";

interface ContainerAppSource {
  name: string;
  iconUrl: string | null;
  appName?: string | null;
  appDescription?: string | null;
  appPingUrl?: string | null;
}

// A label value the app form would reject (too long, not an http(s) URL) is skipped instead of failing the creation.
const validLabel = (schema: z.ZodType, value: string | null | undefined) =>
  value && schema.safeParse(value).success ? value : null;

// The app's name: the container's homarr.name label, else the container's name.
export const dockerAppName = (container: ContainerAppSource) =>
  validLabel(appManageSchema.shape.name, container.appName) ?? container.name;

// The new app for a container, filled in from its homarr.name, homarr.description and homarr.ping labels, as
// onboarding does.
export const dockerAppFromContainer = (container: ContainerAppSource, href: string | null) => ({
  name: dockerAppName(container),
  iconUrl: container.iconUrl,
  description: validLabel(appManageSchema.shape.description, container.appDescription),
  href,
  pingUrl: validLabel(appManageSchema.shape.pingUrl, container.appPingUrl),
});
