import { useEffect, useState, type FC } from "react";
import type { Font } from "../pages/api/fonts";

type Props = {
  font: Font | null;
  setFont: (font: Font | null) => void;
};

const FontList: FC<Props> = ({ font, setFont }) => {
  const [fonts, setFonts] = useState<Font[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/fonts");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        setFonts(data);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to fetch");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Loading fonts…</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!fonts) return <div>No fonts found</div>;

  return (
    <>
      <select
        value={font?.id || ""}
        onChange={(e) =>
          setFont(fonts.find((d) => d.id === e.target.value) || null)
        }
      >
        <option value="" disabled>
          Select an option
        </option>
        {fonts.map((d) => (
          <option value={d.id} key={d.id}>
            {d.family}
          </option>
        ))}
      </select>
      {font && (
        <pre
          style={{
            maxHeight: 100,
            overflow: "auto",
            padding: "1em",
            background: "rgb(250,250,250)",
            borderRadius: "1em",
          }}
        >
          {JSON.stringify(font, null, 2)}
        </pre>
      )}
    </>
  );
};

export default FontList;
