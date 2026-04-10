import { getDb } from "./db";
import bcrypt from "bcryptjs";

export function runSeed() {
  const db = getDb();

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@swoopleague.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme";
  const existing = db.prepare("SELECT id FROM admin WHERE email = ?").get(adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare("INSERT INTO admin (email, password_hash, name) VALUES (?, ?, ?)").run(
      adminEmail,
      hash,
      "Admin"
    );
    console.log(`Seeded admin: ${adminEmail}`);
  }

  // Seed 2026 events
  const eventCount = db.prepare("SELECT COUNT(*) as count FROM event").get() as { count: number };
  if (eventCount.count === 0) {
    const insertEvent = db.prepare(`
      INSERT INTO event (name, type, start_date, end_date, location_name, location_city, coach, description, banner_image_url, facebook_event_url, flat_price_cents, member_price_cents, non_member_price_cents, late_price_cents, late_registration_date, status, sort_order, instructor, course_name, course_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?)
    `);

    const meets = [
      {
        name: "Meet #1 Registration 2026",
        start: "2026-03-07",
        end: "2026-03-08",
        loc: "Skydive City",
        city: "Zephyrhills, FL",
        coach: "Sean Haysom",
        desc: "The USCPA 2026 Season kicks off with Meet #1 at Skydive City in Florida.",
        banner: "/images/events/meet1.jpg",
      },
      {
        name: "Meet #2 Registration 2026",
        start: "2026-04-11",
        end: "2026-04-12",
        loc: "Skydive Sebastian",
        city: "Sebastian, FL",
        coach: "Curt Bartholomew",
        desc: "Meet #2 at Skydive Sebastian. Come enjoy the fantastic view!",
        banner: "/images/events/meet2.jpg",
      },
      {
        name: "Meet #3 Registration 2026",
        start: "2026-05-16",
        end: "2026-05-17",
        loc: "Skydive Paraclete XP",
        city: "Raeford, NC",
        coach: "TBD",
        desc: "Meet #3 at Skydive Paraclete XP. A staple in the league since 2009!",
        banner: "/images/events/meet3.jpg",
      },
      {
        name: "Meet #4 Registration 2026",
        start: "2026-06-13",
        end: "2026-06-14",
        loc: "West Tennessee Skydiving",
        city: "Memphis, TN",
        coach: "TBD",
        desc: "Meet #4 near Memphis, TN. The battle for Gold continues!",
        banner: "/images/events/meet4.jpg",
      },
      {
        name: "Meet #5 Registration 2026",
        start: "2026-09-20",
        end: "2026-09-21",
        loc: "Skydive City",
        city: "Zephyrhills, FL",
        coach: "TBD",
        desc: "Season finale at Skydive City, just prior to US Nationals.",
        banner: "/images/events/meet5.jpg",
      },
    ];

    // Meet pricing: member $75, non-member $95, late $115
    const meetMemberPrice = 7500;
    const meetNonMemberPrice = 9500;
    const meetLatePrice = 11500;

    const seedAll = db.transaction(() => {
      meets.forEach((m, i) => {
        // late_registration_date = 2 weeks before start
        const lateDate = new Date(m.start);
        lateDate.setDate(lateDate.getDate() - 14);
        const lateDateStr = lateDate.toISOString().split("T")[0];

        insertEvent.run(
          m.name, "meet", m.start, m.end, m.loc, m.city, m.coach, m.desc, m.banner,
          null, null, meetMemberPrice, meetNonMemberPrice, meetLatePrice, lateDateStr,
          i, null, null, null
        );
      });

      // League registration ($99 flat)
      insertEvent.run(
        "League Registration 2026", "league", null, null, null, null, null,
        "Register for the USCPA 2026 Season standings. Eligible for trophies and member pricing.", null, null, 9900, null, null, null, null, 10, null, null, null
      );

      // Freestyle (same pricing as meets)
      insertEvent.run(
        "Pilots of the Caribbean 2026", "freestyle", "2026-07-11", "2026-07-12",
        "Skydive Beaufort", "Beaufort, NC", "Curt Bartholomew",
        "Annual FREESTYLE competition. Practice combos and learn what judges look for!", "/images/events/freestyle.jpg", null, null, meetMemberPrice, meetNonMemberPrice, meetLatePrice, "2026-06-27", 6, null, null, null
      );

      // Team registration ($60 flat)
      insertEvent.run(
        "Team Registration 2026", "team", null, null, null, null, null,
        "Join with 1 other person in the same class. $60 one-time fee for the team.", null, null, 6000, null, null, null, null, 11, null, null, null
      );

      // Canopy courses (Alter Ego Project color system — from FB event flyers)
      const courses = [
        {
          name: "Bay Area Skydiving — Canopy Coaching",
          courseName: "Yellow — Intermediate Canopy Flight",
          color: "yellow",
          start: "2026-04-12",
          end: "2026-04-12",
          loc: "Bay Area Skydiving",
          city: "Byron, CA",
          instructor: "TJ Landgren",
          desc: "Yellow course — Intermediate Canopy Flight at Bay Area Skydiving. Front riser approaches, carving turns, and speed management.",
          capacity: 12,
          price: 20000,
          fbUrl: "https://www.facebook.com/events/1479977097178266/",
          banner: "/images/courses/bay-area-apr12.jpg",
        },
        {
          name: "Skydive Sebastian — Canopy Coaching",
          courseName: "All Courses: Silver, Yellow, Orange, Green, Rainbow, Blue, Red",
          color: "silver",
          start: "2026-04-17",
          end: "2026-04-19",
          loc: "Skydive Sebastian",
          city: "Sebastian, FL",
          instructor: "Curt & Jeannie Bartholomew",
          desc: "Full course weekend at Skydive Sebastian — Silver, Yellow, Orange, Green, Rainbow, Blue, and Red courses all available.",
          capacity: 20,
          price: 25000,
          fbUrl: "https://www.facebook.com/events/1588577689003226/",
          banner: "/images/courses/sebastian-apr17.jpg",
        },
        {
          name: "Skydive Carolina — Canopy Coaching",
          courseName: "Yellow & Orange",
          color: "orange",
          start: "2026-04-26",
          end: "2026-04-26",
          loc: "Skydive Carolina",
          city: "Chester, SC",
          instructor: "John Haley",
          desc: "Yellow and Orange courses at Skydive Carolina with John Haley.",
          capacity: 12,
          price: 25000,
          fbUrl: "https://www.facebook.com/events/956483863729282/",
          banner: "/images/courses/carolina-apr26.jpg",
        },
        {
          name: "Skyhigh Eschbach — Canopy Coaching",
          courseName: "Silver (May 9) & Yellow (May 10)",
          color: "silver",
          start: "2026-05-09",
          end: "2026-05-10",
          loc: "Skyhigh Eschbach",
          city: "Eschbach, Germany",
          instructor: "Leon Dieser",
          desc: "Silver course on May 9th, Yellow course on May 10th at Fallschirmsport Skyhigh e.V. in Germany.",
          capacity: 16,
          price: 25000,
          fbUrl: "https://www.facebook.com/events/1429429148457999/",
          banner: "/images/courses/eschbach-may09.jpg",
        },
        {
          name: "Bay Area Skydiving — Canopy Coaching",
          courseName: "Silver — B-License",
          color: "silver",
          start: "2026-05-17",
          end: "2026-05-17",
          loc: "Bay Area Skydiving",
          city: "Byron, CA",
          instructor: "TJ Landgren",
          desc: "Silver B-License course at Bay Area Skydiving with TJ Landgren.",
          capacity: 12,
          price: 20000,
          fbUrl: "https://www.facebook.com/events/910526124948127/",
          banner: "/images/courses/bay-area-may17.jpg",
        },
        {
          name: "Skydive California — Canopy Coaching",
          courseName: "All Courses: Silver, Yellow, Orange, Green, Rainbow, Blue, Red",
          color: "silver",
          start: "2026-05-22",
          end: "2026-05-24",
          loc: "Skydive California",
          city: "Tracy, CA",
          instructor: "Mark Schetter",
          desc: "Full course weekend — Silver, Yellow, Orange, Green, Rainbow, Blue, and Red courses all available. Multi-day event at Skydive California.",
          capacity: 30,
          price: 25000,
          fbUrl: "https://www.facebook.com/events/1307222501090167/",
          banner: "/images/courses/california-may22.jpg",
        },
        {
          name: "Skydive Carolina — Canopy Coaching",
          courseName: "Silver & Yellow",
          color: "silver",
          start: "2026-05-31",
          end: "2026-05-31",
          loc: "Skydive Carolina",
          city: "Chester, SC",
          instructor: "John Haley",
          desc: "Silver and Yellow courses at Skydive Carolina with John Haley.",
          capacity: 12,
          price: 20000,
          fbUrl: "https://www.facebook.com/events/1260352592292119/",
          banner: "/images/courses/carolina-may31.jpg",
        },
        {
          name: "Skydive Carolina — Canopy Coaching",
          courseName: "Yellow & Orange",
          color: "orange",
          start: "2026-06-28",
          end: "2026-06-28",
          loc: "Skydive Carolina",
          city: "Chester, SC",
          instructor: "John Haley",
          desc: "Yellow and Orange courses at Skydive Carolina with John Haley.",
          capacity: 12,
          price: 25000,
          fbUrl: "https://www.facebook.com/events/1591150112114135/",
          banner: "/images/courses/carolina-jun28.jpg",
        },
        {
          name: "Connecticut Parachutists — Canopy Coaching",
          courseName: "Multi-Course Weekend",
          color: "green",
          start: "2026-07-18",
          end: "2026-07-19",
          loc: "Connecticut Parachutists",
          city: "Ellington, CT",
          instructor: "Alter Ego Project",
          desc: "Multi-day canopy coaching at Connecticut Parachutists.",
          capacity: 16,
          price: 25000,
        },
        {
          name: "Skydive Carolina — Canopy Coaching",
          courseName: "Canopy Coaching",
          color: "yellow",
          start: "2026-07-26",
          end: "2026-07-26",
          loc: "Skydive Carolina",
          city: "Chester, SC",
          instructor: "John Haley",
          desc: "Canopy coaching at Skydive Carolina.",
          capacity: 12,
          price: 20000,
        },
        {
          name: "Skydive Orange — Canopy Coaching",
          courseName: "Multi-Course Weekend",
          color: "orange",
          start: "2026-08-28",
          end: "2026-08-30",
          loc: "Skydive Orange",
          city: "Orange, VA",
          instructor: "Alter Ego Project",
          desc: "Multi-day canopy coaching weekend at Skydive Orange.",
          capacity: 20,
          price: 25000,
        },
        {
          name: "Skydive Sebastian — Canopy Coaching",
          courseName: "Multi-Course Weekend",
          color: "blue",
          start: "2026-11-06",
          end: "2026-11-08",
          loc: "Skydive Sebastian",
          city: "Sebastian, FL",
          instructor: "Curt & Jeannie Bartholomew",
          desc: "Multi-day canopy coaching at Skydive Sebastian with Curt & Jeannie Bartholomew.",
          capacity: 20,
          price: 25000,
        },
        {
          name: "Skydive Sebastian — Canopy Coaching",
          courseName: "Multi-Course Weekend",
          color: "red",
          start: "2026-12-11",
          end: "2026-12-13",
          loc: "Skydive Sebastian",
          city: "Sebastian, FL",
          instructor: "Curt & Jeannie Bartholomew",
          desc: "End of year canopy coaching at Skydive Sebastian with Curt & Jeannie Bartholomew.",
          capacity: 20,
          price: 25000,
        },
      ];

      courses.forEach((c, i) => {
        const result = insertEvent.run(
          c.name, "course", c.start, c.end, c.loc, c.city, null, c.desc, c.banner || null, c.fbUrl || null, c.price, null, null, null, null, 20 + i, c.instructor, c.courseName, c.color
        );
        // Set capacity
        db.prepare("UPDATE event SET capacity = ? WHERE id = ?").run(c.capacity, result.lastInsertRowid);
      });
    });

    seedAll();
    console.log("Seeded 2026 USCPA events");
  }
}

