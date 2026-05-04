import { CloudExportHub } from "@/components/export/CloudExportHub";

export const metadata = {
  title: "Export & Sync Hub · Spendy",
  description: "Export your expense data to any cloud service",
};

export default function ExportPage() {
  return <CloudExportHub />;
}
