import { Checkbox, Group, MultiSelect, Text } from "@mantine/core";

import "./ThreadFilters.css";

interface ThreadFiltersProps {
  /** Every root-comment author on the pull request, for the dropdown. */
  authors: string[];
  selectedAuthors: string[];
  showResolved: boolean;
  /** How many threads survive the filters, and how many exist in total. */
  shown: number;
  total: number;
  onChange: (next: { showResolved: boolean; authors: string[] }) => void;
}

/** Filter bar above the comment list: resolved state and root-comment author. */
export function ThreadFilters({
  authors,
  selectedAuthors,
  showResolved,
  shown,
  total,
  onChange,
}: ThreadFiltersProps) {
  return (
    <Group className="threadFilters" gap="md" align="center" wrap="wrap">
      <Checkbox
        label="Show resolved"
        checked={showResolved}
        onChange={(event) =>
          onChange({
            showResolved: event.currentTarget.checked,
            authors: selectedAuthors,
          })
        }
      />
      <MultiSelect
        className="threadFilters-authors"
        data={authors}
        value={selectedAuthors}
        onChange={(value) => onChange({ showResolved, authors: value })}
        placeholder={selectedAuthors.length === 0 ? "All authors" : undefined}
        label={undefined}
        clearable
        searchable
        size="sm"
        comboboxProps={{ withinPortal: true }}
      />
      <Text size="xs" c="dimmed">
        {shown === total ? `${total} threads` : `${shown} of ${total} threads`}
      </Text>
    </Group>
  );
}
