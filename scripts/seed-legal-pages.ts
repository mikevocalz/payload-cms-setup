import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload.config";

const legalPages = [
  {
    slug: "about",
    title: "About DVNT",
    subtitle: "Building authentic connections in a verified community",
    effectiveDate: "January 2026",
    lastUpdated: "January 2026",
    content: `## Our Mission

DVNT is a social platform designed for authentic connections within a verified community. We believe that meaningful interactions happen when people feel safe and confident in who they're connecting with.

## Community Focus

Our platform prioritizes:

• **Verified Identities** - Every member undergoes identity verification
• **Safe Spaces** - Robust moderation and community standards
• **Authentic Connections** - Real people, real conversations
• **Privacy First** - Your data stays yours

## Why DVNT?

In a world of anonymous interactions and fake profiles, DVNT stands apart by requiring verification while still protecting your privacy. We verify you're real without exposing who you are.`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    subtitle: "How we collect, use, and protect your information",
    effectiveDate: "January 2026",
    lastUpdated: "January 2026",
    content: `## Information We Collect

We collect information you provide directly, including:

• Account information (email, username, profile details)
• Verification documents (processed securely, not stored long-term)
• Content you create (posts, messages, comments)
• Usage data and analytics

## How We Use Your Information

Your information is used to:

• Provide and improve our services
• Verify your identity
• Personalize your experience
• Ensure platform safety
• Communicate important updates

## Data Protection

We implement industry-standard security measures:

• End-to-end encryption for messages
• Secure data storage
• Regular security audits
• Limited employee access

## Your Rights

You have the right to:

• Access your data
• Request data deletion
• Export your information
• Opt out of marketing communications

## Contact

For privacy inquiries, contact our privacy team through the app settings.`,
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    subtitle: "Agreement governing your use of DVNT",
    effectiveDate: "January 2026",
    lastUpdated: "January 2026",
    content: `## Acceptance of Terms

By accessing or using DVNT, you agree to be bound by these Terms of Service.

## Eligibility

To use DVNT, you must:

• Be at least 18 years old
• Complete identity verification
• Provide accurate information
• Not be prohibited from using the service

## User Conduct

You agree to:

• Treat others with respect
• Not harass, bully, or threaten others
• Not share illegal or harmful content
• Not impersonate others
• Follow our Community Standards

## Account Responsibilities

You are responsible for:

• Maintaining account security
• All activity under your account
• Keeping your information accurate

## Termination

We may suspend or terminate accounts that violate these terms or our Community Standards.

## Limitation of Liability

DVNT is provided "as is" without warranties. We are not liable for user-generated content or interactions.

## Changes to Terms

We may update these terms. Continued use constitutes acceptance of changes.`,
  },
  {
    slug: "community-standards",
    title: "Community Standards & Code of Conduct",
    subtitle: "Guidelines for a respectful and safe community",
    effectiveDate: "January 2026",
    lastUpdated: "January 2026",
    content: `## Our Values

DVNT is built on respect, authenticity, and safety. These standards ensure everyone can participate in a positive environment.

## Expected Behavior

• **Be Respectful** - Treat all members with dignity
• **Be Authentic** - Represent yourself honestly
• **Be Supportive** - Contribute positively to discussions
• **Be Mindful** - Consider how your words affect others

## Prohibited Content

The following is not allowed:

• Hate speech or discrimination
• Harassment or bullying
• Sexual content or exploitation
• Violence or threats
• Spam or misleading content
• Illegal activities
• Doxxing or privacy violations

## Reporting

If you encounter violations, report them through the app. All reports are reviewed by our moderation team.

## Enforcement

Violations may result in:

• Content removal
• Temporary suspension
• Permanent account ban
• Legal action if warranted

## Appeals

You may appeal moderation decisions through our support system.`,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    subtitle: "Common questions about DVNT",
    effectiveDate: "January 2026",
    lastUpdated: "January 2026",
    content: `## Getting Started

Find answers to common questions about using DVNT below. For additional help, contact our support team.`,
    faqs: [
      {
        category: "General",
        question: "What is DVNT?",
        answer:
          "DVNT is a social platform for verified users. We combine identity verification with privacy protection to create authentic connections in a safe environment.",
      },
      {
        category: "General",
        question: "Is DVNT free to use?",
        answer:
          "DVNT offers a free tier with core features. Premium subscriptions are available for enhanced features and capabilities.",
      },
      {
        category: "Verification",
        question: "Why do I need to verify my identity?",
        answer:
          "Identity verification ensures all members are real people, reducing fake accounts, bots, and bad actors. This creates a safer, more authentic community.",
      },
      {
        category: "Verification",
        question: "How does verification work?",
        answer:
          "You submit a government ID and take a selfie. Our secure system verifies the match, then immediately deletes the documents. We only store verification status, not the documents themselves.",
      },
      {
        category: "Privacy",
        question: "Is my personal information safe?",
        answer:
          "Yes. We use industry-standard encryption and security practices. Verification documents are processed and deleted immediately. We never sell your data.",
      },
      {
        category: "Privacy",
        question: "Can other users see my real identity?",
        answer:
          "No. Other users only see your chosen username and profile. Your legal name and verification documents are never shared.",
      },
      {
        category: "Account",
        question: "How do I delete my account?",
        answer:
          "Go to Settings > Account > Delete Account. This permanently removes your profile, content, and data. This action cannot be undone.",
      },
      {
        category: "Account",
        question: "What happens if I get suspended?",
        answer:
          "Suspensions occur for Community Standards violations. You will receive notification explaining the reason. You may appeal through our support system.",
      },
    ],
  },
  {
    slug: "eligibility",
    title: "Eligibility Criteria",
    subtitle: "Requirements to join DVNT",
    effectiveDate: "January 2026",
    lastUpdated: "January 2026",
    content: `## Age Requirement

You must be at least 18 years old to use DVNT.

## Identity Verification

All users must complete identity verification:

• Valid government-issued photo ID
• Live selfie for facial matching
• Accurate personal information

## Accepted Documents

We accept:

• Passport
• Driver's License
• National ID Card
• State/Province ID

## Geographic Availability

DVNT is available in most countries. Some regions may have restrictions due to local regulations.

## Account Limits

• One account per person
• Business accounts available separately
• Multiple accounts will be suspended

## Ineligible Users

You cannot use DVNT if you:

• Have been permanently banned
• Are under 18 years of age
• Cannot complete identity verification
• Are prohibited by law from using social platforms`,
  },
  {
    slug: "identity-protection",
    title: "How DVNT Protects Your Identity",
    subtitle: "Our commitment to your privacy and security",
    effectiveDate: "January 2026",
    lastUpdated: "January 2026",
    content: `## Verification Without Exposure

We verify you're real without exposing who you are. Here's how:

## Document Handling

• **Immediate Processing** - Documents are verified in seconds
• **No Storage** - Documents are deleted immediately after verification
• **Encrypted Transit** - All uploads use end-to-end encryption
• **Secure Partners** - We use certified identity verification services

## What We Store

After verification, we only keep:

• Verification status (verified/not verified)
• Verification date
• Nothing else

We DO NOT store:

• Photos of your ID
• Your legal name
• Your address
• Your ID numbers

## Profile Privacy

• Use any username you want
• Share only what you choose
• Control who sees your content
• Block users at any time

## Technical Security

• SOC 2 compliant infrastructure
• Regular security audits
• Bug bounty program
• 24/7 security monitoring

## Your Control

You can:

• Review what data we have
• Export your data
• Delete your account
• Revoke verification (requires re-verification to use platform)`,
  },
  {
    slug: "ad-policy",
    title: "Ethical Advertising Policy",
    subtitle: "How advertising works on DVNT",
    effectiveDate: "January 2026",
    lastUpdated: "January 2026",
    content: `## Our Advertising Philosophy

DVNT believes advertising can be helpful without being invasive. We maintain strict standards for all ads on our platform.

## What We Allow

• Products and services relevant to our community
• Clear, honest advertising
• Properly labeled sponsored content
• Verified advertiser accounts

## What We Prohibit

• Misleading or false claims
• Adult content
• Illegal products or services
• Discriminatory targeting
• Political manipulation
• Data harvesting ads

## Your Privacy in Advertising

• We never sell your personal data
• Ads are based on general interests, not personal tracking
• You can opt out of personalized ads
• We don't share your data with advertisers

## Transparency

• All ads are clearly labeled
• Sponsored content is marked
• You can see why you're shown an ad
• Report problematic ads easily

## Creator Partnerships

Content creators may partner with brands. These partnerships must:

• Be disclosed clearly
• Follow our content guidelines
• Not mislead users
• Comply with local regulations

## Feedback

Report ads that violate these policies through the app. We review all reports promptly.`,
  },
];

async function seedLegalPages() {
  console.log("Starting legal pages seed...");

  try {
    const payload = await getPayload({ config });

    for (const page of legalPages) {
      const existing = await payload.find({
        collection: "legal-pages",
        where: {
          slug: {
            equals: page.slug,
          },
        },
      });

      if (existing.docs.length > 0) {
        console.log(`Updating: ${page.title}`);
        await payload.update({
          collection: "legal-pages",
          id: existing.docs[0].id,
          data: page,
        });
      } else {
        console.log(`Creating: ${page.title}`);
        await payload.create({
          collection: "legal-pages",
          data: page,
        });
      }
    }

    console.log("\n✅ Legal pages seeded successfully!");
    console.log(`Created/updated ${legalPages.length} pages`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding legal pages:", error);
    process.exit(1);
  }
}

seedLegalPages();
