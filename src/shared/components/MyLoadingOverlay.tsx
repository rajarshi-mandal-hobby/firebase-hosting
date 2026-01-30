import { LoadingOverlay, Paper, Stack, ThemeIcon, type LoadingOverlayProps } from "@mantine/core";
import { LoaderSleeping } from "./LoaderSleeping";
import { IconCheck } from "../icons";
import { ICON_SIZE } from "../types";
import { Text } from "@mantine/core";
import { GroupIcon } from "./group-helpers";

const FactoryLoadingOverlay = LoadingOverlay.withProps({
    overlayProps: {
        blur: 2
    },
    zIndex: 100,
    transitionProps: {
        duration: 150,
        transition: "fade",
        timingFunction: "ease-in-out"
    }
});

interface NewLoadingOverlayProps extends LoadingOverlayProps {
    name?: string;
    success?: boolean;
}

export const MyLoadingOverlay = ({ name, success, ...props }: NewLoadingOverlayProps) => (
    <FactoryLoadingOverlay
        loaderProps={{
            children: (
                <Paper p='sm' shadow='xs'>
                    {success ?
                        <GroupIcon>
                            <ThemeIcon color='green.8'>
                                <IconCheck size={ICON_SIZE} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Text size='md' fw={700}>
                                    Success
                                </Text>
                                <Text size='xs' fw={700}>{name}</Text>
                            </Stack>
                        </GroupIcon>
                        : <LoaderSleeping name={name} />}
                </Paper>
            )
        }}
        {...props}
    />
);
