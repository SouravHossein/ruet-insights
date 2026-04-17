import { Check, MapPinned } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { DISTRICTS } from "@/data/bangladesh-districts";
import { canonicalizeDistrictName } from "@/lib/district-geo";
import { cn } from "@/lib/utils";

interface DistrictSearchPickerProps {
  disabled?: boolean;
  selectedDistrict: string | null;
  onSelect: (district: string) => void;
}

const districts = Array.from(
  new Map(
    DISTRICTS.map((district) => {
      const name = canonicalizeDistrictName(district.name);

      return [
        name,
        {
          ...district,
          name,
          searchValue: `${name} ${district.division}`.toLowerCase(),
        },
      ];
    }),
  ).values(),
);

export function DistrictSearchPicker({
  disabled,
  selectedDistrict,
  onSelect,
}: DistrictSearchPickerProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Searchable district fallback</Label>
        <p className="text-xs text-muted-foreground">
          If the map is hard to tap on mobile, search and select your district here.
        </p>
      </div>

      <Command className="rounded-2xl border border-border/60 bg-background">
        <div className="flex items-center px-3 pt-3 text-xs text-muted-foreground">
          <MapPinned className="mr-2 h-3.5 w-3.5" />
          Bangladesh districts
        </div>
        <CommandInput placeholder="Search district or division" disabled={disabled} />
        <CommandList className="max-h-56">
          <CommandEmpty className="px-4 pb-4 pt-2 text-left text-sm text-muted-foreground">
            No district found.
          </CommandEmpty>
          {districts.map((district) => {
            const isSelected = district.name === selectedDistrict;

            return (
              <CommandItem
                key={district.code}
                value={district.searchValue}
                onSelect={() => onSelect(district.name)}
                className={cn(
                  "mx-2 mb-2 rounded-xl border border-transparent px-3 py-3",
                  isSelected && "border-primary/30 bg-primary/5",
                )}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">{district.name}</div>
                    <div className="text-xs text-muted-foreground">{district.division}</div>
                  </div>
                  {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
                </div>
              </CommandItem>
            );
          })}
        </CommandList>
      </Command>
    </div>
  );
}
