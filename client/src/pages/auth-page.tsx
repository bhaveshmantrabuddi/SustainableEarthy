import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, Leaf } from "lucide-react";

export default function AuthPage() {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", name: "" });
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen">
      {/* Auth Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-8">
        <Tabs defaultValue="login" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                  Enter your email and password to access your sustainable spending dashboard.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLoginSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      required
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Join us to track and improve the sustainability of your spending.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegisterSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Name</Label>
                    <Input
                      id="register-name"
                      placeholder="John Doe"
                      required
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@example.com"
                      required
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/20 to-primary flex-col items-center justify-center text-white p-12">
        <div className="max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">EcoSpend Tracker</h1>
          <p className="text-lg mb-6">
            Understand the environmental impact of your spending habits and discover ways to make more sustainable choices.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold">Track</h3>
              <p className="text-sm">Monitor your spending across different categories</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold">Analyze</h3>
              <p className="text-sm">See the sustainability impact of your purchases</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold">Improve</h3>
              <p className="text-sm">Get personalized recommendations for eco-friendly alternatives</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}