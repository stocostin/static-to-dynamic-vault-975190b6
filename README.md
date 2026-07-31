# Pixel Perfect CMS

You are a Senior Full Stack Software Engineer, Senior UI/UX Engineer, Database Architect, DevOps Engineer, Security Engineer, SEO Expert, and Software Architect.

You are performing a migration project, NOT a redesign project.

Your task is to convert my existing static HTML/CSS/JavaScript website into a fully dynamic CMS-powered website while preserving 100% of the existing design, structure, behavior, styling, responsiveness, and user experience.

PROJECT OBJECTIVE

Convert my existing static website into a fully dynamic website that can be managed through an Admin CMS.

The website already looks exactly how I want it.

Do NOT redesign anything.

The only objective is to remove hardcoded content and make everything editable through the CMS.

CRITICAL REQUIREMENT (HIGHEST PRIORITY)

THIS IS NOT A REDESIGN.

Treat the current HTML website as the master design.

The final dynamic website must be visually indistinguishable from the current static version.

If I open both websites side by side, they must appear identical.

ZERO PIXEL DIFFERENCE POLICY

There must be zero intentional visual differences.

Do NOT change:

 Layout

 Sections

 Colors

 Typography

 Font sizes

 Font family

 Font weights

 Spacing

 Margins

 Padding

 Border radius

 Shadows

 Gradients

 Backgrounds

 Buttons

 Icons

 Images

 Card styles

 Navigation

 Header

 Footer

 Forms

 Animations

 Hover effects

 JavaScript interactions

 Scroll animations

 Mobile responsiveness

 Tablet responsiveness

 Desktop responsiveness

 Breakpoints

 CSS classes (unless technically necessary for dynamic rendering)

 HTML structure (unless technically necessary)

 IDs

 Existing JavaScript functionality

Do not modernize.

Do not improve.

Do not simplify.

Do not "make it cleaner."

Do not "use better UI."

Do not replace the design.

Do not introduce your own styling.

The frontend must remain exactly as it is.

ALLOWED CHANGES

The ONLY permitted frontend changes are those required to replace hardcoded content with dynamic content.

Examples:

Instead of:

<h1>Brandify Media</h1>

Convert to:

<h1>{{hero.title}}</h1>

while keeping:

 Same HTML

 Same CSS classes

 Same styling

 Same JavaScript

 Same spacing

 Same animation

EXISTING WEBSITE

My project is already built using:

 HTML5

 CSS3

 JavaScript

Every page already exists.

Every section already exists.

The website already has the desired UI and UX.

Do NOT rebuild the website.

Instead, transform it into a CMS-driven website.

PRIMARY GOAL

Remove every hardcoded value from the website.

Every editable item should come from the database.

Nothing should require editing HTML files again.

TECHNOLOGY STACK

Use:

Frontend

 Existing HTML

 Existing CSS

 Existing JavaScript

Reuse all existing frontend code wherever possible.

Backend

Use one of:

 Laravel
or

 Node.js (Express)

Choose whichever best fits the existing project while minimizing frontend changes.

Database

Use:

Supabase PostgreSQL

Authentication

Use:

Supabase Auth

Storage

Use:

Supabase Storage

Store:

 Images

 Videos

 PDFs

 Documents

ADMIN CMS

Create a professional admin panel.

Features:

 Login

 Dashboard

 Sidebar

 User Management

 Roles

 Permissions

 Activity Logs

 Notifications

 Dark Mode

 Profile Settings

 Change Password

 Two Factor Authentication

 Session Management

PAGE MANAGEMENT

Every page must become editable.

Examples:

 Home

 About

 Services

 Portfolio

 Projects

 Blog

 Gallery

 Testimonials

 Team

 FAQs

 Contact

 Privacy Policy

 Terms

 Header

 Footer

Admin must be able to:

 Create pages

 Edit pages

 Delete pages

 Publish pages

 Save Drafts

 Restore deleted pages

 Duplicate pages

HERO SECTION

Make editable:

 Title

 Subtitle

 Buttons

 Background Image

 Background Video

 Statistics

 Overlay

 Scroll Indicator

 CTA

The appearance must remain identical.

SERVICES

CMS should manage:

 Service Name

 Description

 Icon

 Image

 Order

 Featured

 Category

Unlimited services.

PORTFOLIO

Unlimited projects.

Each project:

 Title

 Images

 Gallery

 Client

 Description

 Completion Date

 Categories

 Featured

 SEO

BLOG

Complete blogging system.

Support:

 Categories

 Tags

 Drafts

 Scheduling

 Rich Text Editor

 Featured Images

 SEO

 Comments

 Search

GALLERY

Support:

 Albums

 Categories

 Images

 Videos

 Sorting

 Lightbox

 Lazy Loading

 Compression

TESTIMONIALS

Editable:

 Photo

 Name

 Company

 Position

 Rating

 Review

 Featured

TEAM

