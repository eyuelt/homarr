import { Avatar, Button, Group, List, LoadingOverlay, Stack, Text, TextInput } from "@mantine/core";
import { z } from "zod/v4";

import type { RouterOutputs } from "@homarr/api";
import { clientApi } from "@homarr/api/client";
import { buildDockerServiceUrlCandidates } from "@homarr/definitions";
import { useZodForm } from "@homarr/form";
import { createModal } from "@homarr/modals";
import { showErrorNotification, showSuccessNotification } from "@homarr/notifications";
import { useI18n } from "@homarr/translation/client";
import { appHrefSchema } from "@homarr/validation/app";

import { dockerAppFromContainer, dockerAppName } from "./docker-app-from-container";

interface AddDockerAppToHomarrProps {
  selectedContainers: RouterOutputs["docker"]["getContainers"]["containers"];
  initialUrls?: (string | null)[];
}

const formSchema = z.object({
  containerUrls: z.array(appHrefSchema),
});

export const AddDockerAppToHomarrModal = createModal<AddDockerAppToHomarrProps>(({ actions, innerProps }) => {
  const t = useI18n();
  const utils = clientApi.useUtils();
  const form = useZodForm(formSchema, {
    initialValues: {
      containerUrls: innerProps.selectedContainers.map((container, index) => {
        const initialUrl = innerProps.initialUrls?.[index];
        if (initialUrl !== undefined) return initialUrl;
        if (container.href) return container.href;

        const candidates = buildDockerServiceUrlCandidates({
          containerName: container.name,
          endpointHost: container.host,
          ports: container.ports,
        }).filter(({ url }) => url.length > 0);

        return candidates.find(({ scopes }) => scopes.includes("browser"))?.url ?? candidates[0]?.url ?? null;
      }),
    },
  });
  const { mutate, isPending } = clientApi.app.createMany.useMutation({
    onSuccess() {
      void utils.app.invalidate();
      actions.closeModal();
      showSuccessNotification({
        title: t("docker.action.addToHomarr.notification.success.title"),
        message: t("docker.action.addToHomarr.notification.success.message"),
      });
    },
    onError() {
      showErrorNotification({
        title: t("docker.action.addToHomarr.notification.error.title"),
        message: t("docker.action.addToHomarr.notification.error.message"),
      });
    },
  });
  const handleSubmit = ({ containerUrls }: z.infer<typeof formSchema>) => {
    mutate(
      innerProps.selectedContainers.map((container, index) =>
        dockerAppFromContainer(container, containerUrls[index] || null),
      ),
    );
  };
  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <LoadingOverlay visible={isPending} />
      <Stack>
        <List spacing={"xs"}>
          {innerProps.selectedContainers.map((container, index) => {
            const inputProps = form.getInputProps(`containerUrls.${index}`);
            return (
              <List.Item
                styles={{ itemWrapper: { width: "100%" }, itemLabel: { flex: 1 } }}
                icon={
                  <Avatar
                    variant="outline"
                    radius={container.iconUrl ? "sm" : "md"}
                    size={30}
                    styles={{ image: { objectFit: "contain" } }}
                    src={container.iconUrl}
                  >
                    {dockerAppName(container).at(0)?.toUpperCase()}
                  </Avatar>
                }
                key={container.id}
              >
                <Group justify="space-between" wrap={"nowrap"}>
                  <Text lineClamp={1}>{dockerAppName(container)}</Text>
                  <TextInput {...inputProps} value={inputProps.value ?? ""} />
                </Group>
              </List.Item>
            );
          })}
        </List>
        <Group justify="end">
          <Button onClick={actions.closeModal} variant="light" px={"xl"}>
            {t("common.action.cancel")}
          </Button>
          <Button type="submit" px={"xl"}>
            {t("common.action.add")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}).withOptions({
  defaultTitle(t) {
    return t("docker.action.addToHomarr.modal.title");
  },
  size: "lg",
});
