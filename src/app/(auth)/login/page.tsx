import { BootstrapSetupBanner } from "@/features/auth/components/BootstrapSetupBanner";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-10 flex justify-center p-4">
        <BootstrapSetupBanner />
      </div>
      <LoginForm />
    </>
  );
}