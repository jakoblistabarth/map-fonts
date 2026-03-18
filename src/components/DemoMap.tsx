import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { type Font } from "./FontViewer";
import { type FC } from "react";
import ApplyFont from "./ApplyFont";

type Props = {
  font: Font | null;
};

const DemoMap: FC<Props> = ({ font }) => {
  return (
    <Map
      initialViewState={{
        longitude: 16.6068,
        latitude: 49.1951,
        zoom: 12,
      }}
      style={{
        width: "calc(100% - 1em)",
        height: "50dvh",
        margin: ".5em",
        borderRadius: "1em",
      }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <ApplyFont font={font} />
    </Map>
  );
};

export default DemoMap;
