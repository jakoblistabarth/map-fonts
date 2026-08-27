import React, { useState, type FC } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import Button from "./button";

type Props = {
  title: string;
  children: React.ReactNode;
  initialOpen?: boolean;
};

const Collapsible: FC<Props> = ({ title, children, initialOpen }) => {
  const [isOpen, setIsOpen] = useState(initialOpen ?? false);

  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <div className="collapsible">
      <div style={{ marginBottom: "0.5rem" }}>
        <Button
          style={{ display: "flex", gap: "1em", alignItems: "center" }}
          onClick={togglePanel}
        >
          {title}{" "}
          {isOpen ? (
            <ChevronUpIcon style={{ height: "1em" }} />
          ) : (
            <ChevronDownIcon style={{ height: "1em" }} />
          )}
        </Button>
      </div>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
};

export default Collapsible;
