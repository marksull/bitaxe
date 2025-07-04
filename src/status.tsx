import { Detail, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";

interface SystemInfo {
  [key: string]: unknown;
}

export default function Command() {
  const { bitaxeIp } = getPreferenceValues<{ bitaxeIp: string }>();
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://${bitaxeIp}/api/system/info`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SystemInfo;
        setInfo(data);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Unknown error");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, [bitaxeIp]);

  if (loading) return <Detail markdown="Loading..." />;
  if (error) return <Detail markdown={`Error: ${error}`} />;
  if (!info) return <Detail markdown="No data received." />;

  // Only display specific fields in a formatted table
  const fields = [
    { label: "Voltage", key: "voltage" },
    { label: "Current", key: "current" },
    { label: "Temp", key: "temp" },
    { label: "VR Temp", key: "vrTemp" },
    { label: "Hash Rate", key: "hashRate" },
    { label: "Frequency", key: "frequency" },
    { label: "Fan RPM", key: "fanrpm" },
  ];

  const table =
    `| Field | Value |\n|-------|-------|\n` +
    fields
      .map(({ label, key }) => {
        let value = info[key];
        if ((key === "voltage" || key === "current") && typeof value === "number") {
          value = value / 1000;
        }
        return `| ${label} | ${value !== undefined ? String(value) : "-"} |`;
      })
      .join("\n");

  // WiFi settings table
  const wifiFields = [
    { label: "SSID", key: "ssid" },
    { label: "WiFi Status", key: "wifiStatus" },
    { label: "WiFi RSSI", key: "wifiRSSI" },
    { label: "MAC Address", key: "macAddr" },
  ];

  const wifiTable =
    `| WiFi Field | Value |\n|------------|-------|\n` +
    wifiFields
      .map(({ label, key }) => `| ${label} | ${info[key] !== undefined ? String(info[key]) : "-"} |`)
      .join("\n");

  return <Detail markdown={`# Bitaxe System Info\n\n${table}\n\n# WiFi Settings\n\n${wifiTable}`} />;
}
