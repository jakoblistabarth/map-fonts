import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import type { Font } from "./FontViewer";

export default function ApplyFont({ font }: { font: Font | null }) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || !font) return;
    const layers = map.getLayersOrder();
    const layersWithText = layers.filter((l) =>
      /label|name|poi|shield/.test(l),
    );
    layersWithText.forEach((l) =>
      map.setLayoutProperty(l, "text-font", [`'${font.family}'`]),
    );
  }, [mapRef, font]);
  return null;
}
