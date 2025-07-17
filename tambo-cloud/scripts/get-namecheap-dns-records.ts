#!/usr/bin/env tsx
/**
 * Usage:
 * 1. Login to Namecheap Account
 * 2. Get JSON from https://ap.www.namecheap.com/Domains/dns/GetAdvancedDnsInfo?fillTransferInfo=false&domainName=YOURDOMAINNAME.com
 * 3. Save it to file
 * 4. `tsx get-namecheap-dns-records.ts data.json`
 */

import * as fs from "fs";

const RECORD_TYPES: Record<number, string> = {
  1: "A",
  2: "CNAME",
  3: "MX",
  5: "TXT",
  8: "AAAA",
  9: "NS",
  10: "URL Redirect",
  11: "SRV",
  12: "CAA",
  13: "ALIAS",
};

type OutputFormat = "default" | "cloudflare";

interface DNSRecord {
  IsActive: boolean;
  RecordType: number;
  Data: string;
  Host: string;
  Ttl: number;
  Priority?: number;
}

interface CustomHostRecords {
  Records: DNSRecord[];
}

interface DomainBasicDetails {
  DomainName: string;
}

interface DNSResult {
  CustomHostRecords?: CustomHostRecords;
  DomainBasicDetails: DomainBasicDetails;
}

interface DNSInfo {
  Result?: DNSResult;
}

interface ParsedArgs {
  filename: string;
  format: OutputFormat;
  output?: string;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "Usage: tsx get-namecheap-dns-records.ts <filename> [--format default|cloudflare] [--output <filename>]",
    );
    process.exit(1);
  }

  const filename = args[0];
  let format: OutputFormat = "default";
  let output: string | undefined;

  // Parse format argument
  const formatIndex = args.findIndex(
    (arg) =>
      arg === "--format" || arg === "-format" || arg === "--f" || arg === "-f",
  );
  if (formatIndex !== -1 && formatIndex + 1 < args.length) {
    const formatArg = args[formatIndex + 1];
    if (formatArg === "default" || formatArg === "cloudflare") {
      format = formatArg;
    } else {
      console.error('ERROR: Format must be either "default" or "cloudflare"');
      process.exit(1);
    }
  }

  // Parse output argument
  const outputIndex = args.findIndex(
    (arg) =>
      arg === "--output" || arg === "-output" || arg === "--o" || arg === "-o",
  );
  if (outputIndex !== -1 && outputIndex + 1 < args.length) {
    output = args[outputIndex + 1];
  }

  return { filename, format, output };
}

function generateZoneFile(
  dnsInfo: DNSInfo,
  outputFormat: OutputFormat,
): string {
  if (!dnsInfo.Result?.CustomHostRecords?.Records) {
    throw new Error("JSON is in an unexpected format");
  }

  const records = dnsInfo.Result.CustomHostRecords.Records;
  const domain = dnsInfo.Result.DomainBasicDetails.DomainName;

  if (!records.length) {
    throw new Error("No DNS records found in JSON");
  }

  const zoneLines: string[] = [];

  // Add zone file header
  zoneLines.push(`; Zone file for ${domain}`);
  zoneLines.push(`; Generated on ${new Date().toISOString()}`);
  zoneLines.push("");

  // Add SOA record (Start of Authority)
  zoneLines.push(`$ORIGIN ${domain}.`);
  zoneLines.push(`$TTL 300`);
  zoneLines.push("");

  // Find NS records to use in SOA, or use a default
  const nsRecords = records.filter((r) => r.IsActive && r.RecordType === 9);
  const primaryNS = nsRecords.length > 0 ? nsRecords[0].Data : `ns1.${domain}.`;

  zoneLines.push(`@\tIN\tSOA\t${primaryNS} admin.${domain}. (`);
  zoneLines.push(`\t\t\t${Math.floor(Date.now() / 1000)}\t; serial`);
  zoneLines.push(`\t\t\t3600\t\t; refresh`);
  zoneLines.push(`\t\t\t1800\t\t; retry`);
  zoneLines.push(`\t\t\t1209600\t\t; expire`);
  zoneLines.push(`\t\t\t300\t\t; minimum`);
  zoneLines.push(`\t\t\t)`);
  zoneLines.push("");

  // Process DNS records
  for (const record of records) {
    // Skip inactive records
    if (!record.IsActive) {
      continue;
    }

    // Skip unknown record types
    if (!(record.RecordType in RECORD_TYPES)) {
      continue;
    }

    const recordType = RECORD_TYPES[record.RecordType];
    let value = record.Data;
    let host = record.Host;

    // Format host field
    if (outputFormat === "cloudflare") {
      if (host === "@") {
        host = domain;
      } else {
        host = `${host}.${domain}.`;
      }
    }

    // Format value based on record type
    if (recordType === "MX") {
      value = `${record.Priority}\t${value}`;
    } else if (recordType === "TXT") {
      value = `"${value}"`;
    } else if (recordType === "CNAME" || recordType === "NS") {
      // Ensure CNAME and NS records end with a dot if they're FQDNs
      if (!value.endsWith(".") && value.includes(".")) {
        value = `${value}.`;
      }
    }

    // Format the record line with proper spacing
    const ttl = record.Ttl.toString();
    const line = `${host}\t${ttl}\tIN\t${recordType}\t${value}`;
    zoneLines.push(line);
  }

  return zoneLines.join("\n");
}

function main(): void {
  try {
    const args = parseArgs();
    const { filename, format, output } = args;

    // Check if file exists
    if (!fs.existsSync(filename)) {
      throw new Error(`File ${filename} not found`);
    }

    // Read and parse JSON file
    const fileContent = fs.readFileSync(filename, "utf8");
    const dnsInfo: DNSInfo = JSON.parse(fileContent);

    // Generate zone file
    const zoneFile = generateZoneFile(dnsInfo, format);

    // Output zone file
    if (output) {
      fs.writeFileSync(output, zoneFile);
      console.log(`Zone file written to ${output}`);
    } else {
      console.log(zoneFile);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(
        `ERROR: Unable to decode JSON from ${process.argv[2]}: ${error.message}`,
      );
    } else if (error instanceof Error) {
      console.error(`ERROR: ${error.message}`);
    } else {
      console.error(`ERROR: ${error}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
