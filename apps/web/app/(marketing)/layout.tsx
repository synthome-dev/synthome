import FooterSection from "@/components/footer";
import Header from "@/components/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - Synthome",
    default: "Synthome",
  },
  description:
    "Build AI video, image, and audio pipelines with a simple composable API",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main role="main" className="bg-background" data-theme="light">
        <Header />
        {children}
        <FooterSection />
      </main>
    </>
  );
}
