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
      <div className="mb-2">
        <Button className="flex items-center gap-2" onClick={togglePanel}>
          {title}{" "}
          {isOpen ? (
            <ChevronUpIcon className="size-3" />
          ) : (
            <ChevronDownIcon className="size-3" />
          )}
        </Button>
      </div>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
};

export default Collapsible;
