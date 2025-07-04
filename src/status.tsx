import { Detail, getPreferenceValues, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";

interface SystemInfo {
  [key: string]: unknown;
}

export default function Command() {
  const { bitaxeIps } = getPreferenceValues<{ bitaxeIps: string }>();
  const ipList = bitaxeIps?.split(",").map((ip) => ip.trim()).filter(Boolean) || [];

  const [selectedIp, setSelectedIp] = useState<string>(() => (ipList.length > 0 ? ipList[0] : ""));
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedIp) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    async function fetchInfo() {
      try {
        const res = await fetch(`http://${selectedIp}/api/system/info`);
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
  }, [selectedIp]);

  if (ipList.length === 0) {
    return <Detail isLoading={false} markdown={"No IPs Configured. Please configure at least one Bitaxe IP address in the extension preferences."} />;
  }

  if (error) {
    return <Detail isLoading={false} markdown={`Error: ${error}`} />;
  }

  if (loading || !info) {
    return <Detail isLoading={true} markdown={"Loading..."} />;
  }

  return (
    <Detail
      isLoading={false}
      navigationTitle={(info["hostname"]?.toString() || selectedIp) as string}
      markdown={
        `# Bitaxe Status\n\n**IP:** ${selectedIp}\n**Hostname:** ${info["hostname"]?.toString() || "-"}\n**Hashrate:** ${info["hashRate"] ? info["hashRate"] + " H/s" : "-"}\n\n---\n\n## System Information\n\n- **Voltage:** ${info["voltage"] ? (Number(info["voltage"]) / 1000).toFixed(2) : "-"}\n- **Current:** ${info["current"] ? (Number(info["current"]) / 1000).toFixed(2) : "-"}\n- **Temperature:** ${info["temp"]?.toString() || "-"}\n- **VR Temperature:** ${info["vrTemp"]?.toString() || "-"}\n- **Frequency:** ${info["frequency"]?.toString() || "-"}\n- **Fan RPM:** ${info["fanrpm"]?.toString() || "-"}\n\n---\n\n## WiFi Settings\n\n- **SSID:** ${info["ssid"]?.toString() || "-"}\n- **Status:** ${info["wifiStatus"]?.toString() || "-"}\n- **RSSI:** ${info["wifiRSSI"]?.toString() || "-"}\n- **MAC Address:** ${info["macAddr"]?.toString() || "-"}\n`
      }
      actions={
        ipList.length > 1 ? (
          <ActionPanel>
            {ipList.map((ip) => (
              <Action
                key={ip}
                title={`Switch to ${ip}`}
                onAction={() => setSelectedIp(ip)}
                icon="🌐"
              />
            ))}
          </ActionPanel>
        ) : undefined
      }
    />
  );
}
