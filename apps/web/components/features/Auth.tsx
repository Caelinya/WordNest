"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";

export function Auth() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const { login } = useAuth();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      const { access_token, user } = data;
      login(access_token, user);
      toast.success("Welcome back!");
      router.push("/dashboard");
    },
    // onError is handled globally by the axios interceptor
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Registration successful! Please log in.");
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
      setActiveTab("login"); // Switch to the login tab
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      username: registerUsername,
      email: registerEmail,
      password: registerPassword,
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginUsername,
      password: loginPassword,
    });
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:flex lg:flex-col lg:items-center lg:justify-center p-10 text-center">
          <Logo className="h-20 w-20 mb-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tighter">WordNest</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            From passive notes to active knowledge.
          </p>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome Back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your knowledge base.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                      <Input
                        id="login-username"
                        placeholder="Username"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </TabsContent>
            <TabsContent value="register">
              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl">Create an Account</CardTitle>
                  <CardDescription>
                    Start building your personal knowledge nest today.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                      <Input
                        id="register-username"
                        placeholder="Username"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                        <Input
                            id="register-email"
                            type="email"
                            placeholder="Email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Sign Up"}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}