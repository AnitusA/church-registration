import { supabase } from "~/utils/supabase.client";
import type { MetaFunction, LinksFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import styles from "./login.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Church Portal - Login" },
    { name: "description", content: "Welcome to our church community portal" },
  ];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-content">
        <img 
          src="/church-logo.png" 
          alt="Church Logo" 
          className="logo" 
        />
        <h1>Welcome to Grace Community Church</h1>
        <p className="subtitle">Please sign in to access member resources</p>
        
        <form method="post" className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            Sign In
          </button>
          
          <div className="login-footer">
            <Link to="/forgot-password">Forgot password?</Link>
            <span>•</span>
            <Link to="/register">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}