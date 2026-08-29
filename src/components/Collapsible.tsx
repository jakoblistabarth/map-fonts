"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Props = {
  title: string;
  initialOpen?: boolean;
};

const GenericCollapsible: React.FC<React.PropsWithChildren<Props>> = ({
  title,
  children,
  initialOpen,
}) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen ?? false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-4">
        <h4>{title}</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <ChevronsUpDown />
            <span className="sr-only">Toggle details</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-col gap-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default GenericCollapsible;
