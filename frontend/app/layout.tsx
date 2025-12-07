import "@suiet/wallet-kit/style.css";
import "./globals.css";
import type { ReactNode } from "react";
import { AppProviders } from "./providers";

export const metadata = {
  title: "VibeSwipe",
  description: "Crypto prediction tournaments with zkLogin"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
