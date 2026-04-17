import { Check, Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import type { SearchableStudentDirectoryEntry } from "@/lib/student-directory";
import { cn } from "@/lib/utils";

interface StudentDirectorySearchProps {
  disabled?: boolean;
  query: string;
  selectedStudent: SearchableStudentDirectoryEntry | null;
  suggestions: SearchableStudentDirectoryEntry[];
  onQueryChange: (value: string) => void;
  onSelect: (student: SearchableStudentDirectoryEntry) => void;
}

export function StudentDirectorySearch({
  disabled,
  query,
  selectedStudent,
  suggestions,
  onQueryChange,
  onSelect,
}: StudentDirectorySearchProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Student directory</Label>
        <p className="text-xs text-muted-foreground">
          Search by name, admission roll, or application ID. Results are ranked by closest match.
        </p>
      </div>

      <Command shouldFilter={false} className="rounded-2xl border border-border/60 bg-background">
        <div className="flex items-center px-3 pt-3 text-xs text-muted-foreground">
          <Search className="mr-2 h-3.5 w-3.5" />
          RUET student list
        </div>
        <CommandInput
          value={query}
          onValueChange={onQueryChange}
          placeholder="Start typing a name, roll, or application ID"
          disabled={disabled}
        />
        <CommandList className="max-h-72">
          <CommandEmpty className="px-4 pb-4 pt-2 text-left text-sm text-muted-foreground">
            No matching student found.
          </CommandEmpty>
          {suggestions.map((student) => {
            const isSelected = selectedStudent?.id === student.id;

            return (
              <CommandItem
                key={student.id}
                value={`${student.name} ${student.admission_roll} ${student.application_id ?? ""}`}
                onSelect={() => onSelect(student)}
                className={cn(
                  "mx-2 mb-2 rounded-xl border border-transparent px-3 py-3",
                  isSelected && "border-primary/30 bg-primary/5",
                )}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">{student.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {student.department} · Merit #{student.merit_rank}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Roll {student.admission_roll}
                      {student.application_id ? ` · App ${student.application_id}` : ""}
                    </div>
                  </div>
                  {isSelected ? <Check className="mt-0.5 h-4 w-4 text-primary" /> : null}
                </div>
              </CommandItem>
            );
          })}
        </CommandList>
      </Command>
    </div>
  );
}