Editable:

 Photo

 Name

 Position

 Biography

 Social Links

 Skills

 Contact Information

CONTACT PAGE

Editable:

 Phone

 WhatsApp

 Email

 Address

 Google Maps

 Working Hours

Contact forms should save submissions into the database.

MEDIA LIBRARY

Support:

 Images

 Videos

 PDFs

 Word

 Excel

 SVG

 Audio

 ZIP

Features:

 Search

 Folder Management

 Compression

 Cropping

 Bulk Upload

 Bulk Delete

 Bulk Rename

MENU MANAGEMENT

Admin should manage:

 Navigation

 Dropdowns

 Mega Menus

 Links

 Ordering

 Visibility

GLOBAL SETTINGS

Editable:

 Logo

 Favicon

 Business Name

 Business Details

 Footer

 Header

 Social Links

 Colors

 Fonts

 Analytics

 Cookie Banner

 Newsletter

FORMS

Every form should:

Save submissions

Allow admin to:

 Search

 Filter

 Export

 Delete

 Reply

 Mark Read

SEO

Every page supports:

 SEO Title

 Meta Description

 Keywords

 Slug

 Canonical URL

 Open Graph

 Twitter Cards

 Schema.org

 Sitemap

 Robots.txt

 Alt Text

PERFORMANCE

Implement:

 Image Optimization

 Lazy Loading

 Minification

 Compression

 Caching

 Pagination

 Database Indexing

 CDN Ready

Without changing the appearance.

SECURITY

Implement:

 CSRF Protection

 XSS Protection

 SQL Injection Protection

 Authentication

 Authorization

 Input Validation

 Rate Limiting

 Secure Sessions

 Password Hashing

 Audit Logs

DATABASE

Create a complete Supabase schema.

Examples:

 users

 roles

 permissions

 pages

 sections

 menus

 settings

 media

 services

 projects

 gallery

 albums

 blogs

 blog_categories

 blog_tags

 testimonials

 team

 contact_messages

 newsletters

 seo

 redirects

 social_links

 activity_logs

Use proper:

 Foreign Keys

 Indexes

 Relationships

 Constraints

API

Create REST APIs for all modules.

Support:

 GET

 POST

 PUT

 PATCH

 DELETE

Include:

 Validation

 Authentication

 Pagination

 Filtering

 Search

FILE STRUCTURE

Organize professionally.

Example:

/
├── admin/
├── api/
├── assets/
├── auth/
├── backend/
├── components/
├── config/
├── database/
├── helpers/
├── middleware/
├── public/
├── routes/
├── services/
├── storage/
├── uploads/
├── utils/
└── frontend/

MIGRATION PROCESS

Before writing a single line of code:

Analyze the existing website.

Produce a report listing:

 Every page

 Every component

 Every section

 Every hardcoded text

 Every image

 Every button

 Every menu

 Every form

 Every gallery

 Every testimonial

 Every service

 Every project

 Every contact detail

Then determine:

 Which database table will store it

 Which CMS module will manage it

 Any dependencies

 Any migration risks

Only after the report is complete should development begin.

CONTENT MIGRATION

Move every hardcoded item into Supabase.

Nothing should remain hardcoded.

Examples include:

 Headings

 Paragraphs

 Buttons

 Images

 Videos

 Logos

 Menus

 Icons

 Social Links

 Contact Details

 Footer Content

 Copyright

 Statistics

 Testimonials

 Services

 Projects

 Blog Posts

 Team Members

 FAQs

 Meta Tags

FRONTEND PRESERVATION RULES

Reuse the existing HTML.

Reuse the existing CSS.

Reuse the existing JavaScript.

Do not replace working code simply because there is another way.

If dynamic rendering requires modifications, make the smallest possible changes.

Never rewrite the frontend unnecessarily.

QUALITY ASSURANCE

After migration, automatically perform a verification process.

Compare the original HTML website with the converted CMS website.

Confirm:

 Every page matches.

 Every animation matches.

 Every spacing matches.

 Every color matches.

 Every font matches.

 Every responsive breakpoint matches.

 Every interaction matches.

 Every hover effect matches.

 Every section matches.

 Every image placement matches.

 Every JavaScript feature works.

If any visual difference exists, fix it before considering the migration complete.

DELIVERABLES

Produce:

 Migration Analysis Report

 Supabase Database Schema

 SQL Migration Scripts

 Backend Application

 REST API

 Admin CMS

 Authentication System

 Role & Permission System

 Media Library

 SEO Module

 Global Settings Module

 Forms Management

 File Upload System

 Environment Configuration (.env.example)

 Installation Guide

 Deployment Guide

 Backup & Restore Strategy

 Seed Data

 Error Handling

 Logging System

 Automated Tests

 Performance Optimizations

 Security Hardening

 Production-Ready Source Code

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://static-to-dynamic-vault.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c521e136-d3b2-4105-9573-35dd64eda750).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
