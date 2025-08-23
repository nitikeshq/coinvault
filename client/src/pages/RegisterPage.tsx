import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Wallet, Shield, Zap, TrendingUp, Eye, EyeOff, Users, Gift, CheckCircle, Star, Award } from "lucide-react";
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

interface WebsiteSettings {
  logoUrl?: string;
  siteName?: string;
  description?: string;
}

interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: string;
}

interface PresaleProgress {
  totalRaised: string;
  targetAmount: string;
  percentage: number;
  investorCount: number;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [location] = useLocation();
  const { register: registerUser, isRegisterLoading } = useAuth();

  // Extract referral code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const referralCodeFromUrl = urlParams.get('ref') || urlParams.get('referral') || '';

  // Fetch website settings for SEO
  const { data: websiteSettings } = useQuery<WebsiteSettings>({
    queryKey: ['/api/website/settings'],
  });

  // Fetch token config
  const { data: tokenConfig } = useQuery<TokenConfig>({
    queryKey: ['/api/token/config'],
  });

  // Fetch presale progress
  const { data: presaleProgress } = useQuery<PresaleProgress>({
    queryKey: ['/api/presale/progress'],
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      phone: "",
      referralCode: referralCodeFromUrl,
    },
  });

  // Update referral code when URL changes
  useEffect(() => {
    if (referralCodeFromUrl) {
      registerForm.setValue('referralCode', referralCodeFromUrl);
    }
  }, [referralCodeFromUrl, registerForm]);

  const onRegister = (data: RegisterForm) => {
    registerUser(data);
  };

  const benefits = [
    {
      icon: <Gift className="h-5 w-5 text-yellow-400" />,
      title: "Early Investor Bonus",
      description: "Get exclusive presale pricing before public launch"
    },
    {
      icon: <Users className="h-5 w-5 text-blue-400" />,
      title: "Referral Rewards",
      description: "Earn 5% of every friend's investment you refer"
    },
    {
      icon: <Shield className="h-5 w-5 text-green-400" />,
      title: "Secure Wallet",
      description: "Bank-level security for your cryptocurrency"
    },
    {
      icon: <Star className="h-5 w-5 text-purple-400" />,
      title: "VIP Access",
      description: "Exclusive access to NFTs and DApp ecosystem"
    }
  ];

  const stats = [
    {
      value: (presaleProgress?.investorCount || 0).toLocaleString(),
      label: "Happy Investors"
    },
    {
      value: `$${parseFloat(presaleProgress?.totalRaised || "0").toLocaleString()}`,
      label: "Total Raised"
    },
    {
      value: "100%",
      label: "Security Audit"
    },
    {
      value: "24/7",
      label: "Support"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {websiteSettings?.logoUrl && (
                  <img 
                    src={websiteSettings.logoUrl} 
                    alt={`${websiteSettings?.siteName || 'CryptoWallet Pro'} Logo`}
                    className="h-10 w-10 rounded-lg"
                  />
                )}
                <h1 className="text-2xl font-bold text-white">
                  {websiteSettings?.siteName || "CryptoWallet Pro"}
                </h1>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold">
                PRESALE LIVE
              </Badge>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center p-4 pt-8">
          <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Hero Content */}
            <div className="space-y-8 text-white order-2 lg:order-1">
              
              {/* Referral Welcome Message */}
              {referralCodeFromUrl && (
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Gift className="h-6 w-6 text-green-400" />
                    <h3 className="text-xl font-semibold text-green-400">Special Invitation!</h3>
                  </div>
                  <p className="text-gray-300">
                    You've been invited with referral code <strong className="text-green-400">{referralCodeFromUrl}</strong>. 
                    Register now to unlock exclusive benefits and help your referrer earn rewards!
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold">
                  Join the 
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}Future
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Secure your position in the next generation of cryptocurrency. Get early access to our revolutionary wallet ecosystem with exclusive presale pricing.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white flex items-center">
                  <Award className="h-6 w-6 text-yellow-400 mr-2" />
                  Why Join Now?
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-white/5 rounded-lg p-4 border border-white/10">
                      {benefit.icon}
                      <div>
                        <div className="font-semibold text-white">{benefit.title}</div>
                        <div className="text-gray-400 text-sm">{benefit.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Trusted by Thousands</span>
                </div>
                <p className="text-gray-300">
                  Join {(presaleProgress?.investorCount || 1000).toLocaleString()} smart investors who have already secured their position. 
                  Don't miss this limited-time opportunity.
                </p>
              </div>
            </div>

            {/* Registration Form */}
            <div className="order-1 lg:order-2">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Wallet className="h-8 w-8 text-blue-400" />
                    <CardTitle className="text-3xl font-bold text-white">
                      Create Account
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-300 text-lg">
                    Start your crypto journey with exclusive presale access
                  </CardDescription>
                  {referralCodeFromUrl && (
                    <Badge className="bg-green-600 text-white">
                      Referred by: {referralCodeFromUrl}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Full Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                                  placeholder="Enter your full name"
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
                              <FormLabel className="text-white">Username</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                                  placeholder="Choose a username"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                                placeholder="Enter your email"
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
                            <FormLabel className="text-white">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showPassword ? "text" : "password"}
                                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 pr-10"
                                  placeholder="Create a strong password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                            <FormLabel className="text-white">Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                                placeholder="Enter your phone number"
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
                            <FormLabel className="text-white">Referral Code (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                                placeholder="Enter referral code"
                                readOnly={!!referralCodeFromUrl}
                              />
                            </FormControl>
                            <FormMessage />
                            {field.value && (
                              <p className="text-green-400 text-sm">
                                ✓ Referral code applied! You and your referrer will earn rewards.
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      <Separator className="bg-white/20" />

                      <Button 
                        type="submit" 
                        disabled={isRegisterLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
                      >
                        {isRegisterLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Join Presale Now"
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="text-center text-gray-400 text-sm">
                    By registering, you agree to our terms and conditions. 
                    <br />
                    Investment involves risk. Please invest responsibly.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <section className="py-12 px-4 border-t border-white/10 bg-black/20">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex items-center justify-center space-x-3 text-white">
                <Shield className="h-8 w-8 text-green-400" />
                <div>
                  <div className="font-semibold">Security Audited</div>
                  <div className="text-gray-400 text-sm">Smart contract verified</div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3 text-white">
                <Award className="h-8 w-8 text-yellow-400" />
                <div>
                  <div className="font-semibold">Regulatory Compliant</div>
                  <div className="text-gray-400 text-sm">KYC/AML verified</div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3 text-white">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <div className="font-semibold">Community Driven</div>
                  <div className="text-gray-400 text-sm">Transparent governance</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
  );
}