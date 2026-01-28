import { type TextProps, type TitleOrder, Stack, Text, Title } from "@mantine/core";
import classes from "../../css-modules/Loader.module.css";

type LoaderSleepingProps = TextProps & { name?: string };

export const LoaderSleeping = ({
   size = "sm",
   c = "gray.7",
   name,
   ...props
}: LoaderSleepingProps) => {
   let titleOrder: TitleOrder = 4;

   switch (size) {
      case "xs":
         titleOrder = 5;
         break;
      case "md":
         titleOrder = 3;
         break;
      case "lg":
         titleOrder = 2;
         break;
      case "xl":
         titleOrder = 1;
         break;
      default:
         titleOrder = 4;
   }

   const message = `Getting things ready...`;

   return (
      <Stack align='center' justify='center' gap='xs'>
         <Title order={titleOrder} c={c} className={classes["loader-sleeping"]}>
            <span className={classes.face}>(￣o￣). z Z</span>
         </Title>
         <Stack align='center' justify='center' gap={0}>
            <Text fw={700} size={size} c={c} {...props}>
               {message}
            </Text>
            {name && <Text fw={700} size={size} c={c} {...props}>{name}</Text>}
         </Stack>
      </Stack>
   );
};
