import type { Metadata, Viewport } from "next";
import { Archivo_Black, Barlow, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

const barlow = Barlow({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Genua Digital Media — CRM · Muhasebe",
  description: "Genua Digital Media ajans CRM ve muhasebe paneli",
  applicationName: "Genua",
  icons: {
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Genua Digital Media",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body
        className={`${archivoBlack.variable} ${barlow.variable} ${ibmPlexMono.variable} font-sans antialiased overflow-x-hidden`}
      >
        <AuthProvider>
          <DataProvider>
            {children}
            <Toaster
              theme="dark"
              position="top-center"
              toastOptions={{
                style: {
                  background: "#141414",
                  border: "1px solid #262626",
                  color: "#FAFAFA",
                },
              }}
            />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
