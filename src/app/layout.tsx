import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Vaada — Every promise, followed through", template: "%s · Vaada" },
  description: "An AI-assisted lead CRM for Indian small businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
