import { GraduationCap } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-10 w-10 text-primary" />
                    <h1 className="text-3xl font-bold">Academy CRM</h1>
                </div>
                <p className="text-muted-foreground">
                    A CRM for freelance music teachers
                </p>
            </div>
            {children}
        </div>
    );
}
