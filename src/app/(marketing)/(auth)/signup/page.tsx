import SignUpForm from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </main>
  );
}
