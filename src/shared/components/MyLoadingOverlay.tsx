import { LoadingOverlay, Paper, type LoadingOverlayProps } from "@mantine/core";
import { LoaderSleeping } from "./LoaderSleeping";

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
	message?: string;
}

export const MyLoadingOverlay = (props: NewLoadingOverlayProps) => (
	<FactoryLoadingOverlay
		loaderProps={{
			children: (
				<Paper p='sm' shadow='xs'>
					<LoaderSleeping message={props.message} />
				</Paper>
			)
		}}
		{...props}
	/>
);
