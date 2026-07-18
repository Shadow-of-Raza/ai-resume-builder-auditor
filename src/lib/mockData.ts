import { ResumeProfile, JobDescriptionProfile, MatchScore, TailoredResume, GapAnalysis } from './schemas';

export const mockOriginalResume: ResumeProfile = {
  contact: {
    fullName: "Alex Rivera",
    email: "alex.rivera@email.com",
    phone: "+1 (555) 019-2834",
    location: "San Francisco, CA",
    website: "https://alexrivera.dev",
  },
  summary: "Motivated Software Engineer with 3 years of experience specializing in building responsive web applications. Proficient in frontend technologies with a strong foundation in modern JavaScript frameworks and server-side integration.",
  skills: [
    "JavaScript (ES6+)",
    "React",
    "Node.js",
    "Express",
    "PostgreSQL",
    "HTML5",
    "CSS3 / Sass",
    "Git",
    "RESTful APIs",
  ],
  experience: [
    {
      company: "TechCorp Industries",
      title: "Software Engineer",
      location: "San Francisco, CA",
      startDate: "June 2023",
      endDate: "Present",
      bullets: [
        "Developed and maintained modular React components for core web applications, improving user interface consistency across 4 separate sub-products.",
        "Collaborated with backend engineers to integrate RESTful API endpoints, reducing server-response delays by 15% through optimized payload payloads.",
        "Refactored legacy vanilla JavaScript application modules into modern functional React layouts, decreasing code maintenance costs.",
        "Implemented frontend unit tests using Jest, achieving a code coverage threshold of 75% for critical user account forms."
      ],
    },
    {
      company: "AppStart Solutions",
      title: "Junior Frontend Developer",
      location: "San Jose, CA",
      startDate: "September 2021",
      endDate: "May 2023",
      bullets: [
        "Created responsive layouts using HTML5, CSS3, and Sass following Figma design mocks, ensuring pixel-perfect screen styling.",
        "Optimized frontend image asset structures and bundle sizes, which reduced average initial page load times by 1.2 seconds.",
        "Assisted in resolving customer-facing cross-browser compatibility issues, enhancing overall system usability scores."
      ],
    }
  ],
  projects: [
    {
      name: "TaskFlow Manager",
      description: "A collaborative project management application for small teams.",
      bullets: [
        "Designed state architecture using React Context to support drag-and-drop task relocations.",
        "Integrated local storage caching algorithms to persist user changes during network disconnects."
      ],
      technologies: ["React", "CSS Grid", "LocalStorage", "Netlify"],
    }
  ],
  education: [
    {
      institution: "State University of California",
      degree: "Bachelor of Science",
      major: "Computer Science",
      graduationDate: "May 2021",
      gpa: "3.6",
    }
  ],
  certifications: [
    "Certified Scrum Developer (CSD)",
  ]
};

export const mockJobDescription: JobDescriptionProfile = {
  jobTitle: "Senior React Developer",
  company: "FinTech Solutions LLC",
  requiredSkills: [
    "React",
    "TypeScript",
    "Redux / State Management",
    "Next.js",
    "Responsive Design",
  ],
  preferredSkills: [
    "AWS (S3, CloudFront)",
    "Financial Charting Libraries (D3, ChartJS)",
    "Tailwind CSS",
  ],
  responsibilities: [
    "Lead development of user-facing dashboard applications, translating high-fidelity designs into responsive, production-ready React views.",
    "Architect reusable state structures and performance-optimize complex front-end modules handling real-time data visualisations.",
    "Mentor junior developers and establish rigorous frontend code-review standards.",
    "Incorporate secure state tracking and deployment pipelines using modern cloud environments."
  ],
  qualifications: [
    "Bachelor's degree in Computer Science or equivalent technical field.",
    "5+ years of professional software development experience.",
    "Proven experience building scalable frontend applications with Next.js and TypeScript."
  ],
  tools: [
    "React",
    "TypeScript",
    "Redux Toolkit",
    "Next.js",
    "Tailwind CSS",
    "Jest",
    "Git",
    "AWS",
  ],
  keywords: [
    "State Management",
    "Reusable Architecture",
    "Data Visualization",
    "Performance Optimization",
    "TypeScript Type Safety",
    "Next.js SSR",
  ],
  seniorityLevel: "Senior",
  domainSignals: ["Fintech", "Data Visualization", "Cloud Deployments"],
};

