import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/app/providers";
import { GoogleOAuthProvider } from "@react-oauth/google";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NakaFin",
  description: "Gerencie seus eventos corporativos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${roboto.variable} ${robotoMono.variable} antialiased`}
      >
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
