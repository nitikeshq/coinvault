import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Wallet, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, isRegisterLoading } = useAuth();
  const search = useSearch();
  
  // Extract referral code from URL parameters
  const urlParams = new URLSearchParams(search);
  const referralId = urlParams.get('ref') || urlParams.get('referral') || '';

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      phone: "",
      referralCode: referralId,
    },
  });

  // Update referral code when URL changes
  useEffect(() => {
    if (referralId) {
      registerForm.setValue('referralCode', referralId);
    }
  }, [referralId, registerForm]);

  const onRegister = (data: RegisterForm) => {
    register(data);
  };

  const handleGoogleAuth = () => {
    // Preserve referral code in Google auth redirect
    const authUrl = referralId 
      ? `/api/auth/google?ref=${encodeURIComponent(referralId)}`
      : `/api/auth/google`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Join CryptoWallet Pro and start your crypto journey
              {referralId && (
                <div className="mt-2 text-sm bg-green-50 text-green-700 rounded-lg px-3 py-2 border border-green-200">
                  🎉 You're using referral code: <strong>{referralId}</strong>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your full name"
                          className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Choose a username"
                          className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="input-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="input-register-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password (min 6 characters)"
                            className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 pr-10"
                            data-testid="input-register-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-register-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-600" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="Enter your phone number"
                          className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Referral Code (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter referral code to get bonuses"
                          className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="input-referral-code"
                          readOnly={!!referralId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isRegisterLoading}
                  data-testid="button-register"
                >
                  {isRegisterLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                onClick={handleGoogleAuth}
                data-testid="button-google-register"
              >
                Sign up with Google
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                  Sign in here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}