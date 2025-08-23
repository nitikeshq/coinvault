import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Wallet, Eye, EyeOff, Sparkles, Image, TrendingUp, Shield, Zap, Gift } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import heroImage from "@assets/generated_images/Crypto_wallet_NFT_registration_hero_be3ab4ca.png";

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
  const { settings: websiteSettings } = useWebsiteSettings();
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
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-6 items-stretch min-h-[85vh]">
        {/* Left Side - Hero Content */}
        <div className="flex flex-col justify-center space-y-6 text-gray-800 px-4">
          <div className="space-y-5">
            {/* Benefits moved to top */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Gift className="h-5 w-5 mr-2 text-purple-600" />
                Why Join {websiteSettings?.siteName || 'Our Platform'}?
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Bank-grade security with military encryption</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span>Lightning-fast transactions on BSC network</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span>AI-powered content creation tools</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>Passive income through referral system</span>
                </div>
              </div>
            </div>

            {referralId && (
              <div className="inline-block bg-green-50 text-green-700 rounded-lg px-4 py-2 border border-green-200">
                🎉 Welcome! You're using referral code: <strong>{referralId}</strong>
                <div className="text-sm mt-1">Get bonus tokens after registration!</div>
              </div>
            )}

            {/* Hero Image */}
            <div className="relative">
              <img 
                src={heroImage} 
                alt={`${websiteSettings?.siteName || 'Platform'} - NFTs and Memes`} 
                className="w-full max-w-md mx-auto lg:mx-0 rounded-2xl shadow-lg"
              />
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                AI-Powered Platform
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <Image className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">AI NFT Generation</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Create unique NFTs with AI-powered artwork and metadata generation.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Meme Generator</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Generate viral memes with AI and share them with the community.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">BEP-20 Wallet</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Secure wallet for managing your BEP-20 tokens and crypto assets.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Earn Rewards</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Earn tokens through referrals, trading, and platform activities.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex flex-col justify-center w-full px-4">
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg h-fit">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Create Your Account</h2>
              <p className="text-sm text-gray-600 mt-1">Join the future of crypto wallet management</p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5">
                {/* Row 1: Name and Username */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium text-sm">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your full name"
                            className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 h-10"
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
                        <FormLabel className="text-gray-700 font-medium text-sm">Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Choose a username"
                            className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 h-10"
                            data-testid="input-username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Email and Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium text-sm">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 h-10"
                            data-testid="input-register-email"
                          />
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
                        <FormLabel className="text-gray-700 font-medium text-sm">Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Enter your phone number"
                            className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 h-10"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 3: Password and Referral Code */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium text-sm">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password (min 6)"
                              className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 pr-8 h-10"
                              data-testid="input-register-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-2 py-1 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-register-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-3 w-3 text-gray-600" />
                              ) : (
                                <Eye className="h-3 w-3 text-gray-600" />
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
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium text-sm">Referral Code (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter referral code"
                            className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 h-10"
                            data-testid="input-referral-code"
                            readOnly={!!referralId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-8 h-12 text-base font-medium"
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

            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-11"
                onClick={handleGoogleAuth}
                data-testid="button-google-register"
              >
                Sign up with Google
              </Button>
            </div>

            <div className="mt-6 text-center">
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
    </div>
  );
}