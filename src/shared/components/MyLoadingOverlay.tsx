import { LoadingOverlay, Paper, type LoadingOverlayProps } from "@mantine/core";
import { LoaderSleeping } from "./LoaderSleeping";

const FactoryLoadingOverlay = LoadingOverlay.withProps({
	overlayProps: {
		blur: 2,
	},
	zIndex: 100
});

interface NewLoadingOverlayProps extends LoadingOverlayProps {
	message?: string;
}

export const MyLoadingOverlay = (props: NewLoadingOverlayProps) => (
	<FactoryLoadingOverlay {...props} loaderProps={{ children: <Paper p='sm' shadow="xs"><LoaderSleeping message={props.message} /></Paper> }} />
);
