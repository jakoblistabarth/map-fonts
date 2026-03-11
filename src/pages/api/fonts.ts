export type Font = {
  id: string;
  family: string;
  variants: string[];
  subsets: string[];
  category: string;
  version: string;
  lastModified: string;
  popularity: number;
  defSubset: string;
  defVariant: string;
};

export async function GET() {
  try {
    const res = await fetch("https://gwfh.mranftl.com/api/fonts");
    const data = (await res.json()) satisfies Font[];
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch fonts" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
