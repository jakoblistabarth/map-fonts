import { XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import type { FC } from "react";

/** "About" text link in the header, opening a short description of the project. */
const AboutDialog: FC<{ triggerClassName?: string }> = ({
  triggerClassName,
}) => (
  <Dialog.Root>
    <Dialog.Trigger className={triggerClassName}>About</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-100 bg-black/30" />
      <Dialog.Content className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-100 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl bg-white p-6 text-base shadow-xl">
        <Dialog.Title className="text-lg font-bold text-[#304cb3]">
          Map Fonts
        </Dialog.Title>
        <Dialog.Description>
          Do you sometimes feel lost when choosing the right font for your map?
        </Dialog.Description>
        <p>
          Swipe right on the fonts you like and left on the ones you
          don&rsquo;t. Each choice refines the next suggestions. After 10
          swipes, your selection unlocks under <em>Your fonts</em>.
        </p>
        <p>
          This project was created by Jakob Listabarth and Sacha Schlumpf, two
          cartographers passionate by graphic design and particularly curious
          about typography.
        </p>
        <p className="text-sm text-[#6f6f6f]">
          Font data from the{" "}
          <a
            className="underline underline-offset-2"
            href="https://fonts.google.com/metadata/fonts"
          >
            Google Fonts Metadata API
          </a>
          , the{" "}
          <a
            className="underline underline-offset-2"
            href="https://github.com/google/fonts"
          >
            Google Fonts repository
          </a>{" "}
          and{" "}
          <a
            className="underline underline-offset-2"
            href="https://github.com/jakoblistabarth/gf-metrics"
          >
            gf-metrics
          </a>
          .
        </p>
        <Dialog.Close
          aria-label="Close"
          className="absolute top-4 right-4 rounded-full p-1 text-[#6f6f6f] hover:text-black"
        >
          <XIcon className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export default AboutDialog;