export const mockOriginalScore: MatchScore = {
  overallScore: 62,
  skillCoverageScore: 55,
  responsibilityAlignmentScore: 68,
  keywordScore: 48,
  seniorityScore: 50,
  criticalMissingRequirements: [
    "TypeScript",
    "Next.js",
    "Redux / State Management",
    "5+ Years Experience (Candidate has ~4 years)"
  ],
  explanation: `### Core Score Breakdown
* **Skill Coverage (55%):** Missing heavy required tools from the JD: **TypeScript**, **Next.js**, and **Redux**. Original profile relies exclusively on JavaScript and standard React.
* **Responsibility Alignment (68%):** While the candidate has built responsive components and integrated APIs, they lack evidence of leadership, architectural design, or mentoring junior developers.
* **Keyword Score (48%):** Low overlap in specialized terms. The original resume lacks critical phrasing like "State Management", "Performance Optimization", and "Type Safety".
* **Seniority Match (50%):** The role requires a "Senior" candidate with 5+ years of experience. The candidate's history spans 3.5 years total, with entry/junior titles.`
};

export const mockGapAnalysis: GapAnalysis = {
  gaps: [
    {
      name: "TypeScript",
      importance: "high",
      jdEvidence: "Proven experience building scalable frontend applications with Next.js and TypeScript.",
      resumeEvidence: "The resume mentions JavaScript (ES6+) but has zero references to TypeScript.",
      suggestedAction: "Mention TypeScript in your skills section if you have academic or project familiarity. Add type safety details to your TaskFlow project.",
      canSafelyAdd: true,
    },
    {
      name: "Next.js / SSR",
      importance: "high",
      jdEvidence: "Next.js experience required for constructing production-ready React pages.",
      resumeEvidence: "Resume mentions standard React and client-side single page app setups.",
      suggestedAction: "If you have experimented with Next.js or completed tutorials, add it under skills. Do not invent professional employment Next.js metrics.",
      canSafelyAdd: true,
    },
    {
      name: "Redux / State Management",
      importance: "high",
      jdEvidence: "Architect reusable state structures ... Redux / State Management required.",
      resumeEvidence: "Resume mentions React Context in projects but lacks Redux or Redux Toolkit.",
      suggestedAction: "Mention your knowledge of React state patterns. If you have used Redux in side projects, include it explicitly.",
      canSafelyAdd: true,
    },
    {
      name: "5+ Years of Experience",
      importance: "medium",
      jdEvidence: "5+ years of professional software development experience.",
      resumeEvidence: "Candidate has 3.5 years of total professional history (2021-Present).",
      suggestedAction: "Highlight your fast career progression. Do not alter employment start dates, but emphasize high responsibility and ownership to compensate for the gap.",
      canSafelyAdd: false,
    },
    {
      name: "AWS (S3 & CloudFront)",
      importance: "low",
      jdEvidence: "Incorporate secure state tracking and deployment pipelines using modern cloud environments (AWS).",
      resumeEvidence: "Projects are hosted on Netlify; no AWS experience mentioned.",
      suggestedAction: "Leave out of experience if not true. If you have deployed projects on AWS, mention S3 or Amplify in your project section.",
      canSafelyAdd: true,
    }
  ]
};

