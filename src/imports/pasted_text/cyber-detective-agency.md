Design a modern, responsive web application called "The Cyber Detective Agency" — a cybersecurity awareness and training platform where users become detectives investigating suspicious emails and learning safe online habits.

The overall experience should feel like working inside a professional detective case-file board mixed with a modern cyber forensics lab. The interface should feel serious, trustworthy, educational, and premium—not playful or cartoonish.

────────────────────────────────────────
VISUAL STYLE
────────────────────────────────────────

Use a dark investigative theme.

Color Palette

• Background: #10192B
• Panel Background: #0A111E
• Primary Accent: #E2A23B
• Highlight Accent: #F4BC5E
• Paper Cards: #F1E9D2
• Paper Text: #241D12
• Danger: #C1443C
• Safe: #4A8B6F
• Secondary Text: #9AA4B5

Typography

• Headings: Special Elite or Courier Prime
• Body: IBM Plex Sans or Inter
• Labels/Tags: IBM Plex Mono

Use subtle detective-inspired elements:

• Corkboard texture
• Manila folders
• Case file tabs
• Evidence tags
• Rubber stamps
• Paper clips
• Red string connectors
• Pin marks
• Confidential labels
• File folders
• Blueprint grid overlay
• Very light paper texture (5–10% opacity)

Keep everything clean and modern.

Avoid:

• Neon cyberpunk
• Glassmorphism
• Cartoon styling
• Gaming UI
• Excessive clutter

────────────────────────────────────────
DESIGN SYSTEM
────────────────────────────────────────

• 8px spacing system
• Max content width: 1280px
• Border radius: 6px
• Soft paper shadows
• Smooth 250ms ease transitions
• WCAG AA accessible contrast
• Consistent icon style
• Modern UI components
• High-fidelity design
• Use Auto Layout throughout
• Create reusable components
• Follow an 8-point grid

────────────────────────────────────────
NAVIGATION
────────────────────────────────────────

Create a fixed top navigation bar.

Left:
Circular badge logo with "CD"

Center:
THE CYBER DETECTIVE AGENCY

Right Navigation Links:

• Case Files
• Forensics Lab
• Field Manual
• Scan Bay

Navbar remains visible while scrolling.

────────────────────────────────────────
SECTION 1 — HERO
────────────────────────────────────────

Place a large rotated red "CLASSIFIED" stamp in one corner.

Eyebrow Label:
Agency Case Load: Active

Headline:
Every email is a suspect until proven innocent.

Supporting text:

Explain that the platform teaches users to identify phishing emails, analyze suspicious messages, improve browser security, and develop cybersecurity awareness through interactive detective-style investigations.

Buttons:

Primary:
Open Case Files

Secondary:
Enter Forensics Lab

Hero background should contain subtle investigation graphics including blueprint grid lines, evidence connectors, paper notes, and investigation markings.

────────────────────────────────────────
SECTION 2 — CASE FILE NO. 01
Phishing Detection Quiz
────────────────────────────────────────

Display:

SCORE: 0 / 5

Create five realistic manila-folder evidence cards.

Each card contains:

• Evidence ID
• Sender
• Reply-To
• Subject
• Date
• Email Body
• Attachments (optional)
• Highlighted Links
• Risk Tags

Buttons:

🚩 Suspect (Phishing)

✅ Clear (Legit)

After answering:

• Disable both buttons
• Expand a verdict panel
• Green if correct
• Red if incorrect

Explain clearly why the email is phishing or legitimate.

Cards should resemble printed investigation documents placed inside a detective folder.

────────────────────────────────────────
SECTION 3 — CASE FILE NO. 02
Forensics Lab
────────────────────────────────────────

Create a dark terminal-inspired panel.

Large textarea:

Paste the email content here...

Primary Button:

Run Analysis

Results should display:

• Animated Risk Meter
(Green → Amber → Red)

• Risk Score (0–100)

• Threat Level

LOW

MODERATE

HIGH

• Overall Verdict

• Suspicious Domains

• Urgency Language

• Spoofed Sender Detection

• Grammar Analysis

• Suspicious Attachments

• Recommendations

Display investigation clue cards.

Each clue includes either:

⚠ Warning

or

✓ Safe

Example clues:

⚠ Urgency language detected

⚠ Suspicious shortened URL

✓ SPF/DKIM validation passed

✓ Trusted sender domain

────────────────────────────────────────
SECTION 4 — CASE FILE NO. 03
Field Manual
────────────────────────────────────────

Responsive Grid

Desktop:
4 Columns

Tablet:
2 Columns

Mobile:
1 Column

Create eight security tip cards.

Topics:

• HTTPS Verification
• Password Managers
• Two-Factor Authentication
• Browser Extension Audits
• Software Updates
• Public Wi-Fi & VPN
• Hover Before Clicking Links
• Verify Unexpected Urgent Requests

Each card contains:

• Icon
• Title
• One-line explanation

Hover Effects:

• Slight lift
• Amber glow
• Soft shadow

────────────────────────────────────────
SECTION 5 — CASE FILE NO. 04
Scan Bay
────────────────────────────────────────

Centered forensic scanner panel.

Primary Button:

Start System Scan

Animated Progress Bar

Terminal Console

Console logs appear one by one.

Example:

> Initializing scanner...

> Loading threat signatures...

> Scanning browser extensions...

> Checking downloads...

> Inspecting startup programs...

> Reviewing browser permissions...

> Detecting suspicious scripts...

> Generating final report...

After completion display a report card.

Title:

Scan Complete — 3 Items Flagged

Example Results:

High Risk
Password Reuse Detected

Medium Risk
Suspicious Browser Extension

Low Risk
Outdated Browser Version

Display educational recommendations underneath.

Italic Disclaimer:

This is a simulated educational demonstration and does not perform a real antivirus scan.

────────────────────────────────────────
FOOTER
────────────────────────────────────────

Centered text:

Built for awareness, not surveillance. Stay sharp out there, agent.

────────────────────────────────────────
ANIMATIONS
────────────────────────────────────────

Use smooth modern animations.

• Fade + Slide on scroll
• Buttons scale to 1.03 on hover
• Cards lift 6px
• Soft amber glow on hover
• Risk meter fills smoothly
• Progress bar animates
• Terminal lines appear sequentially
• Verdict cards expand smoothly
• Smooth page transitions
• Interactive hover effects across cards

────────────────────────────────────────
RESPONSIVE DESIGN
────────────────────────────────────────

Desktop:
Full multi-column layout.

Tablet:
Balanced two-column layout.

Mobile:

• Stack all sections vertically
• Hero buttons stack
• Cards become full width
• Navigation becomes compact (no hamburger required)
• Comfortable spacing for touch devices

────────────────────────────────────────
OVERALL FEEL
────────────────────────────────────────

The interface should feel like a blend of:

• A professional cybercrime investigation dashboard
• A government intelligence case file
• A digital forensics laboratory
• A Security Operations Center (SOC)
• A modern cybersecurity awareness platform

The design should communicate professionalism, investigation, trust, security awareness, and education while remaining clean, premium, and highly usable.

Generate a polished high-fidelity Figma design using Auto Layout, reusable components, design tokens, responsive layouts, consistent spacing, modern UI patterns, and developer-ready screens. The final design should be visually striking, realistic, production-ready, and suitable for handoff to frontend developers.