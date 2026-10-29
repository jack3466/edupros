"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  ArrowLeft,
  Check,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { processBulkStudentImport, BulkStudentRow } from "../actions";

interface ClassOption {
  id: string;
  name: string;
  deptCode: string;
}

export default function BulkImportClient({
  classes,
}: {
  classes: ClassOption[];
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ""
  );
  const [parsedRows, setParsedRows] = useState<BulkStudentRow[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importReport, setImportReport] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Download Sample CSV Template
  const downloadTemplate = () => {
    const csvContent =
      "name,email,rollNumber,guardianName,guardianPhone\n" +
      "Devanand Rao,devanand@apex.edu,CSE-2025-010,Suresh Rao,+1-555-0199\n" +
      "Priya Sharma,priya@apex.edu,CSE-2025-011,Kailash Sharma,+1-555-0198\n" +
      "Kavita Nair,kavita@apex.edu,CSE-2025-012,Muralidhar Nair,+1-555-0197\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "edupros_student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse uploaded CSV or XLSX
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreviewError(null);
    setImportReport(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows: BulkStudentRow[] = [];
          for (const item of results.data as any[]) {
            // Flexible column matching
            const name = item.name || item.Name || item["Full Name"] || "";
            const email = item.email || item.Email || item["Email Address"] || "";
            const rollNumber =
              item.rollNumber || item.RollNumber || item["Roll No"] || item.roll || "";
            const guardianName =
              item.guardianName || item["Guardian Name"] || item.Guardian || "";
            const guardianPhone =
              item.guardianPhone || item["Guardian Phone"] || item.Phone || "";

            if (name && email && rollNumber) {
              rows.push({ name, email, rollNumber, guardianName, guardianPhone });
            }
          }

          if (rows.length === 0) {
            setPreviewError(
              "No valid student rows recognized. Ensure columns: name, email, rollNumber."
            );
          } else {
            setParsedRows(rows);
          }
        },
        error: (err) => {
          setPreviewError(`Failed to parse CSV: ${err.message}`);
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];

          const rows: BulkStudentRow[] = [];
          for (const item of json) {
            const name = item.name || item.Name || item["Full Name"] || "";
            const email = item.email || item.Email || item["Email Address"] || "";
            const rollNumber =
              item.rollNumber || item.RollNumber || item["Roll No"] || item.roll || "";
            const guardianName =
              item.guardianName || item["Guardian Name"] || item.Guardian || "";
            const guardianPhone =
              item.guardianPhone || item["Guardian Phone"] || item.Phone || "";

            if (name && email && rollNumber) {
              rows.push({ name, email, rollNumber, guardianName, guardianPhone });
            }
          }

          if (rows.length === 0) {
            setPreviewError(
              "No valid rows found in Excel sheet. Check header column names."
            );
          } else {
            setParsedRows(rows);
          }
        } catch (err) {
          setPreviewError(`Failed to read Excel workbook: ${(err as Error).message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setPreviewError("Please upload a .csv or .xlsx Excel file.");
    }
  };

  // Execute Import
  const handleConfirmImport = async () => {
    if (!selectedClassId || parsedRows.length === 0) return;

    setIsProcessing(true);
    setPreviewError(null);

    try {
      const result = await processBulkStudentImport(parsedRows, selectedClassId);
      setImportReport(result);
      setParsedRows([]);
    } catch (err) {
      setPreviewError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/institution/students"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Students Directory
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-4">
          <div>
            <h1 className="text-xl font-bold text-primary-navy">
              Bulk Student Enrollment Engine
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload Excel (.xlsx) or CSV files to batch-create and allocate students to class sections.
            </p>
          </div>

          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-primary-blue" />
            Download Sample CSV
          </button>
        </div>

        {/* Step 1: Select Class & Upload File */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Class Cohort *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.deptCode})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              All parsed students will be enrolled in this cohort.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select CSV or Excel (.xlsx) File *
            </label>
            <label className="flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-primary-blue rounded-xl p-4 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="text-center">
                <Upload className="h-5 w-5 mx-auto text-primary-blue mb-1" />
                <span className="text-xs font-semibold text-slate-700 block">
                  {fileName ? fileName : "Click to select or drag file here"}
                </span>
                <span className="text-[10px] text-slate-400">
                  Headers: name, email, rollNumber, guardianName, guardianPhone
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Error Notification */}
        {previewError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            {previewError}
          </div>
        )}

        {/* Step 2: Data Preview */}
        {parsedRows.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Parsed Records Preview ({parsedRows.length} Students Detected)
                </h3>
                <p className="text-xs text-slate-400">
                  Review matched columns before committing to database.
                </p>
              </div>

              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary-blue hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {isProcessing ? "Processing Enrollment..." : "Commit & Enroll Students"}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </button>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Roll Number</th>
                    <th className="py-2.5 px-4">Guardian</th>
                    <th className="py-2.5 px-4">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[10px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {r.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                        {r.email}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                        {r.rollNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {r.guardianName || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px]">
                        {r.guardianPhone || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Success Report */}
        {importReport && (
          <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center space-x-3 text-emerald-800 font-bold text-sm mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Bulk Enrollment Completed Successfully</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-emerald-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Enrolled Students
                </span>
                <span className="text-xl font-extrabold text-emerald-700">
                  {importReport.imported}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Skipped / Invalid
                </span>
                <span className="text-xl font-extrabold text-slate-700">
                  {importReport.skipped}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-3">
              <Link
                href="/institution/students"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
              >
                View in Students Directory
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
