import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/data/bangladesh-districts";
import { Search } from "lucide-react";

interface Student {
  id: string;
  name: string;
  merit_rank: number;
  admission_roll: string;
  application_id: string | null;
  department: string;
  district: string | null;
  verification_status: string;
  is_locked: boolean;
}

interface StudentTableProps {
  students: Student[];
  loading?: boolean;
}

export function StudentTable({ students, loading }: StudentTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.admission_roll.includes(search) ||
        String(s.merit_rank).includes(search);
      const matchesDept =
        deptFilter === "all" || s.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [students, search, deptFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll, or rank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Roll</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>District</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading students…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 100).map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-xs font-bold">
                    #{student.merit_rank}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {student.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {student.admission_roll}
                  </TableCell>
                  <TableCell className="text-xs">
                    {student.department}
                  </TableCell>
                  <TableCell className="text-xs">
                    {student.district || (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.verification_status === "verified" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {student.verification_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filtered.length > 100 && (
          <div className="text-center py-2 text-xs text-muted-foreground border-t">
            Showing first 100 of {filtered.length} results
          </div>
        )}
      </div>
    </div>
  );
}
