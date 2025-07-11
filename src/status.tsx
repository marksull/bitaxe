import { Detail, getPreferenceValues, ActionPanel } from "@raycast/api";
import { useEffect, useState } from "react";

interface SystemInfo {
  [key: string]: unknown;
}

export default function Command() {
  const { bitAxeIps } = getPreferenceValues<{ bitAxeIps: string }>();
  const ipList = bitAxeIps?.split(",").map((ip) => ip.trim()).filter(Boolean) || [];

  // New state: info and loading for each IP
  const [infoMap, setInfoMap] = useState<Record<string, SystemInfo | null>>(() => Object.fromEntries(ipList.map(ip => [ip, null])));
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>(() => Object.fromEntries(ipList.map(ip => [ip, true])));
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>(() => Object.fromEntries(ipList.map(ip => [ip, null])));

  useEffect(() => {
    // Reset state when ipList changes
    setInfoMap(Object.fromEntries(ipList.map(ip => [ip, null])));
    setLoadingMap(Object.fromEntries(ipList.map(ip => [ip, true])));
    setErrorMap(Object.fromEntries(ipList.map(ip => [ip, null])));
    ipList.forEach((ip) => {
      fetchInfo(ip);
    });
    async function fetchInfo(ip: string) {
      setLoadingMap((prev) => ({ ...prev, [ip]: true }));
      setErrorMap((prev) => ({ ...prev, [ip]: null }));
      try {
        const res = await fetch(`http://${ip}/api/system/info`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SystemInfo;
        setInfoMap((prev) => ({ ...prev, [ip]: data }));
      } catch (e) {
        setInfoMap((prev) => ({ ...prev, [ip]: null }));
        setErrorMap((prev) => ({ ...prev, [ip]: e instanceof Error ? e.message : "Unknown error" }));
      } finally {
        setLoadingMap((prev) => ({ ...prev, [ip]: false }));
      }
    }
  }, [bitAxeIps]);

  if (ipList.length === 0) {
    return <Detail isLoading={false} markdown={"No IPs Configured. Please configure at least one BitAxe IP address in the extension preferences."} />;
  }

  // If all IPs have errors, show the first error
  if (ipList.every((ip) => errorMap[ip])) {
    const firstIp = ipList[0];
    let errorMessage = errorMap[firstIp] || "Unknown error";
    if (errorMessage.toLowerCase().includes("fetch failed") || errorMessage.toLowerCase().includes("networkerror")) {
      errorMessage = `Unable to connect to BitAxe at ${firstIp}. Please check that the device is online and accessible on your network.`;
    }
    return <Detail isLoading={false} markdown={`Error: ${errorMessage}`} />;
  }

  // Table fields
  const generalFields = [
    { label: "IP", key: "ip" },
    { label: "Hostname", key: "hostname" },
    { label: "Hashrate", key: "hashRate" },
  ];
  const systemFields = [
    { label: "Voltage", key: "voltage" },
    { label: "Current", key: "current" },
    { label: "Temperature", key: "temp" },
    { label: "VR Temperature", key: "vrTemp" },
    { label: "Frequency", key: "frequency" },
    { label: "Fan RPM", key: "fanrpm" },
  ];
  const wifiFields = [
    { label: "SSID", key: "ssid" },
    { label: "Status", key: "wifiStatus" },
    { label: "RSSI", key: "wifiRSSI" },
    { label: "MAC Address", key: "macAddr" },
  ];

  function getField(ip: string, key: string) {
    if (loadingMap[ip]) return "Loading";
    if (errorMap[ip]) return "Error";
    if (key === "ip") return ip;
    const info = infoMap[ip];
    if (!info) return "-";
    if (key === "voltage" && info["voltage"]) return (Number(info["voltage"]) / 1000).toFixed(2);
    if (key === "current" && info["current"]) return (Number(info["current"]) / 1000).toFixed(2);
    return info[key]?.toString() || "-";
  }

  function renderTable(title: string, fields: { label: string; key: string }[]) {
    const header = `| Field |${ipList.map((ip) => ` ${ip} |`).join("")}`;
    const sep = `| ------ |${ipList.map(() => " ----- | ").join("")}`;
    const rows = fields.map((f) => `| ${f.label} |${ipList.map((ip) => ` ${getField(ip, f.key)} |`).join("")}`).join("\n");
    return `## ${title}\n\n${header}\n${sep}\n${rows}`;
  }

  const markdown = `# BitAxe Status\n\n${renderTable("General", generalFields)}\n\n${renderTable("System Information", systemFields)}\n\n${renderTable("WiFi Settings", wifiFields)}`;

  return (
    <Detail
      isLoading={ipList.some((ip) => loadingMap[ip])}
      navigationTitle={"BitAxe Status"}
      markdown={markdown}
      actions={
        ipList.length > 1 ? (
          <ActionPanel></ActionPanel>
        ) : undefined
      }
    />
  );
}
