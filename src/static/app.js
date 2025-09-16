document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset UI containers
      activitiesList.innerHTML = "";
      // Reset the select so we don't duplicate options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Helper to safely escape HTML (minimal)
      function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (m) => {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
        });
      }

      // Helper to create initials from an email/name
      function getInitials(email) {
        const namePart = String(email).split("@")[0] || "";
        const tokens = namePart.split(/[\._\-]/).filter(Boolean);
        if (tokens.length === 0) return namePart.slice(0, 2).toUpperCase() || "?";
        if (tokens.length === 1) return (tokens[0].slice(0, 2) || tokens[0].slice(0,1)).toUpperCase();
        return (tokens[0][0] + (tokens[1][0] || "")).slice(0, 2).toUpperCase();
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        let participantsSection = "";
        const participants = Array.isArray(details.participants) ? details.participants : [];

        if (participants.length === 0) {
          participantsSection = `<p class="no-participants">No participants yet</p>`;
        } else {
          const items = participants
            .map((p) => {
              const initials = escapeHtml(getInitials(p));
              const emailEscaped = escapeHtml(p);
              return `<li><span class="avatar">${initials}</span><span class="participant-email">${emailEscaped}</span></li>`;
            })
            .join("");
          participantsSection = `<ul class="participants-list">${items}</ul>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants <span class="count">${participants.length}</span></h5>
            ${participantsSection}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = `${name} (${spotsLeft} spots left)`;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to immediately show the new participant and updated availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
