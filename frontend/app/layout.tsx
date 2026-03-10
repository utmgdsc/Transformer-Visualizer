import { GeistSans } from "geist/font/sans";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} antialiased bg-black text-white`}>
      <body>
        {children}
      </body>
    </html>
  );
}