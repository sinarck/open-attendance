"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2, FileSpreadsheet, RefreshCcw, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { memberImportAccept, parseMemberCsv } from "@/lib/validation/member-import";
import type { MemberImportDraftRow, MemberImportResult } from "@/types/member-import";

function buildSkippedSummary(result: MemberImportResult) {
  if (result.skippedCount === 0) {
    return "All rows imported.";
  }

  return "Skipped rows had duplicate identifiers or missing values.";
}

interface ImportMembersState {
  error: string | null;
  fileName: string | null;
  isImporting: boolean;
  isParsing: boolean;
  result: MemberImportResult | null;
  rows: MemberImportDraftRow[];
}

const initialState: ImportMembersState = {
  error: null,
  fileName: null,
  isImporting: false,
  isParsing: false,
  result: null,
  rows: [],
};

export function ImportMembersSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const importMembers = useMutation(api.members.importMembers);
  const [state, setState] = useState(initialState);
  const { error, fileName, isImporting, isParsing, result, rows } = state;

  function resetDialog() {
    setState(initialState);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isImporting && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);

    if (!nextOpen) {
      resetDialog();
    }
  }

  async function handleSelectedFile(file: File) {
    setState({
      ...initialState,
      isParsing: true,
    });

    try {
      const parsedRows = await parseMemberCsv(file);
      setState({
        ...initialState,
        fileName: file.name,
        rows: parsedRows,
      });
    } catch (error) {
      setState({
        ...initialState,
        error: error instanceof Error ? error.message : "Could not parse this CSV file.",
      });
    }
  }

  const dropzone = useDropzone({
    accept: memberImportAccept,
    maxFiles: 1,
    multiple: false,
    onDropAccepted(files) {
      const file = files[0];
      if (file) {
        void handleSelectedFile(file);
      }
    },
    onDropRejected(rejections) {
      const message = rejections[0]?.errors[0]?.message ?? "Only one CSV file is supported.";
      setState({
        ...initialState,
        error: message,
      });
    },
  });

  async function handleImport() {
    if (rows.length === 0) {
      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isImporting: true,
    }));

    try {
      const nextResult = await importMembers({ rows });
      setState((current) => ({
        ...current,
        isImporting: false,
        result: nextResult,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Could not import these members.",
        isImporting: false,
      }));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-md" showCloseButton={!isImporting}>
        <DialogHeader>
          <DialogTitle>Import members</DialogTitle>
          <DialogDescription>
            Upload a CSV with <code>name</code> and <code>identifier</code> columns.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-4">
          <div
            {...dropzone.getRootProps()}
            className={cn(
              "rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
              dropzone.isDragActive
                ? "border-primary bg-primary/4"
                : "border-border/70 bg-muted/20 hover:border-primary/40",
            )}
          >
            <input {...dropzone.getInputProps()} />
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-background shadow-xs">
              <Upload className="size-4.5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {isParsing ? "Reading CSV..." : "Drop a CSV here or click to choose one"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">CSV only.</p>
          </div>

          {fileName ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/15 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileSpreadsheet className="size-4" />
                  <span className="truncate">{fileName}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {rows.length} row{rows.length === 1 ? "" : "s"} ready.
                </p>
              </div>
              <Button
                onClick={() => setState(initialState)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <RefreshCcw className="size-4" />
                Replace
              </Button>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/6 px-4 py-3 text-sm text-destructive-foreground">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="rounded-xl border border-success/20 bg-success/8 px-4 py-3 text-sm text-success-foreground">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="size-4" />
                Imported {result.importedCount} member{result.importedCount === 1 ? "" : "s"}.
              </p>
              <p className="mt-1 text-success-foreground/80">{buildSkippedSummary(result)}</p>
            </div>
          ) : null}
        </DialogPanel>
        <DialogFooter>
          <Button
            disabled={isImporting}
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {result ? (
            <Button onClick={() => setState(initialState)} type="button">
              Import another file
            </Button>
          ) : (
            <Button
              disabled={rows.length === 0 || isParsing}
              loading={isImporting}
              onClick={() => void handleImport()}
              type="button"
            >
              Import members
            </Button>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
