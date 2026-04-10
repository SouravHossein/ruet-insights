import { useState, useEffect } from "react";
import { PdfUploader } from "@/components/PdfUploader";
import { StudentTable } from "@/components/StudentTable";
import { AdminGate } from "@/components/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function AdminPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("id, name, merit_rank, admission_roll, application_id, department, district, verification_status, is_locked")
      .order("merit_rank", { ascending: true }) as { data: Student[] | null };
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <AdminGate>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student data, upload admission lists, and view records
          </p>
        </div>

        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
          </TabsList>
          <TabsContent value="students" className="mt-4">
            <StudentTable students={students} loading={loading} />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <PdfUploader onUploadComplete={fetchStudents} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminGate>
  );
}
