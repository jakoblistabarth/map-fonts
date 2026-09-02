import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FC,
} from "react";
import styles from "./MapDropZone.module.css";

type LabelColor = "black" | "white";

type Props = {
  currentImageSrc: string | null;
  labelColor: LabelColor;
  zoom: number;
  onImageChange: (file: File | null) => void;
  onReset: () => void;
  onLabelColorChange: (color: LabelColor) => void;
  onZoomChange: (zoom: number) => void;
};

const MapDropZone: FC<Props> = ({
  currentImageSrc,
  labelColor,
  zoom,
  onImageChange,
  onReset,
  onLabelColorChange,
  onZoomChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    const isAccepted =
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      /\.(png|jpe?g)$/i.test(file.name);

    if (!isAccepted) return;

    onImageChange(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="hidden flex-col items-center gap-8 lg:flex">
      <div className={styles.colorGroup}>
        <div className={styles.text}>Labels color</div>
        <div className={styles.colorRow}>
          {(["white", "black"] as const).map((color) => {
            const isSelected = labelColor === color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => onLabelColorChange(color)}
                aria-label={`Set labels to ${color}`}
                className={[
                  styles.colorButton,
                  isSelected
                    ? styles.colorButtonSelected
                    : styles.colorButtonUnselected,
                ].join(" ")}
                style={{
                  background: color,
                }}
              />
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`${styles.uploadButton} ${isDragging ? styles.uploadButtonDragging : ""}`}
        style={{
          background: currentImageSrc
            ? `linear-gradient(rgba(17, 17, 17, 0.18), rgba(17, 17, 17, 0.18)), url(${currentImageSrc}) center / cover no-repeat`
            : "#f3f3f3",
        }}
        aria-label="Upload a map image"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          hidden
          onChange={handleInputChange}
        />
        <span className={`${styles.text} ${styles.uploadText}`}>
          {currentImageSrc ? "Map" : "Drop image"}
        </span>
      </button>

      <div className={styles.zoomGroup}>
        <label htmlFor="map-zoom" className={styles.text}>
          Zoom
        </label>
        <input
          id="map-zoom"
          type="range"
          min={1}
          max={2}
          step={0.05}
          value={zoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
          className={styles.zoomInput}
          aria-label="Zoom map image"
        />
      </div>

      {currentImageSrc && (
        <button
          type="button"
          onClick={onReset}
          className={`${styles.text} ${styles.resetButton}`}
        >
          Reset map
        </button>
      )}
    </div>
  );
};

export default MapDropZone;
