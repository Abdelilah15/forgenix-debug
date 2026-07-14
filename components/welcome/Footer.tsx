import Link from "next/link";
import React from 'react';
import Forgenix, { ForgenixLogo, ForgenixText } from "@/components/ui/ForgenixLogo";


export default function Footer() {
    return (
        <footer className="relative flex h-screen flex-col items-center justify-end bg-[#0052FF] pb-10 pt-24">            
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#0052ff]/10 blur-[180px]" />
            </div>

            <div className="relative max-auto w-full max-w-7xl px-6">
                <div className=" overflow-hidden rounded-[42px] bg-white shadow-[0_30px_100px_rgba(0,82,255,0.08)]">

                    {/* ================= CTA ================= */}

                    <div className="border-b border-slate-100 px-10 pt-20 pb-10 lg:px-20">
                        <div className="max-w-4xl">

                            <div className="flex items-center mb-5">
                                <ForgenixLogo className="text-[#0052FF]" size={128} />
                                <ForgenixText className="text-[#0052FF]" size={128} hideLetters={['F']} />
                            </div>

                            <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
                                Ready to build
                                <br />
                                smart contracts on Base?
                            </h2>

                            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                                Deploy B20, ERC20, ERC721A, ERC1155 token and NFT contracts from one modern platform.
                            </p>

                            <Link
                                href="/dashboard"
                                className="mt-10 inline-flex items-center rounded-full bg-[#0052FF] px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#1b67ff] hover:shadow-[0_15px_35px_rgba(0,82,255,.25)]"
                            >
                                Launch App
                            </Link>
                        </div>
                    </div>

                    {/* ================= LINKS ================= */}

                    <div className="grid gap-14 px-10 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-20">

                        {/* Product */}

                        <div>
                            <h3 className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Product
                            </h3>

                            <div className="space-y-4">

                                <FooterLink href="/dashboard">
                                    Dashboard
                                </FooterLink>

                                <FooterLink href="/deploy">
                                    Deploy
                                </FooterLink>

                                <FooterLink href="/portfolio" disabled>
                                    Portfolio
                                </FooterLink>

                                <FooterLink href="/analytics" disabled>
                                    Analytics
                                </FooterLink>

                                <FooterLink href="/pricing" disabled>
                                    Pricing
                                </FooterLink>

                                <FooterLink  href="/explorer" disabled>
                                    Explorer
                                </FooterLink>

                            </div>
                        </div>

                        {/* Contracts */}

                        <div>
                            <h3 className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Contracts
                            </h3>

                            <div className="space-y-4">

                                <FooterLink href="/contracts/b20">
                                    B20
                                </FooterLink>

                                <FooterLink href="/contracts/erc20">
                                    ERC20
                                </FooterLink>

                                <FooterLink href="/contracts/erc721a">
                                    ERC721A
                                </FooterLink>

                                <FooterLink href="/contracts/erc1155">
                                    ERC1155
                                </FooterLink>

                            </div>
                        </div>

                        {/* Community */}

                        <div>
                            <h3 className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Community
                            </h3>

                            <div className="space-y-4">

                                <FooterLink href="#">
                                    Discord
                                </FooterLink>

                                <FooterLink href="#">
                                    X (Twitter)
                                </FooterLink>

                                <FooterLink href="#" disabled>
                                    Telegram
                                </FooterLink>

                                <FooterLink href="#" disabled>
                                    YouTube
                                </FooterLink>

                                <FooterLink href="#" disabled>
                                    Blog
                                </FooterLink>

                            </div>
                        </div>

                    </div>

                    {/* ================= BOTTOM ================= */}

                    <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-100 px-10 py-8 text-sm text-slate-500 lg:flex-row lg:px-20">

                        <div>
                            © {new Date().getFullYear()} Forgenix
                        </div>

                        <div className="font-medium text-[#0052FF]">
                            Be active on Base.
                        </div>

                        <div className="flex gap-6">
                            <FooterLink href="/privacy" disabled>
                                Privacy
                            </FooterLink>

                            <FooterLink href="/terms" disabled>
                                Terms
                            </FooterLink>

                            <FooterLink href="/cookies" disabled>
                                Cookies
                            </FooterLink>
                        </div>

                    </div>

                </div>
            </div>
        </footer>
    );
}

function FooterLink({
    href,
    children,
    disabled = false, // Ajout de la prop
}: {
    href: string;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    if (disabled) {
        return (
            <span
                className="block text-[15px] font-medium text-slate-400 cursor-not-allowed opacity-60"
                title="Bientôt disponible"
            >
                {children}
            </span>
        );
    }

    return (
        <Link
            href={href}
            className="block text-[15px] font-medium text-slate-700 transition-all duration-200 hover:translate-x-1 hover:text-[#0052FF]"
        >
            {children}
        </Link>
    );
}