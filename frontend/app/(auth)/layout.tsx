import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desi Market | Auth",
  description: "Authenticate to your Desi Market account",
  robots: "noindex, nofollow",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
