import "maplibre-gl/dist/maplibre-gl.css";
import { type FC } from "react";
import Map from "react-map-gl/maplibre";
import { type Font } from "../types/font";
import ApplyFont from "./ApplyFont";
import { Card } from "./ui/card";

type Props = {
  font: Font | null;
};

const DemoMap: FC<Props> = ({ font }) => {
  return (
    <Card className="order-first h-[50dvh] min-w-0 overflow-hidden p-0 md:order-0 md:h-full">
      <Map
        initialViewState={{
          longitude: 16.6068,
          latitude: 49.1951,
          zoom: 12,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
      >
        <ApplyFont font={font} />
      </Map>
    </Card>
  );
};

export default DemoMap;
