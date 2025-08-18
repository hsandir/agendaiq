import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackLink({ 
  href, 
  label = "Back", 
  className = "inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
}: BackLinkProps) {
  return (
    <Link href={href as Record<string, unknown>} className={className}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Link>
  );
}