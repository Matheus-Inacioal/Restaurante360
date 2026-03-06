export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="min-h-screen bg-[#f6f1d8]">{children}</div>;
}
