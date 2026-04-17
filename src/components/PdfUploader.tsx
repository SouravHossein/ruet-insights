import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ParsedStudent {
  sl: string;
  application_id: string;
  admission_roll: string;
  name: string;
  merit_rank: number;
  department: string;
}

interface PdfUploaderProps {
  onUploadComplete?: () => void;
}

export function PdfUploader({ onUploadComplete }: PdfUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.type === "application/pdf" || dropped.name.endsWith(".csv"))) {
      setFile(dropped);
    }
  }, []);

  const handleParse = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const { data, error } = await supabase.functions.invoke("parse-admission-pdf", {
        body: await file.arrayBuffer(),
      });

      if (error) throw error;

      if (data?.students && Array.isArray(data.students)) {
        setParsedData(data.students);
        setStep("preview");
        toast({
          title: "Parsed successfully",
          description: `Found ${data.students.length} student records.`,
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      toast({
        title: "Parse failed",
        description: err instanceof Error ? err.message : "Could not parse the file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Get default university
      const { data: uni } = await supabase
        .from("universities")
        .select("id")
        .eq("code", "RUET")
        .maybeSingle();

      const universityId = uni?.id;

      const rows = parsedData.map((s) => ({
        name: s.name,
        merit_rank: s.merit_rank,
        admission_roll: s.admission_roll,
        application_id: s.application_id,
        department: s.department,
        university_id: universityId,
        verification_status: "unverified",
        is_locked: false,
      }));

      const { error } = await supabase.from("students").insert(rows);
      if (error) throw error;

      setStep("done");
      toast({
        title: "Import complete",
        description: `${parsedData.length} students added to database.`,
      });
      onUploadComplete?.();
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Could not import the parsed students.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  if (step === "done") {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center py-12">
          <CheckCircle className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold">Import Complete</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {parsedData.length} students have been added.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setStep("upload");
              setFile(null);
              setParsedData([]);
            }}
          >
            Upload Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "preview") {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Preview ({parsedData.length} records)
          </CardTitle>
          <CardDescription>
            Review the parsed data before importing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-auto rounded-lg border border-border/50">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">Sl</th>
                  <th className="px-2 py-1.5 text-left font-medium">Name</th>
                  <th className="px-2 py-1.5 text-left font-medium">Roll</th>
                  <th className="px-2 py-1.5 text-left font-medium">Rank</th>
                  <th className="px-2 py-1.5 text-left font-medium">Dept</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 20).map((s, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td className="px-2 py-1">{s.sl}</td>
                    <td className="px-2 py-1">{s.name}</td>
                    <td className="px-2 py-1 font-mono">{s.admission_roll}</td>
                    <td className="px-2 py-1">#{s.merit_rank}</td>
                    <td className="px-2 py-1 truncate max-w-[120px]">{s.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 20 && (
              <div className="text-center py-1 text-xs text-muted-foreground border-t">
                + {parsedData.length - 20} more records
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={importing} className="flex-1">
              {importing ? "Importing…" : `Import ${parsedData.length} Students`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setParsedData([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5 text-accent" />
          Upload Admission List
        </CardTitle>
        <CardDescription>
          Upload a PDF or CSV of the admission list to parse student records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag & drop a PDF or CSV file here
          </p>
          <input
            type="file"
            accept=".pdf,.csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="file-input" className="cursor-pointer">
              Browse Files
            </label>
          </Button>
          {file && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-accent" />
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          )}
        </div>
        {file && (
          <Button onClick={handleParse} disabled={uploading} className="mt-4 w-full">
            {uploading ? "Parsing…" : "Parse File"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
