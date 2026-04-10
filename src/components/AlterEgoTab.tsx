"use client";

import Image from "next/image";

const COURSES = [
  {
    name: "Silver",
    color: "#C0C0C0",
    badge: "/images/aep/silver.png",
    prereq: "Cleared to self-supervise after AFF",
    desc: "Learn the essentials of canopy flight. A great foundation for all experience levels — covers pattern work, accuracy on landings, various input methods, flight modes, and emergency procedures. Includes USPA B License Canopy Card sign-off.",
    topics: [
      "Basic aerodynamics of canopy flight",
      "Pattern work and landing accuracy",
      "Emergency maneuvers",
      "Navigation from distant jump spots",
      "Different canopy flight modes",
    ],
  },
  {
    name: "Yellow",
    color: "#FFD700",
    badge: "/images/aep/yellow.png",
    prereq: "Silver Course Certification",
    desc: "Build confidence and precision following the Silver course. Learn about weather phenomena and how they affect your canopy, harness inputs, combined control inputs, and introduction to front riser usage.",
    topics: [
      "Weather phenomena affecting canopy flight",
      "Harness input techniques",
      "Combined control inputs",
      "Introduction to front riser usage",
      "Body positioning effects on canopy performance",
    ],
  },
  {
    name: "Orange",
    color: "#FF8C00",
    badge: "/images/aep/orange.png",
    prereq: "Yellow Course Certification",
    desc: "Combines everything from the first two courses. Addresses off-dropzone landings and teaches precision landing techniques for unknown areas and small spaces.",
    topics: [
      "Pattern adjustment techniques",
      "Off-dropzone and unknown landing procedures",
      "Obstacle avoidance during landing",
      "Turn reversals and dive recovery",
      "Half-braked approaches",
    ],
  },
  {
    name: "Grey",
    color: "#808080",
    badge: "/images/aep/grey.png",
    prereq: "Yellow Course Certification + B-License",
    desc: "Cement your foundation from previous courses. This course will have you flying inches away from another canopy in complete control. Focuses on relative canopy flight.",
    topics: [
      "Combining multiple control inputs",
      "Exit techniques and efficient regrouping",
      "Relative canopy flight",
      "Nonverbal communication for formation skydiving",
    ],
  },
  {
    name: "Green",
    color: "#228B22",
    badge: "/images/aep/green.png",
    prereq: "Orange Course Certification + Coach Evaluation",
    desc: "Advanced precision landings and target accuracy. Learn pattern adjustments, pre-jump preparations, and professional tricks to land on target regardless of conditions.",
    topics: [
      "In-depth pattern adjustments",
      "Detailed pre-jump preparation",
      "Rear riser landing techniques",
      "Quick on-target landing methods",
      "Professional drills and control techniques",
    ],
  },
  {
    name: "Blue",
    color: "#1E90FF",
    badge: "/images/aep/blue.png",
    prereq: "Yellow or Grey Certification + Coach Evaluation",
    desc: "Intro to swooping. Learn how to safely employ double front risers and build up extra speed for landings near the ground.",
    topics: [
      "Safety essentials for high-performance landings",
      "Pattern adjustments for swooping",
      "Front riser techniques near ground level",
      "Proper and safe recovery inputs",
      "90-degree turns",
    ],
  },
  {
    name: "Red",
    color: "#DC143C",
    badge: "/images/aep/red.png",
    prereq: "Blue Course Certification + Coach Evaluation",
    desc: "Maximize speed and power. Explores advanced turning techniques from 270-degree maneuvers through 810-degree rotations with precision inputs.",
    topics: [
      "270-degree turn progression",
      "Rear riser utilization during recovery arcs",
      "Advanced canopy diving mechanics",
      "Precision lane and gate entry techniques",
      "Competition-level turns (450s, 630s, 810s)",
    ],
  },
  {
    name: "Black",
    color: "#1a1a1a",
    textColor: "#ffffff",
    badge: null,
    prereq: "Red Course Certification + Coach Evaluation",
    desc: "The elite course — not for the faint of heart. Combines competitive strategy, freestyle aerobatics, synchronized team maneuvers, and extended relative work (XRW) flight techniques.",
    topics: [
      "In-depth competition course strategy",
      "Competition freestyle moves",
      "High-performance team landings",
      "XRW flight",
    ],
  },
  {
    name: "Pink",
    color: "#FF69B4",
    badge: "/images/aep/pink.png",
    prereq: "Silver criteria level or higher",
    desc: "All-female course where women teach women canopy piloting skills. A supportive environment for building confidence and mastering landing techniques. Covers Silver through Black criteria.",
    topics: [
      "Parachute flight techniques and confidence-building",
      "Canopy control and landing optimization",
      "Challenges unique to female skydivers under canopy",
      "Structured skill progression",
    ],
  },
  {
    name: "White",
    color: "#f0f0f0",
    badge: "/images/aep/white.png",
    prereq: "200 jumps minimum + Coach Evaluation",
    desc: "Aerial photography and videography course. Learn to capture any style — tandem videos, freefly formations, belly formations, air-to-air canopy shots, and swoop filming.",
    topics: [
      "Identifying optimal angles for aerial photography",
      "Selecting correct flight positions",
      "Tandem video best practices",
      "Air-to-air canopy photography",
      "Filming canopy flock formations",
    ],
  },
];

