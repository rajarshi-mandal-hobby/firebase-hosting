import { Center, type CenterProps, type TextProps } from "@mantine/core";
import { LoaderSleeping } from "./LoaderSleeping";

type LoadingBoxProps = {
	centerProps?: CenterProps;
	textProps?: TextProps;
	message?: string;
};

export const LoadingBox = ({ centerProps, textProps, message }: LoadingBoxProps) => {
	return (
		<Center my='xl' {...centerProps}>
			<LoaderSleeping {...textProps} name={message} />
		</Center>
	);
};
