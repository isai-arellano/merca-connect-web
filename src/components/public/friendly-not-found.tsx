import Link from "next/link";

type FriendlyNotFoundProps = {
    title: string;
    description: string;
    kicker?: string;
};

export function FriendlyNotFound({ title, description, kicker = "404" }: FriendlyNotFoundProps) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{kicker}</p>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
            <Link
                href="/"
                className="mt-10 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
                Ir al inicio
            </Link>
        </div>
    );
}
