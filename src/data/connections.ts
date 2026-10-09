import {
  Banknote,
  Boxes,
  Calculator,
  Cloud,
  FileSpreadsheet,
  FolderOpen,
  HardDrive,
  Mail,
  MessageSquare,
  NotebookPen,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The places .biz works.
 *
 * This is the other half of what makes .biz different from .click. There,
 * a project is a shelf of delivered files and the project page's job is to
 * hand them over. Here, bookkeeping, invoicing, payroll and CRM work all
 * happen inside systems the CLIENT already owns -- their Drive folder,
 * their Sheet, their accounting software -- and often there is nothing to
 * download at all. The deliverable is that their books are current.
 *
 * So a project records the locations we have been given access to. This
 * list is the source of truth for which providers exist;
 * project_connections.provider only shape-checks the id, deliberately, so
 * adding one here needs no migration (see migration 0009).
 *
 * WHAT THIS IS NOT. There is no OAuth here and no tokens are stored. A
 * connection is a share link or an account reference that the client has
 * already granted access to, plus a note about how. Holding OAuth tokens
 * would mean holding the keys to a client's accounting system; that is a
 * liability this product does not need, and the honest version of "connect
 * your Drive" for a service business is "share the folder with us".
 */

export type ConnectionProvider = {
  /** Matches project_connections.provider: lowercase, hyphens or underscores. */
  id: string;
  name: string;
  icon: LucideIcon;
  /** What we do with it, in one line. */
  purpose: string;
  /** What the client has to do, concretely. Shown when they add one. */
  howTo: string;
  /** The field label for `location`, because a folder link and an account
   *  reference are not the same thing and "Location" helps nobody. */
  locationLabel: string;
  locationHint: string;
  group: ConnectionGroupId;
};

export type ConnectionGroupId = "storage" | "books" | "records" | "comms";

export const connectionGroups: {
  id: ConnectionGroupId;
  label: string;
  blurb: string;
  icon: LucideIcon;
}[] = [
  {
    id: "storage",
    label: "Files & documents",
    blurb: "Where paperwork lives — receipts, contracts, scans.",
    icon: FolderOpen,
  },
  {
    id: "books",
    label: "Accounting & books",
    blurb: "Where the numbers live, if you already keep them somewhere.",
    icon: Calculator,
  },
  {
    id: "records",
    label: "Records & pipelines",
    blurb: "Customers, leads, stock and anything else tracked in a sheet or tool.",
    icon: Boxes,
  },
  {
    id: "comms",
    label: "Messages & inbox",
    blurb: "Where things arrive that we need to see.",
    icon: Mail,
  },
];

export const connectionProviders: ConnectionProvider[] = [
  {
    id: "google_drive",
    name: "Google Drive",
    icon: HardDrive,
    purpose: "The usual home for receipts, contracts and anything scanned.",
    howTo:
      "Create a folder, then Share → add our email as Editor. Paste the folder link below. Editor rather than Viewer, because filing is part of the work.",
    locationLabel: "Folder link",
    locationHint: "https://drive.google.com/drive/folders/…",
    group: "storage",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: Cloud,
    purpose: "Same job as Drive, if this is what you already use.",
    howTo: "Share the folder with our email, with edit permission, and paste the link.",
    locationLabel: "Folder link",
    locationHint: "https://www.dropbox.com/scl/fo/…",
    group: "storage",
  },
  {
    id: "onedrive",
    name: "OneDrive / SharePoint",
    icon: Cloud,
    purpose: "Where paperwork lives if your business runs on Microsoft 365.",
    howTo: "Share the folder with our email, allow editing, and paste the link.",
    locationLabel: "Folder link",
    locationHint: "https://…sharepoint.com/…",
    group: "storage",
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    icon: FileSpreadsheet,
    purpose: "Trackers we build and keep current — cash flow, payroll, stock, KPIs.",
    howTo:
      "If you already have the sheet, share it as Editor and paste the link. If not, leave the link blank and we'll create it and share it with you.",
    locationLabel: "Sheet link",
    locationHint: "https://docs.google.com/spreadsheets/d/… — or leave blank",
    group: "records",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    icon: Banknote,
    purpose: "Bookkeeping, reconciliation and reports in the software you already pay for.",
    howTo:
      "Invite us as an Accountant user from Settings → Manage Users. Put the company name or ID below so we know which file.",
    locationLabel: "Company name or ID",
    locationHint: "The company file we should be looking at",
    group: "books",
  },
  {
    id: "xero",
    name: "Xero",
    icon: Banknote,
    purpose: "Same as QuickBooks, for businesses on Xero.",
    howTo:
      "Invite us from Settings → Users with Adviser access. Put the organisation name below.",
    locationLabel: "Organisation name",
    locationHint: "The Xero organisation we should be in",
    group: "books",
  },
  {
    id: "zoho_books",
    name: "Zoho Books",
    icon: Banknote,
    purpose: "Bookkeeping for businesses already in the Zoho suite.",
    howTo: "Invite our email as a Staff or Accountant user, then name the organisation below.",
    locationLabel: "Organisation name",
    locationHint: "The Zoho organisation we should be in",
    group: "books",
  },
  {
    id: "crm_tool",
    name: "Your CRM",
    icon: Users,
    purpose: "Customer records and pipeline, wherever you keep them.",
    howTo:
      "Add our email as a user, or share the sheet if your pipeline is a spreadsheet. Name the tool below so we know what we're walking into.",
    locationLabel: "Tool and link",
    locationHint: "e.g. HubSpot, Pipedrive, or a Sheets link",
    group: "records",
  },
  {
    id: "notion",
    name: "Notion",
    icon: NotebookPen,
    purpose: "Procedures, SOPs and internal documentation.",
    howTo: "Share the page with our email with full access, and paste its link.",
    locationLabel: "Page link",
    locationHint: "https://www.notion.so/…",
    group: "records",
  },
  {
    id: "email_inbox",
    name: "Email forwarding",
    icon: Mail,
    purpose: "Invoices and bills that arrive by email, forwarded to us automatically.",
    howTo:
      "Set up a forwarding rule for supplier invoices to the address we give you. A rule, not your password — we never ask for mailbox access.",
    locationLabel: "Address forwarding from",
    locationHint: "accounts@yourbusiness.com",
    group: "comms",
  },
  {
    id: "whatsapp_telegram",
    name: "WhatsApp or Telegram",
    icon: MessageSquare,
    purpose: "The fastest way to send us a photo of a receipt.",
    howTo: "Tell us the number or handle to expect messages from.",
    locationLabel: "Number or handle",
    locationHint: "+971… or @handle",
    group: "comms",
  },
  {
    id: "other",
    name: "Something else",
    icon: Boxes,
    purpose: "Anything above that doesn't fit. Describe it and we'll work it out.",
    howTo: "Tell us what the system is and how we should get to it.",
    locationLabel: "Where it is",
    locationHint: "A link, an account name, or a description",
    group: "records",
  },
];

export function providerById(id: string): ConnectionProvider | undefined {
  return connectionProviders.find((provider) => provider.id === id);
}

export function providersIn(group: ConnectionGroupId): ConnectionProvider[] {
  return connectionProviders.filter((provider) => provider.group === group);
}

export const CONNECTION_STATUSES = ["requested", "connected", "revoked"] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const connectionStatusLabels: Record<ConnectionStatus, string> = {
  requested: "Access pending",
  connected: "Connected",
  revoked: "Access ended",
};
