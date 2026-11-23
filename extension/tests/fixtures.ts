export const APPLY_URL = "https://jobs.example.test/acme/123/apply";

export const fillData = {
  application: { publicId: "app-1", title: "Frontend Engineer", company: "Acme" },
  candidate: {
    firstName: "Ada",
    lastName: "Lovelace",
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+44 7700 900123",
    location: "London",
    linkedinUrl: "https://linkedin.com/in/ada",
    githubUrl: null,
    portfolioUrl: null,
    authorizedCountries: ["United Kingdom"],
    requiresSponsorship: false,
    willingToRelocate: true,
    salaryMin: 90000,
    salaryCurrency: "GBP",
    noticePeriodWeeks: 4,
    yearsExperience: 6,
  },
  answers: [{ question: "Why do you want to work at Acme?", answer: "I want to build tools engineers love." }],
  coverLetter: null,
  resume: { path: "/api/extension/resume?application=app-1", tailored: true },
};

export const resumeBase64 = Buffer.from("%PDF-1.4 test resume").toString("base64");

export const applicationForm = `<!doctype html>
<html><body>
<form id="step-1">
  <label for="first">First name *</label><input id="first" name="first" required>
  <label for="last">Last name *</label><input id="last" name="last" required>
  <label for="email">Email *</label><input id="email" name="email" value="kept@example.com" required>
  <label for="phone">Phone</label><input id="phone" name="phone">
  <label for="linkedin">LinkedIn profile</label><input id="linkedin" name="linkedin">
  <label for="sponsor">Will you now or in the future require visa sponsorship?</label>
  <select id="sponsor" name="sponsor"><option value="">Select...</option><option value="y">Yes</option><option value="n">No</option></select>
  <fieldset><legend>Are you willing to relocate?</legend>
    <input type="radio" id="rel-yes" name="relocate" value="yes"><label for="rel-yes">Yes</label>
    <input type="radio" id="rel-no" name="relocate" value="no"><label for="rel-no">No</label>
  </fieldset>
  <label for="why">Why do you want to work at Acme? *</label><textarea id="why" name="why" required></textarea>
  <label for="resume">Resume/CV *</label><input type="file" id="resume" name="resume" required>
  <label for="gender">Gender</label>
  <select id="gender" name="gender"><option value="">Decline</option><option>Female</option><option>Male</option></select>
  <label for="color">Favourite colour *</label><input id="color" name="color" required>
  <button type="button" id="next">Next</button>
</form>
<div id="step-2" style="display:none">
  <label for="city">Current city</label><input id="city" name="city">
</div>
<script>
  window.reactSeen = [];
  document.getElementById("first").addEventListener("input", (event) => window.reactSeen.push(event.target.value));
  document.getElementById("next").addEventListener("click", () => {
    document.getElementById("step-1").style.display = "none";
    document.getElementById("step-2").style.display = "block";
    setTimeout(() => {
      const extra = document.createElement("div");
      extra.innerHTML = '<label for="notice">What is your notice period?</label><input id="notice" name="notice">';
      document.body.append(extra);
    }, 200);
  });
</script>
</body></html>`;