const HERO_IMAGES = [
  "/images/aep/hero1.jpg",
  "/images/aep/hero2.jpg",
  "/images/aep/hero3.jpg",
  "/images/aep/hero4.jpg",
  "/images/aep/hero5.jpg",
];

const TEAM_MEMBERS = [
  {
    name: "Curt Bartholomew",
    image: "/images/aep/curt.jpg",
    role: "Co-Founder, Meet Director, 10x World Champion",
    bio: "13,000+ jumps, 100+ BASE jumps. 199 competitions with 118 overall wins. 22-time US CP Team member, 14-time national champion. Triple Crown holder (World Championship, World Games, World Cup). Owner of FLCPA/USCPA.",
  },
  {
    name: "Jeannie Bartholomew",
    image: "/images/aep/jeannie.jpg",
    role: "Co-Founder, USPA National Director",
    bio: "12,000+ jumps. Pro canopy pilot, 13x US Parachute Team member, 2x World Games competitor. International Champion (1st Overall 2017 Italian Swoop Tour), 3x Freestyle CP Team Champion. AFF Instructor and canopy coach.",
  },
  {
    name: "Alex Hart",
    image: "/images/aep/alex.jpg",
    role: "Team Athlete, DZ Owner",
    bio: "9,000+ jumps. Professional Exhibition Rating. Multiple podium finishes at US CP Nationals. Based at Start Skydiving, Cincinnati.",
  },
  {
    name: "Ryan Brownlow",
    image: "/images/aep/ryan.jpg",
    role: "Team Athlete, Software Designer",
    bio: "8,000+ jumps. 3-time US CP Team representative. FAA Senior Rigger. Multiple California Regional league victories. Based at Bay Area Skydiving.",
  },
  {
    name: "Marcos Darman",
    image: "/images/aep/marcos.jpg",
    role: "Coach, Tandem/AFF Instructor",
    bio: "7,500+ jumps. 4th year Argentina CP Team member. Argentina Speed Record holder. Multi-discipline instructor and business coach.",
  },
  {
    name: "Franco Darman",
    image: "/images/aep/franco.jpg",
    role: "Coach, Videographer, AFF Instructor",
    bio: "4,400+ jumps. 2-year Argentina CP Team member. 3rd Place 2016 Argentinian CP Championship. FAI World Championship competitor.",
  },
];

const SPONSORS = [
  { name: "Performance Designs", logo: "/images/aep/pd-logo.png", url: "https://flypd.com" },
  { name: "UPT Vector", logo: "/images/aep/vector-logo.png", url: "https://uptvector.com" },
  { name: "Cookie Composites", logo: "/images/aep/cookie-logo.png", url: "https://cookiecomposites.com" },
  { name: "FlySight", logo: "/images/aep/flysight-logo.png", url: "https://flysight.ca" },
  { name: "Larsen & Brusgaard", logo: "/images/aep/lb-logo.png", url: "https://l-and-b.dk" },
  { name: "SSK Inc", logo: "/images/aep/ssk-logo.png", url: "https://sskinc.com" },
  { name: "Skydive Sebastian", logo: "/images/aep/sebastian-logo.png", url: "https://skydivesebastian.com" },
  { name: "USCPA", logo: "/images/aep/uscpa-logo.png", url: "https://swoopleague.com" },
];

const INSTRUCTORS = [
  "Curt Bartholomew", "Jeannie Bartholomew", "Alex Hart", "Marcos Darman", "Franco Darman",
  "Timothy Parrant", "Jonny K", "Konstantin Kunts", "Christian Bonaldo", "Allison Reay",
  "Dario Meloni", "Jeremy Thornton", "Justin Fuller", "John Haley", "Joey Allen",
  "Lauren Gawlik", "Nick Peck", "Jake Carlow", "Nick Robinson", "Daniel Toro Perez",
  "Kazu Oyama", "Yannick Bisson", "Nil Farre Berge", "Leon Dieser", "Fang Huang",
  "Luke Curnow", "Max Lesziak", "Zack Krampitz", "Logan Mahone", "Brandon Radcliff",
  "William Middlebrooks", "Daniel Adams", "Raz Malka", "Adam Mason", "Olga Naumova",
  "Liam Wertheimer", "Zoe Palmer",
];

