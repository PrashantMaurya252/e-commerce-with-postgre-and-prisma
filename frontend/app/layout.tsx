import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/redux/provider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import NetworkGuard from "@/components/NetworkGuard";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DesiMarket — Admin",
  description: "Admin panel for DesiMarket e-commerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <GoogleOAuthProvider
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}
          >
            <ReduxProvider>
              <NetworkGuard />
              <Toaster theme="dark" />
              {children}
            </ReduxProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
