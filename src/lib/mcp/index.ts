import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listServices from "./tools/list-services";
import listShopProducts from "./tools/list-shop-products";
import listPortfolio from "./tools/list-portfolio";
import listBlogPosts from "./tools/list-blog-posts";
import submitContactMessage from "./tools/submit-contact-message";

const supabaseUrl = (process.env.SUPABASE_URL ?? "https://supabase.invalid").replace(/\/+$/, "");

export default defineMcp({
  name: "shachavir-timber-mcp",
  title: "Shachavir Timber",
  version: "0.1.0",
  instructions:
    "Tools for exploring Shachavir Timber's public catalog (services, shop products, portfolio, blog) and submitting contact messages.",
  auth: auth.oauth.issuer({
    issuer: `${supabaseUrl}/auth/v1`,
    acceptedAudiences: "authenticated",
    jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
  }),
  tools: [listServices, listShopProducts, listPortfolio, listBlogPosts, submitContactMessage],
});
