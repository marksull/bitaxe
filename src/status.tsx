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

  return (
    <Detail
      markdown={`# Bitaxe System Info\n\n\n
${Object.entries(info)
  .map(([k, v]) => `**${k}**: ${JSON.stringify(v)}`)
  .join("\n")}`}
    />
  );
}
