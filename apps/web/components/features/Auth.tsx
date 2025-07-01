"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
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
import { Feather } from "lucide-react";

export function Auth() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
      });
      toast.success("Registration successful! Please log in.");
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
      // Ideally, switch to the login tab here
    } catch {
      // The global error handler in api.ts will show the toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginUsername);
      formData.append('password', loginPassword);

      const response = await api.post("/auth/token", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const { access_token, user } = response.data;
      login(access_token, user);
      toast.success("Welcome back!");
    } catch {
      // The global error handler in api.ts will show the toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:flex lg:flex-col lg:items-center lg:justify-center p-10 text-center">
          <Feather className="h-20 w-20 mb-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tighter">WordNest</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            From passive notes to active knowledge.
          </p>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <Tabs defaultValue="login" className="w-full">
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