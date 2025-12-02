export default function BlogLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <section className="bg-muted border-b">
            <div className="@container pt-22 pb-16 md:pb-24 md:pt-32">{children}</div>
        </section>
    )
}