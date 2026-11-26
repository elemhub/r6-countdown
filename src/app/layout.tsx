// The real layout (with <html>) lives in [locale]/layout.tsx.
// This pass-through root layout only exists so the root "/" page can be exported.
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return children;
}
