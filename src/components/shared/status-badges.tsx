import type {
  CompanyStatus,
  InvoiceStatus,
  ProposalStatus,
  ReceivableStatus,
} from "@/lib/types";
import {
  COMPANY_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  PROPOSAL_STATUS_LABELS,
  RECEIVABLE_STATUS_LABELS,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const map = {
    aktif: "default" as const,
    potansiyel: "warning" as const,
    pasif: "muted" as const,
    gorusmede: "info" as const,
  };
  return (
    <Badge variant={map[status]}>{COMPANY_STATUS_LABELS[status]}</Badge>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map = {
    odendi: "default" as const,
    bekliyor: "warning" as const,
    gecikti: "danger" as const,
    iptal: "muted" as const,
  };
  return (
    <Badge variant={map[status]}>{INVOICE_STATUS_LABELS[status]}</Badge>
  );
}

export function ReceivableStatusBadge({
  status,
}: {
  status: ReceivableStatus;
}) {
  const map = {
    odendi: "default" as const,
    bekliyor: "warning" as const,
    gecikti: "danger" as const,
  };
  return (
    <Badge variant={map[status]}>{RECEIVABLE_STATUS_LABELS[status]}</Badge>
  );
}

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const map = {
    gonderildi: "secondary" as const,
    cevap: "info" as const,
    gorusme: "warning" as const,
    kazanildi: "default" as const,
    kaybedildi: "danger" as const,
  };
  return (
    <Badge variant={map[status]}>{PROPOSAL_STATUS_LABELS[status]}</Badge>
  );
}