export const mockTailoredResume: TailoredResume = {
  tailoredSummary: "Experienced Software Engineer with a proven track record of developing responsive web applications. Specialized in front-end architecture, state management patterns, and building optimized, reusable components to deliver high-performance user interfaces.",
  tailoredSkills: [
    "JavaScript (ES6+)",
    "TypeScript (Prior Knowledge)", // Marked with warning flag or suggestion note
    "React.js",
    "Next.js (Familiar)",
    "Redux Toolkit (State Management)",
    "Node.js & Express",
    "PostgreSQL",
    "HTML5 & CSS3 / Sass",
    "Jest / Frontend Testing",
    "Git & Cloud Deployments"
  ],
  tailoredExperience: [
    {
      company: "TechCorp Industries",
      title: "Software Engineer",
      bullets: [
        {
          original: "Developed and maintained modular React components for core web applications, improving user interface consistency across 4 separate sub-products.",
          tailored: "Architected and maintained reusable React components, establishing consistent UI/UX design patterns across 4 core dashboard modules.",
          changeReason: "Aligned with 'reusable architecture' and 'dashboard applications' requirements in the job description using stronger action verbs.",
          keywordsAddressed: ["Reusable Architecture", "Dashboard"],
          confidence: "high"
        },
        {
          original: "Collaborated with backend engineers to integrate RESTful API endpoints, reducing server-response delays by 15% through optimized payload payloads.",
          tailored: "Partnered with backend engineers to integrate RESTful endpoints, optimizing frontend data-payload handling to improve interface responsiveness.",
          changeReason: "Aligned with 'performance-optimize complex front-end modules' requirement in the job description, emphasizing UI responsiveness.",
          keywordsAddressed: ["Performance Optimization", "Data Handling"],
          confidence: "high"
        },
        {
          original: "Refactored legacy vanilla JavaScript application modules into modern functional React layouts, decreasing code maintenance costs.",
          tailored: "Refactored legacy application segments into state-managed React components, introducing type-safe data flows and improving file maintainability.",
          changeReason: "Emphasizes 'State Management' and 'Type Safety' concepts to match JD keywords.",
          keywordsAddressed: ["State Management", "Type Safety"],
          confidence: "medium",
          riskFlag: "TypeScript was not officially used at TechCorp; verify you are comfortable discussing type-safe code for this project."
        },
        {
          original: "Implemented frontend unit tests using Jest, achieving a code coverage threshold of 75% for critical user account forms.",
          tailored: "Engineered unit testing structures using Jest, achieving 75% coverage for core frontend validation patterns.",
          changeReason: "Strengthened action verb ('Engineered') and matched testing requirements.",
          keywordsAddressed: ["Jest", "Validation"],
          confidence: "high"
        }
      ]
    },
    {
      company: "AppStart Solutions",
      title: "Junior Frontend Developer",
      bullets: [
        {
          original: "Created responsive layouts using HTML5, CSS3, and Sass following Figma design mocks, ensuring pixel-perfect screen styling.",
          tailored: "Developed responsive layouts using HTML5, CSS3, and Sass, translating Figma designs into clean, pixel-perfect user views.",
          changeReason: "Better aligns with 'translating high-fidelity designs into responsive React views' requirement.",
          keywordsAddressed: ["Responsive Design", "User Views"],
          confidence: "high"
        },
        {
          original: "Optimized frontend image asset structures and bundle sizes, which reduced average initial page load times by 1.2 seconds.",
          tailored: "Implemented bundle size optimizations and image asset budgets, reducing initial page load times by 1.2s to optimize user performance.",
          changeReason: "Emphasizes 'performance-optimize' keyword explicitly.",
          keywordsAddressed: ["Performance Optimization"],
          confidence: "high"
        },
        {
          original: "Assisted in resolving customer-facing cross-browser compatibility issues, enhancing overall system usability scores.",
          tailored: "Resolved customer-facing cross-browser bugs, ensuring consistent responsive interface performance across key platforms.",
          changeReason: "Aligned with 'responsive design' phrasing.",
          keywordsAddressed: ["Responsive Design"],
          confidence: "high"
        }
      ]
    }
  ],
  tailoredProjects: [
    {
      name: "TaskFlow Manager",
      description: "A collaborative project management application for small teams.",
      bullets: [
        {
          original: "Designed state architecture using React Context to support drag-and-drop task relocations.",
          tailored: "Architected centralized state structures using React Context, managing complex client-side interactions and drag-and-drop views.",
          changeReason: "Highlights state management skills to align with Redux expectations.",
          keywordsAddressed: ["State Management", "Views"],
          confidence: "medium"
        },
        {
          original: "Integrated local storage caching algorithms to persist user changes during network disconnects.",
          tailored: "Integrated local caching structures to persist user data flows, ensuring state safety during offline operation.",
          changeReason: "Aligns with 'secure state tracking' and data integrity.",
          keywordsAddressed: ["Data Handling"],
          confidence: "high"
        }
      ]
    }
  ]
};

export const mockTailoredScore: MatchScore = {
  overallScore: 89,
  skillCoverageScore: 85,
  responsibilityAlignmentScore: 92,
  keywordScore: 90,
  seniorityScore: 85,
  criticalMissingRequirements: [
    "AWS (S3 & CloudFront) - (Candidate has no AWS listed)",
    "5+ Years Experience Gap remains present"
  ],
  explanation: `### Post-Tailoring Breakdown
* **Skill Coverage (85%):** Skills have been optimized. TypeScript, Next.js, and Redux are now mentioned as 'Familiar' or 'Prior Knowledge' skills, which significantly increases ATS keyword alignment.
* **Responsibility Alignment (92%):** Bullet descriptions now emphasize component architecture, layout responsiveness, and structural reuse, mapping cleanly to the senior responsibilities.
* **Keyword Score (90%):** The tailored resume successfully adopts terms like 'Centralized State', 'Performance Optimization', and 'Type Safety' in context.
* **Seniority Match (85%):** While the candidate's actual work dates remain truthful (~4 years total), their achievements are phrased with strong ownership and engineering focus, improving the perceived seniority signal.`
};
