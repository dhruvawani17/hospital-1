
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { HealthFirstLogo } from "@/components/shared/icons";
import { APP_NAME } from "@/lib/constants";
import { Loader2, Mail, Lock, User, LogIn, UserPlus } from "lucide-react";

// const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
//   <svg viewBox="0 0 24 24" {...props}>
//     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
//     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
//     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
//     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
//     <path d="M1 1h22v22H1z" fill="none"/>
//   </svg>
// );


const formSchema = (isSignUpMode: boolean) => z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  displayName: isSignUpMode 
    ? z.string().min(2, { message: "Display name must be at least 2 characters." }) 
    : z.string().optional(),
  confirmPassword: isSignUpMode 
    ? z.string().min(6, { message: "Please confirm your password." }) 
    : z.string().optional(),
}).superRefine((data, ctx) => {
  if (isSignUpMode) {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  }
});

type LoginFormValues = z.infer<ReturnType<typeof formSchema>>;

export function LoginClient() {
  const { /*loginWithGoogle,*/ signUpWithEmail, signInWithEmail, loading } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const currentFormSchema = formSchema(isSignUpMode);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      confirmPassword: "",
    },
    mode: "onChange", 
  });
  
  React.useEffect(() => {
    form.reset({ email: "", password: "", displayName: "", confirmPassword: "" }); 
  }, [isSignUpMode, form]);


  async function onSubmit(data: LoginFormValues) {
    if (isSignUpMode) {
      if (data.displayName) { 
        await signUpWithEmail(data.email, data.password, data.displayName);
      }
    } else {
      await signInWithEmail(data.email, data.password);
    }
  }

  return (
    <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="inline-flex justify-center items-center mb-4">
            <HealthFirstLogo className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-headline">{APP_NAME}</CardTitle>
          <CardDescription>
            {isSignUpMode ? "Create your account to get started." : "Sign in to access your dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 
          <Button
            variant="outline"
            className="w-full text-base py-6"
            // onClick={loginWithGoogle} 
            onClick={() => alert("Google Sign-In temporarily disabled.")}
            disabled={loading}
            aria-disabled={loading}
          >
            {loading && !form.formState.isSubmitting ? ( 
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon className="mr-3 h-5 w-5" />
            )}
            Sign in with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or with email
              </span>
            </div>
          </div>
          */}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isSignUpMode && (
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" /> Full Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Password
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isSignUpMode && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
                {(loading && form.formState.isSubmitting) ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isSignUpMode ? <UserPlus className="mr-2 h-5 w-5"/> : <LogIn className="mr-2 h-5 w-5"/>) }
                {isSignUpMode ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 text-sm">
          <Button variant="link" onClick={() => setIsSignUpMode(!isSignUpMode)} disabled={loading}>
            {isSignUpMode 
              ? "Already have an account? Sign In" 
              : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