export default function AlterEgoTab() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="relative w-64 h-16 mx-auto mb-4">
          <Image
            src="/images/aep/logo.png"
            alt="The Alter Ego Project"
            fill
            className="object-contain"
          />
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Founded in 2009, The Alter Ego Project is a canopy coaching school built by a group of
          highly skilled athletes specializing in canopy piloting. Their structured, color-coded
          course system takes skydivers from fundamentals through elite competition-level swooping.
        </p>
      </div>

      {/* Photo Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-12 rounded-xl overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <div key={i} className="relative aspect-[4/3]">
            <Image
              src={src}
              alt={`Alter Ego Project action photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 mb-10">
        <h3 className="text-lg font-bold text-[var(--accent-gold)] mb-3">Course Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Group Course</p>
            <p className="text-[var(--foreground)] font-bold text-lg">$185 <span className="text-gray-500 font-normal text-sm">/ person</span></p>
            <p className="text-gray-500 text-xs">One day, minimum 5 jumps</p>
          </div>
          <div>
            <p className="text-gray-400">1-on-1 Coaching</p>
            <p className="text-[var(--foreground)] font-bold text-lg">$450 <span className="text-gray-500 font-normal text-sm">+ jump costs</span></p>
          </div>
          <div>
            <p className="text-gray-400">2-on-1 Coaching</p>
            <p className="text-[var(--foreground)] font-bold text-lg">$250 <span className="text-gray-500 font-normal text-sm">/ person + jumps</span></p>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-3">$75 non-refundable deposit required. Pricing may vary by location.</p>
      </div>

      {/* Course Progression */}
      <h2 className="text-2xl font-bold text-[var(--accent-cyan)] mb-6 uppercase tracking-wide">
        Course Progression
      </h2>

      <div className="space-y-4">
        {COURSES.map((course) => (
          <div
            key={course.name}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden"
          >
            {/* Color stripe */}
            <div className="h-1.5 w-full" style={{ backgroundColor: course.color }} />

            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Badge */}
                {course.badge && (
                  <div className="relative w-20 h-6 flex-shrink-0 mt-1">
                    <Image
                      src={course.badge}
                      alt={`${course.name} course badge`}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3
                      className="text-lg font-bold"
                      style={{ color: course.name === "Black" ? "#ffffff" : course.color }}
                    >
                      {course.name} Course
                    </h3>
                    <span className="text-xs text-gray-500 border border-[var(--card-border)] rounded px-2 py-0.5">
                      {course.prereq}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-3">{course.desc}</p>

                  <div className="flex flex-wrap gap-2">
                    {course.topics.map((topic) => (
                      <span
                        key={topic}
                        className="text-xs bg-white/5 text-gray-400 rounded-full px-3 py-1"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Members */}
      <h2 className="text-2xl font-bold text-[var(--accent-cyan)] mt-12 mb-6 uppercase tracking-wide">
        Team Athletes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {TEAM_MEMBERS.map((member) => (
          <div
            key={member.name}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden"
          >
            <div className="relative h-40 w-full">
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-[var(--foreground)]">{member.name}</h3>
              <p className="text-xs text-[var(--accent-gold)] mb-2">{member.role}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{member.bio}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Instructors */}
      <h2 className="text-2xl font-bold text-[var(--accent-cyan)] mb-4 uppercase tracking-wide">
        Certified Instructors
      </h2>
      <p className="text-gray-400 text-sm mb-4">
        {INSTRUCTORS.length} coaches worldwide delivering Alter Ego Project courses.
      </p>
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 mb-12">
        <div className="flex flex-wrap gap-2">
          {INSTRUCTORS.map((name) => (
            <span
              key={name}
              className="text-sm bg-white/5 text-gray-300 rounded-full px-3 py-1.5"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Sponsors */}
      <h2 className="text-2xl font-bold text-[var(--accent-gold)] mb-6 uppercase tracking-wide">
        Sponsors & Partners
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {SPONSORS.map((sponsor) => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex items-center justify-center hover:border-gray-500 transition-colors"
          >
            <div className="relative w-full h-12">
              <Image
                src={sponsor.logo}
                alt={sponsor.name}
                fill
                className="object-contain"
                sizes="200px"
              />
            </div>
          </a>
        ))}
      </div>

      {/* Links */}
      <div className="mt-10 text-center space-y-2">
        <a
          href="https://thealteregoproject.com/courses"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent-cyan)] hover:underline text-sm"
        >
          Visit thealteregoproject.com for full course details →
        </a>
        <div className="flex justify-center gap-4 text-sm text-gray-500">
          <a
            href="https://www.facebook.com/teamalteregofastrax/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/teamalteregofastrax/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            Instagram
          </a>
          <a
            href="http://vimeo.com/teamalterego"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            Vimeo
          </a>
        </div>
      </div>
    </div>
  );
}
