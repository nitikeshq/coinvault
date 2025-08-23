import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wallet, Shield, Zap, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoginLoading, isRegisterLoading } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      phone: "",
      referralCode: "",
    },
  });

  const onLogin = (data: LoginForm) => {
    login({ email: data.email, password: data.password });
  };

  const onRegister = (data: RegisterForm) => {
    register(data);
  };

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:flex flex-col space-y-8 text-gray-800">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CryptoWallet Pro
            </h1>
            <p className="text-xl text-gray-600">
              Your secure gateway to the future of cryptocurrency management
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">Bank-Grade Security</h3>
              </div>
              <p className="text-sm text-gray-600">
                Military-grade encryption protects your digital assets with advanced security protocols.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">Lightning Fast</h3>
              </div>
              <p className="text-sm text-gray-600">
                Experience instant transactions and real-time balance updates across all devices.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">Multi-Token Support</h3>
              </div>
              <p className="text-sm text-gray-600">
                Manage multiple BEP-20 tokens in one unified, intuitive interface.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">Live Analytics</h3>
              </div>
              <p className="text-sm text-gray-600">
                Track portfolio performance with real-time charts and market insights.
              </p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Trusted by 50,000+ Users</h3>
                <p className="text-sm text-gray-600">Join our growing community of crypto enthusiasts</p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-bold text-white">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                {activeTab === "login" ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {activeTab === "login" 
                  ? "Sign in to access your secure wallet" 
                  : "Create your account to get started"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200">
                  <TabsTrigger value="login" className="text-gray-700 data-[state=active]:text-white data-[state=active]:bg-blue-600">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-gray-700 data-[state=active]:text-white data-[state=active]:bg-purple-600">
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter your email"
                                className="bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  className="bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 pr-10"
                                  data-testid="input-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password"
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

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isLoginLoading}
                        data-testid="button-login"
                      >
                        {isLoginLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      onClick={handleGoogleAuth}
                      data-testid="button-google-login"
                    >
                      Continue with Google
                    </Button>
                  </div>

                  <div className="text-center text-sm space-y-1">
                    <p className="text-gray-600">
                      Demo accounts: admin@cryptowallet.com / user@example.com
                    </p>
                    <p className="text-gray-600">Password: password123</p>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
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

                  <div className="text-center">
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}