import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "../../icons";

export default function SignIn() {
  const { login, isLoading } = useKindeAuth();

  const handleSignIn = () => {
    login();
  };

  return (
    <>
      <PageMeta
        title="React.js SignIn Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js SignIn Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  Sign In
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sign in with your Kinde account
                </p>
              </div>

              <div>
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>Sign in with Kinde</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
