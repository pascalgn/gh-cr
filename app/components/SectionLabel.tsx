import { Text } from "@mantine/core";
import type { ReactNode } from "react";

/** Small dimmed caption naming a section inside a panel. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text component="h3" size="xs" fw={600} c="dimmed" tt="uppercase">
      {children}
    </Text>
  );
}
