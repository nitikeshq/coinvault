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
    },
  });

  const onLogin = (data: LoginForm) => {
    login(data);
  };

  const onRegister = (data: RegisterForm) => {
    register(data);
  };

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:flex flex-col space-y-8 text-white">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              CryptoWallet Pro
            </h1>
            <p className="text-xl text-gray-300">
              Your secure gateway to the future of cryptocurrency management
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Wallet className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Wallet Management</h3>
                <p className="text-gray-400">Store and manage your BEP-20 tokens with bank-grade security</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Lightning Fast Transactions</h3>
                <p className="text-gray-400">Experience instant deposits and lightning-fast swaps</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Trading</h3>
                <p className="text-gray-400">Trade directly with PancakeSwap integration and live price feeds</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Shield className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold">Advanced Security</h3>
                <p className="text-gray-400">Multi-layer protection with cold storage technology</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <Card className="border-slate-700 bg-slate-800/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Welcome to CryptoWallet Pro</CardTitle>
              <CardDescription className="text-gray-400">
                {activeTab === "login" 
                  ? "Sign in to access your secure wallet" 
                  : "Create your account to get started"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger value="login" className="text-gray-300 data-[state=active]:text-white">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-gray-300 data-[state=active]:text-white">
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
                            <FormLabel className="text-gray-300">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter your email"
                                className="bg-slate-700 border-slate-600 text-white"
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
                            <FormLabel className="text-gray-300">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  className="bg-slate-700 border-slate-600 text-white pr-10"
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
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
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
                        className="w-full bg-blue-600 hover:bg-blue-700"
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
                      className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
                      onClick={handleGoogleAuth}
                      data-testid="button-google-login"
                    >
                      Continue with Google
                    </Button>
                  </div>

                  <div className="text-center text-sm">
                    <p className="text-gray-400">
                      Demo accounts: admin@cryptowallet.com / user@example.com
                    </p>
                    <p className="text-gray-400">Password: password123</p>
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
                            <FormLabel className="text-gray-300">Full Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your full name"
                                className="bg-slate-700 border-slate-600 text-white"
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
                            <FormLabel className="text-gray-300">Username</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Choose a username"
                                className="bg-slate-700 border-slate-600 text-white"
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
                            <FormLabel className="text-gray-300">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter your email"
                                className="bg-slate-700 border-slate-600 text-white"
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
                            <FormLabel className="text-gray-300">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password (min 6 characters)"
                                  className="bg-slate-700 border-slate-600 text-white pr-10"
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
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
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
                            <FormLabel className="text-gray-300">Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="tel"
                                placeholder="Enter your phone number"
                                className="bg-slate-700 border-slate-600 text-white"
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-purple-600 hover:bg-purple-700"
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
                      className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
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