import type { Metadata } from "next";
export const metadata: Metadata = {
  title: { absolute: "Mockup de Cenários | Click & Gruda" },
};
export default function ScenesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
